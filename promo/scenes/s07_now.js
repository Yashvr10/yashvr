// s07_now: where it stands. Scene type: TYPE.
// Ground only, in on a dip. "The search for peace continues." rises in; a thin amber rule (the
// s01 rule, echoed) draws slowly under it from left to right and is still drawing as the scene
// dips out. A very slow push.
//
// Facts (NOTES.md): a ceasefire took effect in October 2025; a year on it holds in name, with
// strikes continuing and talks on its second phase stalled (UN Security Council, October 2026).
import { win } from '../engine/ease.js';
import { base, fontOf } from '../engine/type.js';
import { lines, windows } from '../engine/copy.js';
import { withCamera, defaultPush } from '../engine/camera.js';
import { L } from '../engine/layout.js';
import { colors, stroke } from '../tokens.js';
import { STYLE, settles, block, drawBlock } from './_kit.js';

const ID = 's07_now';
const [LINE] = lines(ID);
export const dur = 3.0;

const IN = 0.1, RULE_ON = [0.8, 3.2];
export const captions = windows(ID, [{ lines: [0], in: IN, at: settles(IN, LINE, STYLE.hero) }]);
export const end = Math.max(...captions.map((c) => c.out));

const RULE_GAP = 70;
let B, top, width;
export async function load() {
  const ctx = new OffscreenCanvas(1, 1).getContext('2d');
  B = block(ctx, LINE, STYLE.hero);
  top = L.cy() - B.height / 2 - RULE_GAP / 2;
  ctx.font = fontOf(base({ ...STYLE.hero, size: B.size }));
  ctx.letterSpacing = `${STYLE.hero.track * B.size}px`;
  width = Math.max(...B.rows.map((r) => ctx.measureText(r).width));
}

export function draw(ctx, t, d = dur) {
  withCamera(ctx, defaultPush(t, d), (c) => {
    drawBlock(c, t, IN, B, L.cx(), top);
    // Draws under the last row from its left end; at the dip it is about 85% across.
    const u = win(t, ...RULE_ON); // linear: it keeps going
    if (u <= 0) return;
    c.fillStyle = colors.accent;
    c.fillRect(L.cx() - width / 2, top + B.height + RULE_GAP, width * u, stroke.annotate);
  });
}
