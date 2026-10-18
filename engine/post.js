// FROZEN: read-only from phase 7 on. Need something it lacks? Write it in your scene file and report it (NOTES.md).
// GL frame: fbm background, Canvas2D layer composited over it in linear space, then the post chain.
import { createGL, program, target, canvasTexture, uploadCanvas, pass, linearRGB } from './gl.js';
import { W, H, SS, post as look, background } from '../tokens.js';

// thresh is linear luminance. 0.95 keeps our ink (0.88) and accent (0.32) text out of the bloom;
// a scene lowers it per frame when it wants things to glow.
// radial is a zoom blur toward the centre (a fraction of the distance to it), for transitions.
// The look (bloom, ca, vig, grain, exposure, tone, curve, warm, paper) comes from tokens.post.
// paper multiplies the background's texture over every layer (see composite.frag); anything a scene
// draws with drawGL lands in that background, so with paper > 0 it multiplies rather than adds.
export const POST_DEFAULTS = { thresh: 0.95, radial: 0, ...look };
const LEVELS = 5;

export async function createPost(canvas) {
  const gl = createGL(canvas);
  const src = async (name) => (await fetch(`shaders/${name}.frag`)).text();
  const [bg, comp, down, up, fin] = await Promise.all(
    ['bg', 'composite', 'bloom_down', 'bloom_up', 'final'].map(async (n) => program(gl, await src(n), `${n}.frag`)),
  );
  const PW = W * SS, PH = H * SS;
  const back = target(gl, PW, PH), scene = target(gl, PW, PH), layerTex = canvasTexture(gl), threeTex = canvasTexture(gl);
  // Mips stay at W × H halvings whatever SS is, so bloom spreads the same share of the frame.
  const mips = Array.from({ length: LEVELS }, (_, i) => target(gl, W >> (i + 1), H >> (i + 1)));
  const [b0, b1, b2] = background.ramp.map(linearRGB);
  const paperRef = linearRGB(background.ramp[0]);
  const paper = { uBg: b0, uDim: b1, uAccent: b2, uAmt: background.amount, uDrift: background.drift, uFibre: background.fibre, uFibreScale: background.fibreScale * SS };

  // Draws one frame from t and the frame index. layers.layer is the Canvas2D layer; layers.three,
  // if given, a three.js canvas composited under it; layers.drawGL(gl), if given, draws into the
  // background target (linear HDR, behind both). P holds the post settings.
  return function render(t, frame, { layer, three = null, drawGL = null }, P, on = true) {
    uploadCanvas(gl, layerTex, layer);
    if (three) uploadCanvas(gl, threeTex, three);
    pass(gl, bg, back, { uTime: t, uRes: [PW, PH], uFrame: { i: frame }, uOne: { i: 1 }, ...paper });
    if (drawGL) drawGL(gl);
    pass(gl, comp, scene, { uBack: { tex: back.tex }, uThree: { tex: threeTex }, uLayer: { tex: layerTex }, uHasThree: { i: +!!three }, uPaper: P.paper ?? 0, uPaperRef: paperRef });

    // Bloom: 13-tap downsample through LEVELS halvings, then tent upsample added back up.
    // Every level is fully rewritten each frame, so nothing carries over.
    const bloom = on && P.bloom > 0;
    if (bloom) {
      let s = scene;
      mips.forEach((m, i) => {
        pass(gl, down, m, { uSrc: { tex: s.tex }, uTexel: i ? [1 / s.w, 1 / s.h] : [SS / s.w, SS / s.h], uThresh: P.thresh, uPrefilter: { i: +!i } });
        s = m;
      });
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      for (let i = LEVELS - 1; i > 0; i--) {
        pass(gl, up, mips[i - 1], { uSrc: { tex: mips[i].tex }, uTexel: [1 / mips[i].w, 1 / mips[i].h] });
      }
      gl.disable(gl.BLEND);
    }

    pass(gl, fin, null, {
      uScene: { tex: scene.tex }, uBloomTex: { tex: mips[0].tex }, uRes: [PW, PH], uFrame: { i: frame }, uGrainCell: SS,
      uBloom: bloom ? P.bloom : 0, uExposure: P.exposure, uCA: P.ca * SS, uVig: P.vig, uGrain: P.grain, uPost: { i: +on },
      uRadial: P.radial, uOne: { i: 1 }, uTone: P.tone, uCurve: P.curve, uWarm: P.warm,
    });
  };
}
