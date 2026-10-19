// s02_map: where. Scene type: ILLUSTRATION (an outline map).
// In on the match cut: the first frame is s01's amber rule, exactly where s01 left it. The rule
// bends into the coastline (its left end becomes the north) as it cools from amber to the line
// colour; the land fades up behind it; the Gaza Strip draws on in amber; "Israel" and "Gaza" rise
// in (Gaza's label in the sea, with a leader line); four dotted arcs run from communities near the
// strip into it; "Hostages were taken into Gaza." rises in, top left over the sea. All the while the
// camera pushes slowly in on the strip. Ends on a hard cut.
//
// No land borders are drawn (only the coast and the strip's outline). Facts (NOTES.md): on
// 7 October 2023 Hamas-led gunmen attacked communities and a music festival in southern Israel and
// took hostages into Gaza (UN OCHA flash updates).
import { win, lerp, outCubic, inOutCubic } from '../engine/ease.js';
import { riseIn } from '../engine/type.js';
import { lines, windows } from '../engine/copy.js';
import { drawOn, measure, pointAt } from '../engine/draw.js';
import { L } from '../engine/layout.js';
import { colors, stroke } from '../tokens.js';
import {
  STYLE, settles, block, drawBlock, RULE, ruleEnds, proj, coastPts, gazaPts, mapCam, landPath, path, arc, resample,
  GAZA_LABEL, GAZA, ISRAEL_LABEL, TAKEN,
} from './_kit.js';

const ID = 's02_map';
const [ISRAEL, GAZA_NAME, LINE] = lines(ID);
export const dur = 4.0;

// Beats, local seconds.
const MORPH = [0.1, 0.9], LAND = [0.6, 1.3], STRIP = [0.85, 1.45], LEADER = [1.0, 1.3];
const IN_ISRAEL = 0.95, IN_GAZA = 1.05, IN_LINE = 1.25, ARCS = [1.4, 2.3];
export const captions = windows(ID, [
  { lines: [0], in: IN_ISRAEL, at: settles(IN_ISRAEL, ISRAEL, STYLE.label) },
  { lines: [1], in: IN_GAZA, at: settles(IN_GAZA, GAZA_NAME, STYLE.label) },
  { lines: [2], in: IN_LINE, at: settles(IN_LINE, LINE, STYLE.h1) },
]);
export const end = Math.max(...captions.map((c) => c.out));

// The camera: a slow push in on the strip, 1 → PUSH over the scene (s06 starts where this ends).
export const PUSH = 1.12;
export const camAt = (t, d = dur) => lerp(1, PUSH, inOutCubic(win(t, 0, d)) * 0.5 + win(t, 0, d) * 0.5);

// Colours: the coast cools from the accent to dim as it lands.
const mix = (a, b, u) => {
  const ca = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), cb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${ca.map((v, k) => Math.round(lerp(v, cb[k], u))).join(',')})`;
};

const N = 160; // morph points
let ruleLine, coast, gaza, taken, caption, leaderFrom;
export async function load() {
  const [x0, x1] = ruleEnds();
  ruleLine = resample([[x0, RULE.y], [x1, RULE.y]], N);
  coast = resample(coastPts(), N);
  gaza = gazaPts();
  taken = TAKEN.map(([a, b]) => arc(proj(a), proj(b), 0.35, 30));
  taken.forEach(measure);
  // The caption sits top left, over the sea: left-aligned, narrow enough to stay off the coast.
  caption = block(new OffscreenCanvas(1, 1).getContext('2d'), LINE, STYLE.h1, L.stack ? 560 : 760, { max: 3 });
  leaderFrom = proj(GAZA_LABEL);
}

// The map's layers, shared with s06 (which re-draws it quieter and fully landed).
export function drawMap(ctx, t, s, { morph = 1, land = 1, strip = 1, fill = 0.22 } = {}) {
  const cam = mapCam(s), pts = coast.map((p, i) => {
    const q = cam(p);
    return morph >= 1 ? q : [lerp(ruleLine[i][0], q[0], morph), lerp(ruleLine[i][1], q[1], morph)];
  });
  if (land > 0) {
    ctx.globalAlpha = land;
    ctx.fillStyle = colors.tile;
    landPath(ctx, pts);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = mix(colors.accent, colors.dim, outCubic(morph));
  ctx.lineWidth = lerp(RULE.width, stroke.outline, morph);
  path(ctx, pts);
  ctx.stroke();
  if (strip > 0) {
    const g = gaza.map(cam);
    ctx.fillStyle = colors.accent;
    ctx.globalAlpha = fill * strip;
    path(ctx, g, true);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = stroke.outline;
    drawOn(ctx, [...g, g[0]], strip);
  }
  return cam;
}

// Map labels: placed by the camera but drawn at their own size (labels don't grow with the push).
export function label(ctx, t, t0, text, at, cam, align = 'center') {
  const [x, y] = cam(proj(at));
  riseIn(ctx, t - t0, { ...STYLE.label, text, x, y, align });
}

export function draw(ctx, t, d = dur) {
  const s = camAt(t, d);
  const cam = drawMap(ctx, t, s, {
    morph: inOutCubic(win(t, ...MORPH)), land: outCubic(win(t, ...LAND)), strip: outCubic(win(t, ...STRIP)),
  });
  // The leader line from Gaza's label to the strip's west coast.
  const lead = outCubic(win(t, ...LEADER));
  if (lead > 0) {
    const [lx, ly] = cam(leaderFrom), [gx, gy] = cam(proj(GAZA[1]));
    ctx.strokeStyle = colors.dim;
    ctx.lineWidth = stroke.detail;
    drawOn(ctx, [[lx + 70, ly - 8], [gx - 8, gy]], lead);
  }
  label(ctx, t, IN_ISRAEL, ISRAEL, ISRAEL_LABEL, cam);
  label(ctx, t, IN_GAZA, GAZA_NAME, GAZA_LABEL, cam);
  // Dotted arcs into the strip, one after another, each ending in a dot.
  taken.forEach((a, k) => {
    const n = taken.length, span = (ARCS[1] - ARCS[0]) / (n + 1);
    const p = outCubic(win(t, ARCS[0] + k * span * 0.6, ARCS[0] + k * span * 0.6 + 2 * span));
    if (p <= 0) return;
    const pts = a.map(cam), len = measure(a).at(-1) * s;
    ctx.fillStyle = colors.text;
    for (let dd = 0; dd <= p * len; dd += 9) {
      const [x, y] = pointAt(pts, dd);
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, 2 * Math.PI);
      ctx.fill();
    }
    if (p >= 1) {
      const [x, y] = pts.at(-1);
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  });
  drawBlock(ctx, t, IN_LINE, caption, L.left, L.stack ? L.textTop : L.top, { align: 'left' });
}
