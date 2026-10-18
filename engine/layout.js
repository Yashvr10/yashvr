// Layout in the current aspect. Scenes place everything through L, so the same scene composes
// for 16:9 and re-composes for 9:16 (L.stack: rows become stacks, comparisons go top and bottom).
// All positions are frame px; the safe band is the frame inset by tokens.safe.
import { W, H, TH, TYPE, safe, captionBand } from '../tokens.js';

const left = safe.x, right = W - safe.x, top = safe.top, bottom = H - safe.bottom;

export const L = {
  left, right, top, bottom, width: right - left, height: bottom - top,
  // Where text may start: the safe top, or in 9:16 the caption band's top (15% H = 288) if lower.
  textTop: Math.max(top, captionBand?.y ?? 0),
  // True when the frame is taller than wide.
  stack: H > W,
  // Centre of the safe band (in 16:9 the frame centre; in 9:16 above it, clear of the bottom UI).
  cx: () => (left + right) / 2,
  cy: () => (top + bottom) / 2,
  // Centre of column i of n across the safe band, and of row i of n down it.
  col: (i, n) => left + ((i + 0.5) * (right - left)) / n,
  row: (i, n) => top + ((i + 0.5) * (bottom - top)) / n,
  // Slot i of n: columns side by side in 16:9, a stack of rows in 9:16.
  slot: (i, n) => (H > W ? { x: (left + right) / 2, y: L.row(i, n) } : { x: L.col(i, n), y: (top + bottom) / 2 }),
  // A 16:9 type size, or an offset that belongs to type, in this aspect (90% in 9:16).
  type: (px) => px * TYPE,
  // A cap height given in % of the 16:9 frame height, in px.
  cap: (pct) => Math.round((pct / 100) * TH),
};

// Splits text into the fewest lines (up to max) that each fit maxW at ctx's current font,
// balanced so the longest line is as short as possible. Only stacks re-break: in 16:9 it returns
// the text as one line, so 16:9 layouts stay as composed. Falls back to max lines.
export function rowsOf(ctx, text, maxW, max = 3) {
  const words = text.split(' ');
  if (!L.stack || words.length < 2) return [text];
  const width = (ws) => ctx.measureText(ws.join(' ')).width;
  // Every way to cut the words into k non-empty lines (titles are a handful of words).
  const cuts = (from, k) => (k === 1 ? [[words.slice(from)]] : Array.from({ length: words.length - from - k + 1 }, (_, j) =>
    cuts(from + j + 1, k - 1).map((rest) => [words.slice(from, from + j + 1), ...rest])).flat());
  let best;
  for (let n = 1; n <= Math.min(max, words.length); n++) {
    best = cuts(0, n).map((ls) => ({ ls, longest: Math.max(...ls.map(width)) })).reduce((p, q) => (q.longest < p.longest ? q : p));
    if (best.longest <= maxW) break;
  }
  return best.ls.map((ws) => ws.join(' '));
}

// Baselines for n lines lineH apart, centred on y.
export const baselines = (n, y, lineH) => Array.from({ length: n }, (_, k) => y + (k - (n - 1) / 2) * lineH);
