// engine/type.js: each move frozen part-way through (its own local time), in Anton.
import { riseIn, scramble, odometer, typeOn, markerWipe } from '../engine/type.js';
import { caption } from '../engine/copy.js';
import { L } from '../engine/layout.js';
import { colors, sizes } from '../tokens.js';
import { frame, label } from './_kit.js';

export const dur = 1, T = 0.5, captions = [];
const ROWS = [
  ['riseIn at 0.25 s', (c, y) => riseIn(c, 0.25, { text: 'RISE IN', x: L.cx(), y, size: sizes.hero })],
  ['scramble at 0.3 s', (c, y) => scramble(c, 0.3, { text: 'SCRAMBLE', x: L.cx(), y, size: sizes.hero })],
  ['odometer at 0.35 s', (c, y) => odometer(c, 0.35, { from: 0, to: 2016, x: L.cx(), y, size: sizes.hero })],
  ['typeOn at 0.3 s', (c, y) => typeOn(c, 0.3, { text: 'TYPE ON', x: L.cx(), y, size: sizes.hero })],
  ['markerWipe at 0.4 s', (c, y) => markerWipe(c, 0.4, { text: 'MARK IT', word: 1, x: L.cx(), y, size: sizes.hero, accent: colors.highlight, on: colors.ink })],
  ['caption (copy.js) at 0.5 s', (c, y) => caption(c, 0.5, 'A caption line', { x: L.cx(), y, size: sizes.h2 })],
];

export function draw(ctx) {
  frame(ctx, 'engine/type.js');
  ROWS.forEach(([name, move], k) => {
    const y = L.top + 230 + k * 205;
    move(ctx, y);
    label(ctx, name, L.left, y + 52, { color: colors.dim });
  });
}
