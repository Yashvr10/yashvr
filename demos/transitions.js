// engine/transitions.js: whip a quarter of the way through, between a yellow scene A and a navy scene B. In 9:16
// (L.stack) it whips vertically; the smear is the 64-tap motion blur.
import { whip } from '../engine/transitions.js';
import { field } from '../engine/collage.js';
import { L } from '../engine/layout.js';
import { fields, fonts, sizes } from '../tokens.js';
import { label } from './_kit.js';

export const dur = 1, T = 0.45, captions = [];
const scene = (f, text) => (c) => {
  field(c, f.fill);
  c.font = `400 ${sizes.giant}px ${fonts.display}`;
  c.fillStyle = f.text;
  c.textAlign = 'center';
  c.fillText(text, L.cx(), L.cy() + sizes.giant * 0.43);
};

export function draw(ctx, t) {
  whip(ctx, t, scene(fields.yellow, 'A'), scene(fields.navy, 'B'), 0.4, 0.2);
  label(ctx, 'whip(…, t0, 0.2) at 25%', L.left, L.top);
}
