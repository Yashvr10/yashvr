// engine/layout.js: the safe band (yellow line), its centre, L.slot(i, 3) (a stack in 9:16,
// columns in 16:9) and rowsOf() re-breaking a line to fit the band.
import { L, rowsOf, baselines } from '../engine/layout.js';
import { W, H, colors, fonts, sizes, captionBand } from '../tokens.js';
import { frame, label } from './_kit.js';

export const dur = 1, T = 0.5, captions = [];

export function draw(ctx) {
  frame(ctx, 'engine/layout.js');
  ctx.lineWidth = 4;
  ctx.strokeStyle = colors.yellow;
  ctx.strokeRect(L.left, L.top, L.width, L.height);
  if (captionBand) {
    ctx.strokeStyle = colors.coral;
    ctx.setLineDash([14, 10]);
    ctx.strokeRect(captionBand.x, captionBand.y, captionBand.w, captionBand.h);
    ctx.setLineDash([]);
  }
  for (let i = 0; i < 3; i++) {
    const { x, y } = L.slot(i, 3);
    ctx.fillStyle = colors.navy;
    ctx.fillRect(x - 90, y - 60, 180, 120);
    label(ctx, `slot(${i}, 3)`, x, y + 100, { align: 'center' });
  }
  ctx.font = `400 ${sizes.hero}px ${fonts.display}`;
  ctx.textAlign = 'center';
  ctx.fillStyle = colors.ink;
  const rows = rowsOf(ctx, 'ONE MILLION PAYMENTS A MONTH', L.width);
  baselines(rows.length, L.bottom + 180, sizes.hero * 1.05).forEach((y, k) => ctx.fillText(rows[k], L.cx(), y));
  label(ctx, `safe band ${L.left},${L.top} → ${L.right},${L.bottom} (${W}×${H})`, L.left, L.top - 70);
}
