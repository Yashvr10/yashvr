// map: an outline map: a coast, the land behind it in one tone (no borders), one area outlined
// and filled in the accent, labels, dotted arcs, and a caption top left over the sea, while the
// camera pushes slowly in on a focus point. From the explainer's s02_map (intro: true) and
// s06_talks (intro: false).
//   intro true:  the coast starts as the title template's rule (a match cut) and bends into place,
//                cooling from the accent to dim; the land fades up; the area draws on; labels
//                rise in (the first with an optional leader line); inbound arcs dot their way to
//                their ends; the push runs 1 → push[1], eased.
//   intro false: the map is already there, quieter (area fill halved); labels are settled;
//                outbound arcs reach to points off the frame, a dot travelling out and back on
//                each; the push runs push[0] → push[1], linear.
import { win, lerp, outCubic, inOutCubic } from '../engine/ease.js';
import { riseIn } from '../engine/type.js';
import { drawOn, measure, pointAt } from '../engine/draw.js';
import { L } from '../engine/layout.js';
import {
  styles, settles, windows, block, drawBlock, capOf, RULE, ruleEnds, projection, landPath, path, arc, resample, mix,
  prepared, state, withDefaults,
} from './_lib.js';

export const name = 'map';
export const params = {
  geo: { type: 'string', required: true }, // a JSON file (kit-relative): { lat0, coast: [[lon, lat]…], area: [[lon, lat]…] }
  view: { type: 'object', required: true }, // { "16x9": { lon, lat, k }, "9x16": { lon, lat, k } }: centre and px per degree
  focus: { type: 'lonlat', required: true }, // where the camera pushes in
  caption: { type: 'string', required: true }, // 1–6 words
  labels: { type: 'object[]', default: [] }, // [{ text, at: [lon, lat] }]
  leader: { type: 'object', default: null }, // intro only: { from: [lon, lat] (a label's), to: [lon, lat] }
  arcs: { type: 'object[]', default: [] }, // intro only, inbound: [{ from: [lon, lat], to: [lon, lat] }]
  reach: { type: 'object', default: null }, // outro only: { "16x9": [{ to: [fx, fy], bow }], "9x16": [...] }, frame fractions
  intro: { type: 'bool', default: true },
  push: { type: 'number[]', default: [1, 1.12] }, // camera scale at the start and the end
};

// Beats, local seconds (intro, then the quiet version).
const MORPH = [0.1, 0.9], LAND = [0.6, 1.3], AREA = [0.85, 1.45], LEADER = [1.0, 1.3];
const LABEL_IN = 0.95, LABEL_STEP = 0.1, CAPTION_IN = 1.25, ARCS = [1.4, 2.3];
const QUIET = { caption: 0.45, arcs: [0.1, 1.3], fill: 0.11 }, FILL = 0.22, N = 160;
// Label k's entrance, rounded so 0.95 + 0.1 is 1.05 exactly (as the scene's constants were).
const labelIn = (k) => +(LABEL_IN + k * LABEL_STEP).toFixed(6);

export const captions = (p0, T) => {
  const p = withDefaults(params, p0), S = styles(T);
  if (!p.intro) return windows([{ text: p.caption, in: QUIET.caption, at: settles(QUIET.caption, p.caption, S.h1) }]);
  return windows([
    ...p.labels.map((l, k) => ({ text: l.text, in: labelIn(k), at: settles(labelIn(k), l.text, S.label) })),
    { text: p.caption, in: CAPTION_IN, at: settles(CAPTION_IN, p.caption, S.h1) },
  ]);
};

export async function prepare(p0, T) {
  const p = withDefaults(params, p0), S = styles(T);
  const geo = await (await fetch(p.geo)).json();
  const proj = projection(p.view[L.stack ? '9x16' : '16x9'], geo.lat0);
  const [x0, x1] = ruleEnds(T), R = RULE(T);
  const st = {
    p, proj,
    ruleLine: resample([[x0, R.y], [x1, R.y]], N),
    coast: resample(geo.coast.map(proj), N),
    area: geo.area.map(proj),
    focus: proj(p.focus),
    inbound: p.arcs.map(({ from, to }) => arc(proj(from), proj(to), 0.35, 30)),
    caption: block(new OffscreenCanvas(1, 1).getContext('2d'), p.caption, S.h1, L.stack ? 560 : 760, { max: 3, capEm: capOf(T, S.h1) }),
  };
  st.inbound.forEach(measure);
  const reach = p.reach?.[L.stack ? '9x16' : '16x9'] ?? [];
  st.outbound = reach.map(({ to: [fx, fy], bow }) => arc(st.focus, [fx * T.W, fy * T.H], bow, 40));
  prepared.set(p0, st);
}

// A zoom by s about the focus.
const camOf = (focus, s) => ([x, y]) => [focus[0] + (x - focus[0]) * s, focus[1] + (y - focus[1]) * s];

function drawMap(ctx, st, T, s, { morph = 1, land = 1, area = 1, fill = FILL } = {}) {
  const cam = camOf(st.focus, s), pts = st.coast.map((q0, i) => {
    const q = cam(q0);
    return morph >= 1 ? q : [lerp(st.ruleLine[i][0], q[0], morph), lerp(st.ruleLine[i][1], q[1], morph)];
  });
  if (land > 0) {
    ctx.globalAlpha = land;
    ctx.fillStyle = T.colors.tile;
    landPath(ctx, pts);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = mix(T.colors.accent, T.colors.dim, outCubic(morph));
  ctx.lineWidth = lerp(RULE(T).width, T.stroke.outline, morph);
  path(ctx, pts);
  ctx.stroke();
  if (area > 0) {
    const g = st.area.map(cam);
    ctx.fillStyle = T.colors.accent;
    ctx.globalAlpha = fill * area;
    path(ctx, g, true);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = T.colors.accent;
    ctx.lineWidth = T.stroke.outline;
    drawOn(ctx, [...g, g[0]], area);
  }
  return cam;
}

// A label, placed by the camera but drawn at its own size.
const label = (ctx, T, st, t, t0, text, at, cam) => {
  const [x, y] = cam(st.proj(at));
  riseIn(ctx, t - t0, { ...styles(T).label, text, x, y, align: 'center' });
};

export default function tpl(ctx, t, dur, p0, T) {
  const st = state(p0, name), { p } = st;
  if (p.intro) intro(ctx, t, dur, st, T);
  else quiet(ctx, t, dur, st, T);
  drawBlock(ctx, t, p.intro ? CAPTION_IN : QUIET.caption, st.caption, L.left, L.stack ? L.textTop : L.top, { align: 'left' });
}

function intro(ctx, t, dur, st, T) {
  const { p } = st;
  const s = lerp(p.push[0], p.push[1], inOutCubic(win(t, 0, dur)) * 0.5 + win(t, 0, dur) * 0.5);
  const cam = drawMap(ctx, st, T, s, { morph: inOutCubic(win(t, ...MORPH)), land: outCubic(win(t, ...LAND)), area: outCubic(win(t, ...AREA)) });
  // The leader line from a label to a point on the area.
  const lead = outCubic(win(t, ...LEADER));
  if (p.leader && lead > 0) {
    const [lx, ly] = cam(st.proj(p.leader.from)), [gx, gy] = cam(st.proj(p.leader.to));
    ctx.strokeStyle = T.colors.dim;
    ctx.lineWidth = T.stroke.detail;
    drawOn(ctx, [[lx + 70, ly - 8], [gx - 8, gy]], lead);
  }
  p.labels.forEach((l, k) => label(ctx, T, st, t, labelIn(k), l.text, l.at, cam));
  // Inbound dotted arcs, one after another, each ending in a dot.
  st.inbound.forEach((a, k) => {
    const n = st.inbound.length, span = (ARCS[1] - ARCS[0]) / (n + 1);
    const q = outCubic(win(t, ARCS[0] + k * span * 0.6, ARCS[0] + k * span * 0.6 + 2 * span));
    if (q <= 0) return;
    const pts = a.map(cam), len = measure(a).at(-1) * s;
    ctx.fillStyle = T.colors.text;
    for (let dd = 0; dd <= q * len; dd += 9) {
      const [x, y] = pointAt(pts, dd);
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, 2 * Math.PI);
      ctx.fill();
    }
    if (q >= 1) {
      const [x, y] = pts.at(-1);
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
}

function quiet(ctx, t, dur, st, T) {
  const { p } = st;
  const s = lerp(p.push[0], p.push[1], win(t, 0, dur));
  const cam = drawMap(ctx, st, T, s, { fill: QUIET.fill });
  p.labels.forEach((l) => label(ctx, T, st, 1e3, 0, l.text, l.at, cam));
  // Outbound dotted arcs, then a dot travelling out and back once every 2.4 s on each (in the
  // arc's first 45%, which stays in frame).
  st.outbound.forEach((a, k) => {
    const A = QUIET.arcs, q = outCubic(win(t, A[0] + k * 0.25, A[0] + k * 0.25 + 0.7));
    if (q <= 0) return;
    const pts = a.map(cam), len = measure(pts).at(-1);
    ctx.fillStyle = T.colors.text;
    ctx.globalAlpha = 0.7;
    for (let dd = 0; dd <= q * len; dd += 11) {
      const [x, y] = pointAt(pts, dd);
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const age = t - (A[0] + k * 0.25 + 0.7);
    if (age <= 0) return;
    const ph = (age / 2.4) % 1, back = ph < 0.5 ? ph * 2 : 2 - ph * 2;
    const [x, y] = pointAt(pts, back * len * 0.45);
    ctx.fillStyle = T.colors.accent;
    ctx.globalAlpha = Math.min(1, age / 0.2);
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
}
