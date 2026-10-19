// thumb: the thumbnail (not in the timeline; index.html?thumb). A still frame in the video's look:
// the ground with its grain, the coastline and the amber Gaza Strip from the map scenes, enlarged on
// the right, and the title at thumbnail scale on the left, two rows, with the amber rule under it.
// The words are the video's own title (copy.json s08_end line 0), broken after the dash.
import { lines } from '../engine/copy.js';
import { riseIn } from '../engine/type.js';
import { L } from '../engine/layout.js';
import { colors, sizes, stroke } from '../tokens.js';
import { STYLE, block, proj, coastPts, gazaPts, landPath, path, GAZA_AT } from './_kit.js';

const [TITLE] = lines('s08_end');
export const dur = 1;
export const captions = [];

// The title as two rows ("Israel–" / "Hamas war"), as big as fits 60% of the safe width.
const ROWS = TITLE.replace('–', '–\n').split('\n');
const STYLE_T = { ...STYLE.hero, size: Math.round(sizes.giant * 2.2) };
// The map: scaled about the strip and moved so the strip sits in the right third.
const MAP = { s: 2.2, at: [L.right - L.width * 0.16, L.cy() + 40] };

let rows, gap, size, place;
export async function load() {
  const ctx = new OffscreenCanvas(1, 1).getContext('2d');
  const bs = ROWS.map((r) => block(ctx, r, STYLE_T, L.width * 0.6, { max: 1 }));
  size = Math.min(...bs.map((b) => b.size));
  rows = ROWS.map((r) => block(ctx, r, { ...STYLE_T, size }, L.width, { max: 1 }));
  gap = size * 1.02;
  const [gx, gy] = proj(GAZA_AT);
  place = ([x, y]) => [MAP.at[0] + (x - gx) * MAP.s, MAP.at[1] + (y - gy) * MAP.s];
}

export function draw(ctx) {
  // The map, quiet: land, coast in dim, the strip filled and outlined in amber.
  const coast = coastPts().map(place), gaza = gazaPts().map(place);
  ctx.fillStyle = colors.tile;
  landPath(ctx, coast);
  ctx.fill();
  ctx.lineJoin = 'round';
  ctx.strokeStyle = colors.dim;
  ctx.lineWidth = stroke.outline * 1.5;
  path(ctx, coast);
  ctx.stroke();
  ctx.fillStyle = colors.accent;
  ctx.globalAlpha = 0.3;
  path(ctx, gaza, true);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = stroke.annotate;
  path(ctx, gaza, true);
  ctx.stroke();
  // The title, settled (riseIn long after its end), left-aligned and centred vertically, then the rule.
  const cap = rows[0].cap;
  const top = L.cy() - (cap + gap) / 2 - 30;
  rows.forEach((b, k) => riseIn(ctx, 1e3, { ...b.style, size, text: b.text, label: TITLE, x: L.left, y: top + cap + k * gap, align: 'left' }));
  ctx.fillStyle = colors.accent;
  ctx.fillRect(L.left, top + cap + gap + 56, 220, stroke.annotate * 2);
}
