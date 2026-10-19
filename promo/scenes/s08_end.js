// s08_end: the end card. Scene type: END CARD.
// Ground only, in on a dip. The title "Israel–Hamas war" fades up and rises a little over 0.4 s;
// a short amber rule draws under it; the source line rises in 0.3 s after the title. Then the card
// holds still (grain only) to the last frame.
import { win, outCubic, inOutCubic } from '../engine/ease.js';
import { fade } from '../engine/type.js';
import { lines, windows } from '../engine/copy.js';
import { L, column } from '../engine/layout.js';
import { colors, sizes, stroke } from '../tokens.js';
import { STYLE, settles, block, drawBlock } from './_kit.js';

const ID = 's08_end';
const [TITLE, SOURCES] = lines(ID);
export const dur = 3.4;

const TITLE_IN = [0.2, 0.6], RULE_ON = [0.45, 0.95], SOURCES_IN = 0.5;
const TITLE_STYLE = { ...STYLE.hero, size: sizes.giant, stagger: 0 };
export const captions = windows(ID, [
  { lines: [0], in: TITLE_IN[0], at: TITLE_IN[1] },
  { lines: [1], in: SOURCES_IN, at: settles(SOURCES_IN, SOURCES, STYLE.small) },
]);
export const end = Math.max(...captions.map((c) => c.out));

const GAP = { rule: 56, sources: 56 }, RULE_W = 120;
let T, S, tops;
export async function load() {
  const ctx = new OffscreenCanvas(1, 1).getContext('2d');
  T = block(ctx, TITLE, TITLE_STYLE, L.width, { max: 1 });
  S = block(ctx, SOURCES, STYLE.small, L.width, { max: 1 });
  tops = column([T.height, stroke.annotate, S.height], [GAP.rule, GAP.sources]);
}

export function draw(ctx, t) {
  // Title: a plain fade-up (riseIn with no stagger: every glyph together), lifted 24 px → 0.
  const u = outCubic(win(t, ...TITLE_IN));
  fade(ctx, u, 24 * (1 - u), (c) => drawBlock(c, 1e3, 0, T, L.cx(), tops[0]));
  const r = inOutCubic(win(t, ...RULE_ON));
  if (r > 0) {
    ctx.fillStyle = colors.accent;
    ctx.fillRect(L.cx() - (RULE_W / 2) * r, tops[1], RULE_W * r, stroke.annotate);
  }
  drawBlock(ctx, t, SOURCES_IN, S, L.cx(), tops[2]);
}
