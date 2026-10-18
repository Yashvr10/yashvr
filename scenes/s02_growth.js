// FROZEN: read-only from phase 7 on. Need something it lacks? Write it in your scene file and report it (NOTES.md).
// s02_growth: the build. Scene type: DATA CHART FROM PIECES (exemplar).
// Paper field. A baseline draws on; ten bars, one per year 2016–2025, build up out of QR tiles
// (the through-line object), each bar starting a beat after the last and stacking faster, because
// it has more tiles in the same build time. The last three bars outgrow the frame and run off its
// top. Then the question lands on a torn paper strip (the impact).
//
// Data: only the endpoints are facts (about 1 million UPI payments a month in Aug 2016, 21.6
// billion in Dec 2025; sources in NOTES.md). At one tile for 2016, 2025 would be ~21,600 tiles,
// so it can't fit: that is the point of the shot. The bars between are an ILLUSTRATIVE even curve
// (TILES), deliberately unlabelled: only 2016 and 2025 carry labels.
//
// Same pattern as s01_hook (copy via lines, BEATS, captions via windows/holdFor, end and dur,
// load once, pure draw); this scene adds a world layer under the camera plus a screen layer, and
// edge-anchored text pulled in with inPush.
import { win, outBack, outCubic } from '../engine/ease.js';
import { riseIn, fade } from '../engine/type.js';
import { lines, windows } from '../engine/copy.js';
import { withCamera, defaultPush, layerScale, inPush, Z } from '../engine/camera.js';
import { field, cutout, tornRect, qrTile } from '../engine/collage.js';
import { drawOn, measure } from '../engine/draw.js';
import { L } from '../engine/layout.js';
import { colors, fields, sizes, tracking, motion, collage, stroke } from '../tokens.js';

const ID = 's02_growth';
const [FIRST, LAST, QUESTION] = lines(ID); // "2016", "2025", "HOW MANY NOW?"
const F = fields.paper;

// Bars: tiles per year, 1 (2016) growing ×1.45 a year to 28 (2025), which overflows the frame.
const YEARS = 10, TILES = Array.from({ length: YEARS }, (_, k) => Math.round(1.45 ** k));
// Beats, local seconds. Bar k starts at BAR0 + k × STEP and lays its tiles evenly over BUILD;
// each tile pops in over POP with the token overshoot.
const RULE = [0, 0.3], BAR0 = 0.12, STEP = 0.06, BUILD = 0.45, POP = 0.12;
const LAST_DONE = BAR0 + (YEARS - 1) * STEP + BUILD; // the 2025 bar's final tile
// The question card lands as the 2025 bar finishes: it slams from 1.4× down to size (outBack), and
// that slam is the impact. No camera punch here: the chart and labels sit on the safe edges.
const CARD = [LAST_DONE - 0.3, LAST_DONE - 0.3 + motion.enter];
const IMPACT = CARD[0] + motion.enter * (1 - motion.overshoot / (motion.overshoot + 1));
const LABELS_IN = 0.1, QUESTION_IN = IMPACT + 0.02, EXIT = 0.2;

const STYLE = {
  year: { family: 'label', weight: 700, size: sizes.label, track: tracking.label, color: F.text, stagger: 0.015 },
  question: { family: 'display', weight: 400, size: sizes.hero, track: tracking.display, color: colors.ink, stagger: 0.015 },
};
const settles = (t0, text, o) => t0 + (o.stagger ?? 0.03) * ([...text].length - 1) + 0.25;

export const captions = windows(ID, [
  { lines: [0, 1], in: LABELS_IN, at: settles(LABELS_IN, FIRST, STYLE.year) },
  { lines: [2], in: QUESTION_IN, at: settles(QUESTION_IN, QUESTION, STYLE.question) },
]);
export const end = Math.max(...captions.map((c) => c.out));
export const dur = end + EXIT;

// Layout. The year labels end on the text bottom and the band's edges, pulled in by inPush so the
// camera push never carries them past; the baseline sits above them. Columns across the band;
// tiles fill 80% of a column, capped at 72 px and at the size that fits the 2023 bar in the band,
// with a 10% gap above each. The 2024 and 2025 bars run off the top: the overflow is the shot.
const [LABEL_L, LABEL_Y] = inPush(L.left, L.textBottom - sizes.label * 0.25), [LABEL_R] = inPush(L.right, 0);
const BASE = LABEL_Y - sizes.label * 1.6;
const COL = L.width / YEARS, TILE = Math.min(72, COL * 0.8, (BASE - L.top) / (TILES[YEARS - 3] * 1.1)), PITCH = TILE * 1.1;
const QUESTION_Y = L.textTop + sizes.hero * 0.859; // screen space, on the text top
const STRIP = tornRect(L.width * 0.92, sizes.hero * 1.5, { seed: 4, amp: 5 });

let rule;
export async function load() {
  rule = [[L.left - 20, BASE], [L.right + 20, BASE]];
  measure(rule);
}

// Tile j of bar k: where it sits and how far its pop has got (0..1, or < 0 before it starts).
function tileAt(k, j, t) {
  const t0 = BAR0 + k * STEP + (BUILD * j) / TILES[k];
  return { x: L.col(k, YEARS), y: BASE - (j + 0.5) * PITCH, u: (t - t0) / POP };
}

// The world layer: baseline, bars and year labels. Moves with the camera tilt.
function chart(ctx, t) {
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = stroke.outline;
  ctx.lineCap = 'round';
  drawOn(ctx, rule, outCubic(win(t, ...RULE)));
  for (let k = 0; k < YEARS; k++) {
    for (let j = 0; j < TILES[k]; j++) {
      const p = tileAt(k, j, t);
      if (p.u <= 0) break; // tiles in a bar start in order
      const s = p.u >= 1 ? 1 : outBack(p.u, motion.overshoot);
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.scale(s, s);
      qrTile(ctx, 0, 0, TILE, { seed: collage.tile.seed + 31 * k + j });
      ctx.restore();
    }
  }
  // Flush with the band's edges (centred under the outer bars they would cross the margins).
  riseIn(ctx, t - LABELS_IN, { ...STYLE.year, text: FIRST, align: 'left', x: LABEL_L, y: LABEL_Y });
  riseIn(ctx, t - LABELS_IN, { ...STYLE.year, text: LAST, align: 'right', x: LABEL_R, y: LABEL_Y });
}

// The screen layer: the question on a torn white strip, slammed in (scale 1.4 → 1, outBack).
function question(ctx, t) {
  const u = win(t, ...CARD);
  if (u <= 0) return;
  const s = u >= 1 ? 1 : 1.4 - 0.4 * outBack(u, motion.overshoot), y = QUESTION_Y - sizes.hero * 0.43;
  cutout(ctx, STRIP, { x: L.cx(), y, s, r: -0.02, fill: colors.white, alpha: Math.min(1, u * 4) });
  riseIn(ctx, t - QUESTION_IN, { ...STYLE.question, text: QUESTION, x: L.cx(), y: QUESTION_Y });
}

// The field; the chart through the default push; the question over it in screen space. Exit:
// lift and fade over EXIT after `end`.
export function draw(ctx, t, d = dur) {
  field(ctx, F.fill);
  const x = outCubic(win(t, end, end + EXIT));
  fade(ctx, 1 - x, -40 * x, (c) => {
    withCamera(c, layerScale(defaultPush(t, d), Z.subject), (w) => chart(w, t));
    question(c, t);
  });
}
