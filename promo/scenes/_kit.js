// Shared pieces for this video's scenes: type blocks that re-break for 9:16, the caption timing
// that goes with them, the map (projection, coastline, the Gaza Strip) used by s02 and s06, and
// the accent rule s01 ends on and s02's coastline starts from (the match cut).
import { riseIn, base, fontOf } from '../engine/type.js';
import { L } from '../engine/layout.js';
import { colors, sizes, tracking, stroke } from '../tokens.js';

// ---------- type ----------
export const STYLE = {
  hero: { family: 'display', weight: 700, size: sizes.hero, track: tracking.display, color: colors.text, stagger: 0.015 },
  h1: { family: 'display', weight: 700, size: sizes.h1, track: tracking.display, color: colors.text, stagger: 0.015 },
  body: { family: 'display', weight: 700, size: sizes.body, track: tracking.display, color: colors.text, stagger: 0.015 },
  label: { family: 'label', weight: 700, size: sizes.label, track: tracking.label, color: colors.text, stagger: 0.02 },
  small: { family: 'small', weight: 400, size: sizes.small, track: tracking.body, color: colors.text, stagger: 0.012 },
};
const CAP = 0.734; // Inter Tight / Inter cap height, em
// A block that doesn't fit its width breaks into rows; each row starts ROW s after the one above.
export const ROW = 0.12;
// When a block that starts at t0 is fully settled: riseIn takes stagger × (glyphs − 1) + 0.25 s
// per row, and a row break adds ROW (one is always allowed for: the rows are only known once the
// fonts are measured, and the captions are declared before that).
export const settles = (t0, text, style) => t0 + (style.stagger ?? 0.03) * ([...text].length - 1) + 0.25 + ROW;

// Splits text into the fewest rows (up to max) that each fit maxW at ctx's current font,
// balanced so the longest is as short as possible (engine/layout.js rowsOf, in either aspect).
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

// A block's layout (pure: depends only on fonts): its rows at the largest size up to the
// style's that fits maxW (breaking into up to `max` rows first), line height and height from the
// first row's cap top to the last baseline.
export function block(ctx, text, style, maxW = L.width, { max = 2, lead = 1.14 } = {}) {
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
  const lineH = size * lead, cap = size * CAP;
  return { text, style, size, rows, lineH, cap, height: cap + (rows.length - 1) * lineH };
}

// Draws a block with its first cap top at `top`, rows rising in from t0.
export function drawBlock(ctx, t, t0, b, x, top, extra = {}) {
  b.rows.forEach((r, k) => riseIn(ctx, t - t0 - k * ROW, { ...b.style, ...extra, size: b.size, text: r, label: b.text, x, y: top + b.cap + k * b.lineH }));
}

// ---------- the accent rule (s01) and the coastline (s02) ----------
// The rule s01 draws under its type, fixed on screen (outside the camera), so s02 can start its
// coastline exactly on it. Its width is the share of the safe width; y is set by s01's layout
// (it sits a fixed gap under the frame centre).
export const RULE = { w: L.width * (L.stack ? 0.5 : 0.28), y: L.cy() + (L.stack ? 330 : 190), width: stroke.annotate };
export const ruleEnds = () => [L.cx() - RULE.w / 2, L.cx() + RULE.w / 2];
// The matchCut transition's shape: a rect the size of the rule, stroked at stroke.outline, so its
// outer edges sit on the rule's.
export const ruleRect = () => ({ x: L.cx(), y: RULE.y, w: RULE.w, h: RULE.width - stroke.outline, r: 0 });

// ---------- the map ----------
// Lon/lat, approximate: hand-placed at well-known points along the coast (about 0.02° accuracy,
// enough at this scale; not survey data). North to south: Lebanon's coast near Tyre, Ras Naqoura, Haifa Bay, Mount Carmel, Netanya, Tel Aviv, Ashdod,
// Ashkelon, the Gaza coast, Rafah, El Arish, the Sinai coast to Port Said and on west (the ends run off the frame). No land borders are drawn, only the coast and the
// Gaza Strip, whose outline is its boundary with Israel and Egypt.
export const COAST = [
  [35.47, 33.9], [35.37, 33.6], [35.19, 33.36], [35.2, 33.27], [35.13, 33.15], [35.105, 33.09], [35.1, 32.97], [35.07, 32.92], [35.08, 32.88],
  [35.02, 32.825], [34.955, 32.83], [34.95, 32.72], [34.905, 32.56], [34.87, 32.43], [34.855, 32.33], [34.8, 32.17],
  [34.77, 32.07], [34.74, 31.99], [34.69, 31.88], [34.64, 31.8], [34.56, 31.69], [34.49, 31.596], [34.4, 31.52],
  [34.3, 31.41], [34.218, 31.322], [34.1, 31.25], [33.95, 31.17], [33.8, 31.135], [33.6, 31.12], [33.4, 31.13], [33.1, 31.12], [32.8, 31.08], [32.5, 31.1], [32.3, 31.26], [32.0, 31.4], [31.8, 31.52], [31.3, 31.55], [30.5, 31.45],
];
// The Gaza Strip: its coast (on COAST) from the north end to Rafah, then the boundary with Egypt to
// Kerem Shalom and the boundary with Israel back north to the coast.
export const GAZA = [
  [34.49, 31.596], [34.4, 31.52], [34.3, 31.41], [34.218, 31.322], [34.267, 31.22], [34.36, 31.3],
  [34.45, 31.38], [34.5, 31.45], [34.558, 31.547], [34.53, 31.57],
];
export const GAZA_LABEL = [34.0, 31.5]; // in the sea, west of the strip (leader line to it)
export const GAZA_AT = [34.39, 31.44]; // the strip's middle
export const ISRAEL_LABEL = [34.8, 31.2]; // the northern Negev, near Beersheba
// Where hostages were taken from (communities near the strip and the festival site), each to a
// point inside the strip. Drawn as dotted arcs, unlabelled.
export const TAKEN = [
  [[34.53, 31.48], [34.47, 31.5]], // Kfar Aza
  [[34.49, 31.42], [34.41, 31.43]], // Be'eri
  [[34.46, 31.39], [34.37, 31.38]], // the Nova festival site near Re'im
  [[34.4, 31.31], [34.3, 31.34]], // Nir Oz
];

// The projection: equirectangular about the map centre, scaled so the map's latitude span fits
// the safe height. 16:9: centred on central Israel; 9:16: nearer the strip.
const LAT0 = 32.0, COS = Math.cos((LAT0 * Math.PI) / 180);
const VIEW = L.stack ? { lon: 34.55, lat: 31.85, k: 540 } : { lon: 34.75, lat: 32.0, k: 405 };
export const proj = ([lon, lat]) => [L.cx() + (lon - VIEW.lon) * VIEW.k * COS, L.cy() - (lat - VIEW.lat) * VIEW.k];
// Map points in layout px.
export const coastPts = () => COAST.map(proj);
export const gazaPts = () => GAZA.map(proj);

// The map camera: a zoom by s about the strip's middle (a slow push towards it).
export const mapCam = (s) => {
  const [fx, fy] = proj(GAZA_AT);
  return ([x, y]) => [fx + (x - fx) * s, fy + (y - fy) * s];
};

// The land: the coast closed off far to the east (no border is drawn: the land is one tone).
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

// A polyline through pts.
export function path(ctx, pts, closed = false) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  if (closed) ctx.closePath();
}

// A quadratic arc from a to b bowed by `bow` (fraction of its length, to the left of travel),
// as n + 1 points.
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
