// engine/particles.js: a burst (paint blend) and confetti at their mid-life, and assemble():
// tiles flying into "₹" (targetsFromText) mid-flight, then landed.
import { burst, confetti, assemble, assembleEnd, targetsFromText } from '../engine/particles.js';
import { qrTile } from '../engine/collage.js';
import { L } from '../engine/layout.js';
import { colors, fonts } from '../tokens.js';
import { frame, label } from './_kit.js';

export const dur = 2, T = 1, captions = [];
const FLY = { t0: 0, dur: 0.5, spread: 0.4, dist: 500 };
let mid, done;
export async function load() {
  const font = `400 380px ${fonts.display}`;
  mid = targetsFromText('₹', font, { step: 22, x: L.col(0, 2), y: L.top + 1060 });
  done = targetsFromText('₹', font, { step: 22, x: L.col(1, 2), y: L.top + 1060 });
}
const tile = (c, p, i) => {
  c.save();
  c.globalAlpha = p.a;
  c.translate(p.x, p.y);
  c.rotate(p.r);
  qrTile(c, 0, 0, 20 * p.s, { seed: i });
  c.restore();
};

export function draw(ctx) {
  frame(ctx, 'engine/particles.js');
  burst(ctx, 0.35, { t0: 0, x: L.col(0, 2), y: L.top + 340, n: 160, speed: 700 });
  label(ctx, 'burst at 0.35 s', L.col(0, 2), L.top + 620, { align: 'center' });
  confetti(ctx, 0.5, { t0: 0, x: L.col(1, 2), y: L.top + 560, n: 120, speed: [700, 1200] });
  label(ctx, 'confetti at 0.5 s', L.col(1, 2), L.top + 620, { align: 'center' });
  assemble(ctx, 0.45, mid, { ...FLY, draw: tile });
  assemble(ctx, assembleEnd(FLY), done, { ...FLY, draw: tile });
  label(ctx, `assemble ${mid.length} tiles: 0.45 s / landed`, L.cx(), L.top + 1320, { align: 'center' });
}
