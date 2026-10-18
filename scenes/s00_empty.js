// An empty frame: the yellow field and nothing else, for checking tokens and the post chain.
// Replaced by s01–s04 from phase 4 on.
import { W, H, fields } from '../tokens.js';

export const dur = 10;
export const end = dur;
export const captions = [];

export function draw(ctx) {
  ctx.fillStyle = fields.yellow.fill;
  ctx.fillRect(0, 0, W, H);
}
