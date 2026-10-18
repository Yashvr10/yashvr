// engine/post.js: the full chain on a composition: flat fields, ink type, coral and white shapes,
// all printed on paper (paper texture multiplied over every layer), light vignette, grain.
import { field } from '../engine/collage.js';
import { L } from '../engine/layout.js';
import { W, H, colors, fields, fonts, sizes } from '../tokens.js';
import { label } from './_kit.js';

export const dur = 1, T = 0.5, captions = [];

export function draw(ctx) {
  field(ctx, fields.yellow.fill);
  ctx.fillStyle = fields.navy.fill;
  ctx.fillRect(0, H * 0.62, W, H * 0.38);
  ctx.fillStyle = colors.coral;
  ctx.beginPath();
  ctx.arc(L.cx(), L.cy() - 120, 220, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors.white;
  ctx.fillRect(L.left, L.cy() + 260, L.width, 60);
  ctx.font = `400 ${sizes.hero}px ${fonts.display}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = fields.yellow.text;
  ctx.fillText('PRINTED ON PAPER', L.cx(), L.top + sizes.hero);
  ctx.fillStyle = fields.navy.text;
  ctx.fillText('INK · PAPER · NAVY', L.cx(), H * 0.62 + 200);
  label(ctx, 'paper 1 · vignette 0.12 · grain 0.012', L.left, H * 0.62 + 300, { color: colors.paper });
}
