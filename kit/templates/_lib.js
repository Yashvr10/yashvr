// Shared pieces for the templates, from the explainer's scenes/_kit.js with the token set passed
// in (T) instead of imported: type styles, blocks that break into rows and shrink to fit, caption
// timing (settles, windows with holdFor), the accent rule, and the map helpers (projection, land,
// arcs, resampling). Values are unchanged, so a template in the night-amber look draws exactly what
// the scene it came from drew.
import { riseIn, base, fontOf } from '../engine/type.js';
import { holdFor } from '../engine/copy.js';
import { L } from '../engine/layout.js';

// ---------- params ----------
// Every template exports `params`: { name: { type, required?, default?, min?, max? } }. Types:
// 'string', 'string[]', 'number', 'int', 'bool', 'lonlat' ([lon, lat]), 'lonlat[]', 'object'.
// The player validates a job against it (player.html) before anything is drawn; tpl() then reads
// p.name with defaults already filled in by withDefaults().
export function withDefaults(schema, p) {
  const out = { ...p };
  for (const [k, s] of Object.entries(schema)) if (out[k] === undefined && 'default' in s) out[k] = s.default;
  return out;
}

// ---------- type ----------
export const styles = (T) => ({
  hero: { family: 'display', weight: T.weights.display, size: T.sizes.hero, track: T.tracking.display, color: T.colors.text, stagger: 0.015 },
  h1: { family: 'display', weight: T.weights.display, size: T.sizes.h1, track: T.tracking.display, color: T.colors.text, stagger: 0.015 },
  body: { family: 'display', weight: T.weights.display, size: T.sizes.body, track: T.tracking.display, color: T.colors.text, stagger: 0.015 },
  label: { family: 'label', weight: T.weights.label, size: T.sizes.label, track: T.tracking.label, color: T.colors.text, stagger: 0.02 },
  small: { family: 'small', weight: T.weights.small, size: T.sizes.small, track: T.tracking.body, color: T.colors.text, stagger: 0.012 },
});
// A block that doesn't fit its width breaks into rows; each row starts ROW s after the one above.
export const ROW = 0.12;
// When a block that starts at t0 is fully settled: riseIn takes stagger × (glyphs − 1) + 0.25 s
// per row, and a row break adds ROW (one is always allowed for).
export const settles = (t0, text, style) => t0 + (style.stagger ?? 0.03) * ([...text].length - 1) + 0.25 + ROW;
// Caption windows from [{ text, in, at }]: out = at + holdFor(text).
export const windows = (caps) => caps.map((c) => ({ ...c, out: c.at + holdFor(c.text) }));

// Splits text into the fewest rows (up to max) that each fit maxW at ctx's current font,
// balanced so the longest is as short as possible.
function rowsFit(ctx, text, maxW, max) {
  const words = text.split(' ');
  const width = (ws) => ctx.measureText(ws.join(' ')).width;
  const cuts = (from, k) => (k === 1 ? [[words.slice(from)]] : Array.from({ length: words.length - from - k + 1 }, (_, j) =>
    cuts(from + j + 1, k - 1).map((rest) => [words.slice(from, from + j + 1), ...rest])).flat());
  let best;
  for (let n = 1; n <= Math.min(max, words.length); n++) {
    best = cuts(0, n).map((ls) => ({ ls, longest: Math.max(...ls.map(width)) })).reduce((p, q) => (q.longest < p.longest ? q : p));
    if (best.longest <= maxW) break;
  }
  return best.ls.map((ws) => ws.join(' '));
}

// A block's layout (pure: depends only on fonts): its rows at the largest size up to the style's
// that fits maxW (breaking into up to `max` rows first), line height, and height from the first
// row's cap top to the last baseline. capEm is the face's cap height (T.capEm[role]).
export function block(ctx, text, style, maxW, { max = 2, lead = 1.14, capEm } = {}) {
  ctx.save();
  let size = style.size, rows;
  for (;;) {
    const o = base({ ...style, size });
    ctx.font = fontOf(o);
    ctx.letterSpacing = `${o.track * size}px`;
    rows = rowsFit(ctx, text, maxW, max);
    const widest = Math.max(...rows.map((r) => ctx.measureText(r).width));
    if (widest <= maxW || size <= 24) break;
    size = Math.floor(size * Math.max(0.8, Math.min(0.98, maxW / widest)));
  }
  ctx.restore();
  const lineH = size * lead, cap = size * capEm;
  return { text, style, size, rows, lineH, cap, height: cap + (rows.length - 1) * lineH };
}
// The cap height of a style's face role in T.
export const capOf = (T, style) => T.capEm[style.family === 'display' || style.family === 'body' ? 'display' : style.family];

// Draws a block with its first cap top at `top`, rows rising in from t0.
export function drawBlock(ctx, t, t0, b, x, top, extra = {}) {
  b.rows.forEach((r, k) => riseIn(ctx, t - t0 - k * ROW, { ...b.style, ...extra, size: b.size, text: r, label: b.text, x, y: top + b.cap + k * b.lineH }));
}

// ---------- the accent rule ----------
// The title template draws it under its type, fixed on screen (outside the camera); the map
// template can start its coastline on it (a match cut, as in the explainer).
export const RULE = (T) => ({ w: L.width * (L.stack ? 0.5 : 0.28), y: L.cy() + (L.stack ? 330 : 190), width: T.stroke.annotate });
export const ruleEnds = (T) => [L.cx() - RULE(T).w / 2, L.cx() + RULE(T).w / 2];
// The matchCut transition's shape: a rect the size of the rule, stroked at stroke.outline.
export const ruleRect = (T) => ({ x: L.cx(), y: RULE(T).y, w: RULE(T).w, h: RULE(T).width - T.stroke.outline, r: 0 });

// ---------- the map ----------
// Equirectangular about a view { lon, lat, k } (k: px per degree of latitude), with the cosine of
// a reference latitude lat0 for longitude.
export const projection = (view, lat0) => {
  const COS = Math.cos((lat0 * Math.PI) / 180);
  return ([lon, lat]) => [L.cx() + (lon - view.lon) * view.k * COS, L.cy() - (lat - view.lat) * view.k];
};
// The land: a coast closed off far to one side (no border is drawn: the land is one tone).
export function landPath(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  const [x1, y1] = pts.at(-1), [x0, y0] = pts[0];
  ctx.lineTo(x1, y1 + 4000);
  ctx.lineTo(x0 + 6000, y1 + 4000);
  ctx.lineTo(x0 + 6000, y0 - 4000);
  ctx.lineTo(x0, y0 - 4000);
  ctx.closePath();
}
export function path(ctx, pts, closed = false) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (closed) ctx.closePath();
}
// A quadratic arc from a to b bowed by `bow` (fraction of its length, to the left of travel).
export function arc(a, b, bow = 0.25, n = 24) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1];
  const c = [mx - dy * bow, my + dx * bow];
  return Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n, v = 1 - u;
    return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[1] + 2 * v * u * c[1] + u * u * b[1]];
  });
}
// Resamples a polyline to n + 1 points evenly spaced along its length (for morphing).
export function resample(pts, n) {
  const c = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = c.at(-1);
  return Array.from({ length: n + 1 }, (_, k) => {
    const d = (k / n) * total;
    let i = 1;
    while (i < c.length - 1 && c[i] < d) i++;
    const u = (d - c[i - 1]) / (c[i] - c[i - 1] || 1);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u];
  });
}
// A colour between two hex colours, as rgb().
export const mix = (a, b, u) => {
  const ca = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), cb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${ca.map((v, k) => Math.round(v + (cb[k] - v) * u)).join(',')})`;
};

// Per-params state: prepare() stores what it measured (fonts, geometry, 3D stages) here, keyed by
// the params object, and tpl() reads it back. Nothing in it changes while drawing.
export const prepared = new WeakMap();
export function state(p, name) {
  const s = prepared.get(p);
  if (!s) throw new Error(`${name}: prepare(params, tokens) was not called for these params`);
  return s;
}
