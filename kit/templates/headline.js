// headline: a headline and an optional smaller line under it, centred, with a very slow push.
// From the explainer's s03_response.
import { withCamera, defaultPush } from '../engine/camera.js';
import { L, column } from '../engine/layout.js';
import { styles, settles, windows, block, drawBlock, capOf, prepared, state, withDefaults } from './_lib.js';

export const name = 'headline';
export const params = {
  head: { type: 'string', required: true }, // 1–6 words
  sub: { type: 'string', default: '' }, // 1–6 words, or '' for none
};

const IN_HEAD = 0.1, IN_SUB = 0.5, GAP = 46;

export const captions = (p0, T) => {
  const p = withDefaults(params, p0), S = styles(T);
  return windows([
    { text: p.head, in: IN_HEAD, at: settles(IN_HEAD, p.head, S.hero) },
    ...(p.sub ? [{ text: p.sub, in: IN_SUB, at: settles(IN_SUB, p.sub, S.h1) }] : []),
  ]);
};

export async function prepare(p0, T) {
  const p = withDefaults(params, p0), ctx = new OffscreenCanvas(1, 1).getContext('2d'), S = styles(T);
  const A = block(ctx, p.head, S.hero, L.width, { capEm: capOf(T, S.hero) });
  // The sub line at most 76% of the headline's size.
  const B = p.sub ? block(ctx, p.sub, { ...S.h1, size: Math.min(S.h1.size, Math.round(A.size * 0.76)) }, L.width, { capEm: capOf(T, S.h1) }) : null;
  const tops = B ? column([A.height, B.height], [GAP + A.lineH - A.cap]) : column([A.height], []);
  prepared.set(p0, { A, B, tops });
}

export default function tpl(ctx, t, dur, p0) {
  const { A, B, tops } = state(p0, name);
  withCamera(ctx, defaultPush(t, dur), (c) => {
    drawBlock(c, t, IN_HEAD, A, L.cx(), tops[0]);
    if (B) drawBlock(c, t, IN_SUB, B, L.cx(), tops[1]);
  });
}
