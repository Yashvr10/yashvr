// end: the end card. From the explainer's s08_end. The title fades up and lifts 24 px over 0.4 s;
// a short accent rule draws under it; an optional small line (sources, a name or a URL) rises in
// 0.3 s after the title. Then the card holds still, grain only, to the end.
import { win, outCubic, inOutCubic } from '../engine/ease.js';
import { fade } from '../engine/type.js';
import { L, column } from '../engine/layout.js';
import { styles, settles, windows, block, drawBlock, capOf, prepared, state, withDefaults } from './_lib.js';

export const name = 'end';
export const params = {
  title: { type: 'string', required: true }, // 1–4 words, one row
  line: { type: 'string', default: '' }, // sources, a name or a URL; '' for none
};

const TITLE_IN = [0.2, 0.6], RULE_ON = [0.45, 0.95], LINE_IN = 0.5, GAP = { rule: 56, line: 56 }, RULE_W = 120;
const titleStyle = (T) => ({ ...styles(T).hero, size: T.sizes.giant, stagger: 0 });

export const captions = (p0, T) => {
  const p = withDefaults(params, p0);
  return windows([
    { text: p.title, in: TITLE_IN[0], at: TITLE_IN[1] },
    ...(p.line ? [{ text: p.line, in: LINE_IN, at: settles(LINE_IN, p.line, styles(T).small) }] : []),
  ]);
};

export async function prepare(p0, T) {
  const p = withDefaults(params, p0), ctx = new OffscreenCanvas(1, 1).getContext('2d'), S = styles(T);
  const B = block(ctx, p.title, titleStyle(T), L.width, { max: 1, capEm: T.capEm.display });
  const D = p.line ? block(ctx, p.line, S.small, L.width, { max: 1, capEm: capOf(T, S.small) }) : null;
  const tops = D ? column([B.height, T.stroke.annotate, D.height], [GAP.rule, GAP.line]) : column([B.height, T.stroke.annotate], [GAP.rule]);
  prepared.set(p0, { B, D, tops });
}

export default function tpl(ctx, t, dur, p0, T) {
  const { B, D, tops } = state(p0, name);
  // The title: a plain fade-up (drawn settled), lifted 24 px → 0.
  const u = outCubic(win(t, ...TITLE_IN));
  fade(ctx, u, 24 * (1 - u), (c) => drawBlock(c, 1e3, 0, B, L.cx(), tops[0]));
  const r = inOutCubic(win(t, ...RULE_ON));
  if (r > 0) {
    ctx.fillStyle = T.colors.accent;
    ctx.fillRect(L.cx() - (RULE_W / 2) * r, tops[1], RULE_W * r, T.stroke.annotate);
  }
  if (D) drawBlock(ctx, t, LINE_IN, D, L.cx(), tops[2]);
}
