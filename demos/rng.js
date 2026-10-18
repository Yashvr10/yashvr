// engine/rng.js: hash(i, seed) is stateless, so the same index gives the same value on any frame.
import { hash } from '../engine/rng.js';
import { L } from '../engine/layout.js';
import { colors } from '../tokens.js';
import { frame, label } from './_kit.js';

export const dur = 1, T = 0.5, captions = [];

export function draw(ctx) {
  frame(ctx, 'engine/rng.js');
  // A 24 × 24 grid shaded by hash(i, 7).
  const n = 24, c = L.width / n, y0 = L.top + 120;
  for (let i = 0; i < n * n; i++) {
    ctx.fillStyle = colors.ink;
    ctx.globalAlpha = hash(i, 7);
    ctx.fillRect(L.left + (i % n) * c, y0 + Math.floor(i / n) * c, c - 2, c - 2);
  }
  ctx.globalAlpha = 1;
  label(ctx, 'hash(i, 7): grid shade', L.left, y0 + n * c + 48);
  // 400 points at (hash(i, 1), hash(i, 2)), coloured by hash(i, 3).
  const y1 = y0 + n * c + 110, h = 360;
  for (let i = 0; i < 400; i++) {
    ctx.fillStyle = hash(i, 3) < 0.2 ? colors.accent : colors.ink;
    ctx.beginPath();
    ctx.arc(L.left + hash(i, 1) * L.width, y1 + hash(i, 2) * h, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  label(ctx, 'points at (hash(i, 1), hash(i, 2))', L.left, y1 + h + 48);
}
