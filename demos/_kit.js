// Shared by the engine demos (not an engine module): a titled field and small labels.
import { field } from '../engine/collage.js';
import { L } from '../engine/layout.js';
import { W, fields, fonts, sizes, tracking } from '../tokens.js';

// The demo's field and its title on the safe top.
export function frame(ctx, title, f = fields.paper) {
  field(ctx, f.fill);
  ctx.font = `400 ${sizes.h2}px ${fonts.display}`;
  ctx.letterSpacing = `${tracking.display * sizes.h2}px`;
  ctx.fillStyle = f.text;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(title, L.left, L.top);
  ctx.letterSpacing = '0px';
}

// A small caps label (Inter Tight 700) with its baseline at y.
export function label(ctx, text, x, y, { color, align = 'left' } = {}) {
  ctx.save();
  ctx.font = `700 ${sizes.label}px ${fonts.label}`;
  ctx.letterSpacing = `${tracking.label * sizes.label}px`;
  ctx.fillStyle = color ?? '#141414';
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(text.toUpperCase(), x, y);
  ctx.restore();
}
export { W };
