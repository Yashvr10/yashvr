// FROZEN: read-only from phase 7 on. Need something it lacks? Write it in your scene file and report it (NOTES.md).
// Virtual 2D camera. A camera is { s, x, y, r }: scale and rotation about the frame centre,
// then a pan in px. Scenes draw every layer through withCamera, each at a declared depth z.
import { clamp01 } from './ease.js';
import { W, H, motion } from '../tokens.js';

export const IDENTITY = { s: 1, x: 0, y: 0, r: 0 };
// Layer depths for layerScale.
export const Z = { far: 0.4, subject: 1, fore: 1.3 };
// The largest scale defaultPush reaches, and its drift amplitudes in px.
export const PUSH = motion.push, DRIFT = { x: 6, y: 4 };

export function withCamera(ctx, cam, draw) {
  ctx.save();
  ctx.translate(W / 2 + cam.x, H / 2 + cam.y);
  ctx.rotate(cam.r);
  ctx.scale(cam.s, cam.s);
  ctx.translate(-W / 2, -H / 2);
  draw(ctx);
  ctx.restore();
}

// Linear push 1.00 → 1.04 over the scene, plus a slow 6 × 4 px sine drift.
export function defaultPush(t, dur) {
  return {
    s: 1 + PUSH * clamp01(t / dur),
    x: DRIFT.x * Math.sin((2 * Math.PI * t) / 7),
    y: DRIFT.y * Math.sin((2 * Math.PI * t) / 5 + 1),
    r: 0,
  };
}

// The camera as seen by a layer at depth z: its deviation from IDENTITY scaled by z,
// so far layers (0.4) move less than the subject (1) and foreground (1.3) moves more.
export function layerScale(cam, z) {
  return { s: 1 + (cam.s - 1) * z, x: cam.x * z, y: cam.y * z, r: cam.r * z };
}

// A scale hit at tb: jumps by amt, then settles exponentially (under 1% left after 0.3 s).
// Multiply it into cam.s.
export function punch(t, tb, amt = motion.impact) {
  return t < tb ? 1 : 1 + amt * Math.exp(-(t - tb) / 0.065);
}

// The same camera for engine/particles.js, which projects each particle at its own depth.
export const particleCam = (cam) => ({ dx: cam.x, dy: cam.y, z: cam.s - 1 });

// Where to draw a point so that defaultPush's full push and drift never carry it past (x, y):
// for text anchored on a safe edge. Points at the centre stay put.
export const inPush = (x, y) => [
  W / 2 + (x - W / 2 - Math.sign(x - W / 2) * DRIFT.x) / (1 + PUSH),
  H / 2 + (y - H / 2 - Math.sign(y - H / 2) * DRIFT.y) / (1 + PUSH),
];
