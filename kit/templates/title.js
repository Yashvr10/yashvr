// title: one or two lines of type, then an accent rule. From the explainer's s01_open.
// The lines rise in (the second 0.4 s after the first) at one shared size, while the camera pushes
// in slowly; then the rule draws out from its centre. The rule is fixed on screen (outside the
// camera), so a following map can start its coastline on it (the match cut).
import { win, outCubic, inOutCubic } from '../engine/ease.js';
import { withCamera, defaultPush } from '../engine/camera.js';
import { L, column } from '../engine/layout.js';
import { styles, settles, windows, block, drawBlock, capOf, RULE, ruleEnds, prepared, state, withDefaults } from './_lib.js';

export const name = 'title';
export const params = {
  lines: { type: 'string[]', required: true, min: 1, max: 2 }, // 1–6 words each
  rule: { type: 'bool', default: true },
};

// Beats, local seconds: line k starts at IN[k]; the rule draws over RULE_ON.
const IN = [0.15, 0.55], RULE_ON = [1.2, 1.2 + 0.6], GAP = 34, RULE_GAP = 80;

export const captions = (p, T) => windows(p.lines.map((text, k) => ({ text, in: IN[k], at: settles(IN[k], text, styles(T).hero) })));

export async function prepare(p0, T) {
  const p = withDefaults(params, p0), ctx = new OffscreenCanvas(1, 1).getContext('2d'), S = styles(T).hero;
  const opt = { capEm: capOf(T, S) };
  let bs = p.lines.map((text) => block(ctx, text, S, L.width, opt));
  // Every line at one size (the smallest), centred above the rule.
  const size = Math.min(...bs.map((b) => b.size));
  bs = bs.map((b, k) => (b.size === size ? b : block(ctx, p.lines[k], { ...S, size }, L.width, opt)));
  const gap = GAP + bs[0].lineH - bs[0].cap, total = bs.reduce((a, b) => a + b.height, 0) + gap * (bs.length - 1);
  const tops = column(bs.map((b) => b.height), bs.slice(1).map(() => gap), RULE(T).y - RULE_GAP - total / 2);
  prepared.set(p0, { p, bs, tops });
}

export default function tpl(ctx, t, dur, p0, T) {
  const { p, bs, tops } = state(p0, name);
  withCamera(ctx, defaultPush(t, dur), (c) => bs.forEach((b, k) => drawBlock(c, t, IN[k], b, L.cx(), tops[k])));
  if (!p.rule) return;
  // The rule draws out from its centre.
  const u = inOutCubic(win(t, ...RULE_ON));
  if (u <= 0) return;
  const R = RULE(T), [x0, x1] = ruleEnds(T), h = (x1 - x0) / 2;
  ctx.fillStyle = T.colors.accent;
  ctx.globalAlpha = outCubic(Math.min(1, u * 3));
  ctx.fillRect(L.cx() - h * u, R.y - R.width / 2, 2 * h * u, R.width);
  ctx.globalAlpha = 1;
}
