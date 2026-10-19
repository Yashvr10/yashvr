// quote: one line (a statement or a quotation, quote marks included in the copy) with an accent
// rule drawing slowly under it from left to right, still drawing as the scene ends; an optional
// attribution under the rule. From the explainer's s07_now (which had no attribution; without one
// this template draws exactly that scene).
import { win } from '../engine/ease.js';
import { base, fontOf } from '../engine/type.js';
import { withCamera, defaultPush } from '../engine/camera.js';
import { L } from '../engine/layout.js';
import { styles, settles, windows, block, drawBlock, capOf, prepared, state, withDefaults } from './_lib.js';

export const name = 'quote';
export const params = {
  text: { type: 'string', required: true }, // 1–6 words per row it breaks into
  attribution: { type: 'string', default: '' }, // e.g. "— Name, role", or '' for none
};

// Beats: the line rises in at IN; the rule draws linearly over RULE_ON; the attribution rises at ATTR_IN.
const IN = 0.1, RULE_ON = [0.8, 3.2], ATTR_IN = 0.9, RULE_GAP = 70, ATTR_GAP = 56;

export const captions = (p0, T) => {
  const p = withDefaults(params, p0), S = styles(T);
  return windows([
    { text: p.text, in: IN, at: settles(IN, p.text, S.hero) },
    ...(p.attribution ? [{ text: p.attribution, in: ATTR_IN, at: settles(ATTR_IN, p.attribution, S.small) }] : []),
  ]);
};

export async function prepare(p0, T) {
  const p = withDefaults(params, p0), ctx = new OffscreenCanvas(1, 1).getContext('2d'), S = styles(T);
  const B = block(ctx, p.text, S.hero, L.width, { capEm: capOf(T, S.hero) });
  const A = p.attribution ? block(ctx, p.attribution, S.small, L.width, { max: 1, capEm: capOf(T, S.small) }) : null;
  // Centred: the line and the rule gap (and, with an attribution, its gap and height).
  const top = L.cy() - (B.height + (A ? T.stroke.annotate + ATTR_GAP + A.height : 0)) / 2 - RULE_GAP / 2;
  ctx.font = fontOf(base({ ...S.hero, size: B.size }));
  ctx.letterSpacing = `${S.hero.track * B.size}px`;
  const width = Math.max(...B.rows.map((r) => ctx.measureText(r).width));
  prepared.set(p0, { B, A, top, width });
}

export default function tpl(ctx, t, dur, p0, T) {
  const { B, A, top, width } = state(p0, name);
  withCamera(ctx, defaultPush(t, dur), (c) => {
    drawBlock(c, t, IN, B, L.cx(), top);
    const y = top + B.height + RULE_GAP;
    if (A) drawBlock(c, t, ATTR_IN, A, L.cx(), y + T.stroke.annotate + ATTR_GAP);
    // The rule: under the line from its left end, linear, so it keeps going.
    const u = win(t, ...RULE_ON);
    if (u <= 0) return;
    c.fillStyle = T.colors.accent;
    c.fillRect(L.cx() - width / 2, y, width * u, T.stroke.annotate);
  });
}
