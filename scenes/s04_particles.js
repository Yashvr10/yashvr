import { win } from '../engine/ease.js';
import {
  motes, moteState, burst, burstState, confetti, confettiState,
  glyphBursts, sparksFromGlyphs, glParticles,
} from '../engine/particles.js';
import { fade, odometer, scramble, glyphsOf, scrambleLocks } from '../engine/type.js';
import { withCamera, defaultPush, layerScale, punch, particleCam, Z } from '../engine/camera.js';
import { W, H, colors } from '../tokens.js';

export const dur = 6;

const EXIT = 0.4;
// Default push and drift, with a punch as the odometer lands. Particles get the camera through
// particleCam and parallax at their own depths; the type is the subject layer.
const camAt = (t) => {
  const cam = defaultPush(t, dur);
  return { ...cam, s: cam.s * punch(t, 2.0) };
};

const MOTES = { n: 600, layers: 3 };
const ODO = { t0: 1.0, from: 0, to: 12840, dur: 1.0, x: W / 2, y: H / 2 + 40, size: 220 };
const BURST = { t0: 2.0, x: W / 2, y: H / 2 - 40, n: 220, speed: 900 };
const CAPTION = {
  t0: 2.15, dur: 0.6, text: 'FRAMES RENDERED', x: W / 2, y: H / 2 + 140,
  family: 'mono', weight: 400, size: 34, track: 0.12, color: colors.dim,
};
const CONFETTI = { t0: 3.2, x: W / 2, y: H * 0.86, n: 160, speed: [1000, 1900], drag: 1.6 };

// Linear, not outCubic: outCubic starts at 3× the average rate and dropped alpha 0.25 in the
// first exit frame (caught by test-particles.mjs). Linear is at most 0.083 per frame.
const exitFade = (t) => 1 - win(t, dur - EXIT, dur);
let caption; // caption glyph layout, measured once at load

export async function load() {
  caption = glyphsOf(new OffscreenCanvas(1, 1).getContext('2d'), CAPTION);
}

// Every Canvas2D particle's alpha at t, in a fixed order, exactly as drawn (scene fade included).
// test-particles.mjs diffs consecutive frames of this.
export function alphas(t) {
  const f = exitFade(t), out = [];
  for (let i = 0; i < MOTES.n; i++) out.push(moteState(i, t, MOTES).a * f);
  for (let i = 0; i < BURST.n; i++) out.push((burstState(i, t - BURST.t0, BURST)?.a ?? 0) * f);
  for (const b of glyphBursts(caption, scrambleLocks(caption, CAPTION.dur), { t0: CAPTION.t0, size: CAPTION.size })) {
    for (let i = 0; i < b.n; i++) out.push((burstState(i, t - b.t0, b)?.a ?? 0) * f);
  }
  for (let i = 0; i < CONFETTI.n; i++) out.push((confettiState(i, t - CONFETTI.t0, CONFETTI)?.a ?? 0) * f);
  return out;
}

function content(ctx, t) {
  const view = camAt(t), cam = particleCam(view);
  motes(ctx, t, { ...MOTES, cam });
  burst(ctx, t, { ...BURST, cam });

  withCamera(ctx, layerScale(view, Z.subject), (c) => {
    odometer(c, t - ODO.t0, ODO);
    scramble(c, t - CAPTION.t0, CAPTION);
  });

  sparksFromGlyphs(ctx, t, caption, scrambleLocks(caption, CAPTION.dur), {
    t0: CAPTION.t0, size: CAPTION.size, cam, colors: [colors.accent],
  });
  confetti(ctx, t, { ...CONFETTI, cam });
}

export function draw(ctx, t) {
  fade(ctx, exitFade(t), 0, (c) => content(c, t));
}

// Deep dust on the GPU, behind everything.
export function drawGL(gl, t) {
  glParticles(gl, t, { cam: particleCam(camAt(t)), size: 2.5, alpha: 0.08 * exitFade(t) });
}
