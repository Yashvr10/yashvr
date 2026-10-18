import { win } from '../engine/ease.js';
import {
  motes, moteState, burst, burstState, confetti, confettiState,
  glyphBursts, sparksFromGlyphs, glParticles,
} from '../engine/particles.js';
import { fade, odometer, scramble, glyphsOf, scrambleLocks } from '../engine/type.js';
import { withCamera, defaultPush, layerScale, punch, particleCam, Z } from '../engine/camera.js';
import { lines, windows, parseNumber, duckAt, DUCK } from '../engine/copy.js';
import { H, colors } from '../tokens.js';
import { L } from '../engine/layout.js';

const ID = 's04_particles';
const T = lines(ID); // [the counted number, its caption]
const NUM = parseNumber(T[0]);

const EXIT = 0.4;
// Default push and drift, with a punch as the odometer lands. Particles get the camera through
// particleCam and parallax at their own depths; the type is the subject layer.
const camAt = (t) => {
  const cam = defaultPush(t, dur);
  return { ...cam, s: cam.s * punch(t, 2.0) };
};

const MOTES = { n: 600, layers: 3 };
// Number, burst and caption sit about the centre of the safe band; type offsets scale with type.
const ODO = { t0: 1.0, from: 0, to: NUM.value, prefix: NUM.prefix, suffix: NUM.suffix, dur: 1.0, x: L.cx(), y: L.cy() + L.type(40), size: L.type(220) };
const BURST = { t0: 2.0, x: L.cx(), y: L.cy() - L.type(40), n: 220, speed: 900 };
const CAPTION = {
  t0: 2.15, dur: 0.6, text: T[1], x: L.cx(), y: L.cy() + L.type(140),
  family: 'mono', weight: 400, size: L.type(34), track: 0.12, color: colors.ink,
};
const CONFETTI = { t0: 3.2, x: L.cx(), y: H * 0.86, n: 160, speed: [1000, 1900], drag: 1.6 };

// Number and caption together are one caption, settled when the caption's scramble locks.
// The total's frame on screen at the scene's last frame, for a match cut out of it.
export const totalRect = { x: L.cx(), y: L.cy() - L.type(36), w: L.type(760), h: L.type(240), r: 24 };

export const captions = windows(ID, [{ lines: [0, 1], in: ODO.t0, at: CAPTION.t0 + CAPTION.dur }]);
export const end = captions[0].out;
export const dur = Math.max(6, end + 0.4);
// Background particle density: 40% lower while the caption is fully visible.
const density = (t) => 1 - DUCK * duckAt(captions, t);

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
  for (let i = 0; i < MOTES.n; i++) out.push(moteState(i, t, { ...MOTES, density: density(t) }).a * f);
  for (let i = 0; i < BURST.n; i++) out.push((burstState(i, t - BURST.t0, BURST)?.a ?? 0) * f);
  for (const b of glyphBursts(caption, scrambleLocks(caption, CAPTION.dur), { t0: CAPTION.t0, size: CAPTION.size })) {
    for (let i = 0; i < b.n; i++) out.push((burstState(i, t - b.t0, b)?.a ?? 0) * f);
  }
  for (let i = 0; i < CONFETTI.n; i++) out.push((confettiState(i, t - CONFETTI.t0, CONFETTI)?.a ?? 0) * f);
  return out;
}

function content(ctx, t) {
  const view = camAt(t), cam = particleCam(view);
  motes(ctx, t, { ...MOTES, cam, density: density(t) });
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
  glParticles(gl, t, { cam: particleCam(camAt(t)), size: 2.5, alpha: 0.08 * exitFade(t), density: density(t) });
}
