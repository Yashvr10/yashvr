// stat: one number that rolls up on the engine's odometer (engine/type.js), an accent rule under
// it, a label, and an optional source line, with a slow push. New in the kit (the explainer showed no
// numbers); built from the same pieces as the title and end templates.
// Every number comes from params; the job is responsible for its being true.
import { win, inOutCubic } from '../engine/ease.js';
import { odometer, base, fontOf } from '../engine/type.js';
import { withCamera, defaultPush } from '../engine/camera.js';
import { L, column } from '../engine/layout.js';
import { styles, settles, windows, block, drawBlock, capOf, prepared, state, withDefaults } from './_lib.js';

export const name = 'stat';
export const params = {
  value: { type: 'int', required: true }, // what it rolls to
  from: { type: 'int', default: 0 }, // what it rolls from
  prefix: { type: 'string', default: '' }, // e.g. "$"
  suffix: { type: 'string', default: '' }, // e.g. " billion"
  label: { type: 'string', required: true }, // 1–6 words: what the number counts
  source: { type: 'string', default: '' }, // "Source: …", or '' for none
};

// Beats: the number rolls over ROLL from NUM_IN; the rule draws over RULE_ON; the label and the
// source rise in at LABEL_IN and SOURCE_IN. Gaps in px.
const NUM_IN = 0.15, ROLL = 1.0, RULE_ON = [0.8, 1.3], LABEL_IN = 0.7, SOURCE_IN = 1.0, RULE_W = 160;
const GAP = { rule: 48, label: 52, source: 64 };
// The figure as the odometer shows it: digits only, no separators.
const figure = (p) => `${p.prefix}${p.value}${p.suffix}`;

export const captions = (p0, T) => {
  const p = withDefaults(params, p0), S = styles(T);
  return windows([
    { text: figure(p), in: NUM_IN, at: NUM_IN + ROLL },
    { text: p.label, in: LABEL_IN, at: settles(LABEL_IN, p.label, S.h1) },
    ...(p.source ? [{ text: p.source, in: SOURCE_IN, at: settles(SOURCE_IN, p.source, S.small) }] : []),
  ]);
};

export async function prepare(p0, T) {
  const p = withDefaults(params, p0), ctx = new OffscreenCanvas(1, 1).getContext('2d'), S = styles(T);
  // The number at the giant size, or smaller to fit the safe width (the odometer's columns use the
  // widest digit, so measure with 8s).
  const NUM = { ...S.hero, size: T.sizes.giant };
  const o = base(NUM);
  ctx.font = fontOf(o);
  const wide = `${p.prefix}${String(p.value).replace(/\d/g, '8')}${p.suffix}`;
  const w = ctx.measureText(wide).width + [...wide].length * o.track * o.size;
  const size = Math.min(NUM.size, Math.floor((NUM.size * L.width) / w));
  const cap = size * T.capEm.display;
  const B = block(ctx, p.label, S.h1, L.width, { capEm: capOf(T, S.h1) });
  const D = p.source ? block(ctx, p.source, S.small, L.width, { max: 1, capEm: capOf(T, S.small) }) : null;
  const hs = [cap, T.stroke.annotate, B.height, ...(D ? [D.height] : [])], gs = [GAP.rule, GAP.label, ...(D ? [GAP.source] : [])];
  const tops = column(hs, gs);
  prepared.set(p0, { p, NUM: { ...NUM, size }, cap, B, D, tops });
}

export default function tpl(ctx, t, dur, p0, T) {
  const { p, NUM, cap, B, D, tops } = state(p0, name);
  withCamera(ctx, defaultPush(t, dur), (c) => {
    odometer(c, t - NUM_IN, { ...NUM, from: p.from, to: p.value, dur: ROLL, spins: 1, prefix: p.prefix, suffix: p.suffix, x: L.cx(), y: tops[0] + cap });
    const r = inOutCubic(win(t, ...RULE_ON));
    if (r > 0) {
      c.fillStyle = T.colors.accent;
      c.fillRect(L.cx() - (RULE_W / 2) * r, tops[1], RULE_W * r, T.stroke.annotate);
    }
    drawBlock(c, t, LABEL_IN, B, L.cx(), tops[2]);
    if (D) drawBlock(c, t, SOURCE_IN, D, L.cx(), tops[3]);
  });
}
