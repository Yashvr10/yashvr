// engine/draw.js: a line drawing on, a pulse travelling it, a boiling stroke, a contact shadow
// and shade() steps.
import { drawOn, pulseAlong, boilPath, contactShadow, shade, measure } from '../engine/draw.js';
import { L } from '../engine/layout.js';
import { colors, stroke } from '../tokens.js';
import { frame, label } from './_kit.js';

export const dur = 2, T = 1, captions = [];
const wave = (y) => Array.from({ length: 41 }, (_, i) => [L.left + (L.width * i) / 40, y + 60 * Math.sin(i / 5)]);
const A = wave(L.top + 230), B = wave(L.top + 500), C = wave(L.top + 770);
export async function load() { [A, B, C].forEach(measure); }

export function draw(ctx, t) {
  frame(ctx, 'engine/draw.js');
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = stroke.outline;
  ctx.lineCap = 'round';
  drawOn(ctx, A, 0.6);
  label(ctx, 'drawOn(ctx, pts, 0.6)', L.left, L.top + 340);
  ctx.strokeStyle = colors.dim;
  drawOn(ctx, B, 1);
  pulseAlong(ctx, B, 0.55, { r: 12, gap: 18 });
  label(ctx, 'pulseAlong(ctx, pts, 0.55)', L.left, L.top + 610);
  ctx.strokeStyle = colors.ink;
  boilPath(ctx, C, t, { amp: 4, width: stroke.annotate });
  label(ctx, 'boilPath: hashed jitter, 8 fps', L.left, L.top + 880);
  contactShadow(ctx, L.cx(), L.top + 1000, 420);
  ctx.fillStyle = colors.coral;
  ctx.fillRect(L.cx() - 120, L.top + 860, 240, 140);
  label(ctx, 'contactShadow(ctx, x, y, w)', L.left, L.top + 1060);
  [-0.3, -0.15, 0, 0.15, 0.3].forEach((d, k) => {
    ctx.fillStyle = shade(colors.coral, d);
    ctx.fillRect(L.left + k * (L.width / 5), L.top + 1110, L.width / 5 - 8, 90);
  });
  label(ctx, 'shade(coral, -0.3 … +0.3)', L.left, L.top + 1250);
}
