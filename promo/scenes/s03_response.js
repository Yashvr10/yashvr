// s03_response: Israel's response. Scene type: TYPE.
// Ground only, hard cut in from the map. "Israel launched a military campaign." rises in, then
// "Its stated aim: destroy Hamas." under it at a smaller size; a very slow push. Leaves on a dip.
//
// Facts (NOTES.md): Israel's government stated its war aims as eliminating Hamas and returning the
// hostages; the copy attributes the aim ("stated") rather than asserting it.
import { lines, windows } from '../engine/copy.js';
import { withCamera, defaultPush } from '../engine/camera.js';
import { L, column } from '../engine/layout.js';
import { STYLE, settles, block, drawBlock } from './_kit.js';

const ID = 's03_response';
const [LINE_A, LINE_B] = lines(ID);
export const dur = 3.4;

const IN_A = 0.1, IN_B = 0.5;
export const captions = windows(ID, [
  { lines: [0], in: IN_A, at: settles(IN_A, LINE_A, STYLE.hero) },
  { lines: [1], in: IN_B, at: settles(IN_B, LINE_B, STYLE.h1) },
]);
export const end = Math.max(...captions.map((c) => c.out));

const GAP = 46;
let A, B, tops;
export async function load() {
  const ctx = new OffscreenCanvas(1, 1).getContext('2d');
  A = block(ctx, LINE_A, STYLE.hero);
  B = block(ctx, LINE_B, { ...STYLE.h1, size: Math.min(STYLE.h1.size, Math.round(A.size * 0.76)) });
  tops = column([A.height, B.height], [GAP + A.lineH - A.cap]);
}

export function draw(ctx, t, d = dur) {
  withCamera(ctx, defaultPush(t, d), (c) => {
    drawBlock(c, t, IN_A, A, L.cx(), tops[0]);
    drawBlock(c, t, IN_B, B, L.cx(), tops[1]);
  });
}
