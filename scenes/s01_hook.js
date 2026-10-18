// s01_hook: the cold open. Scene type: KINETIC TYPE OVER A COLLAGE (exemplar).
// Yellow field. The QR tile, the object that runs through the video, drops in as a paper cutout
// and lands with an impact (camera punch and a puff of paper bits); tape slaps it down; the label
// and the line "1 MILLION / PAYMENTS A MONTH" rise in; a coral marker underlines the number.
// 9:16 stacks tile over type in the safe band; 16:9 puts the tile left and the type right.
//
// Pattern to copy for any scene:
//   1. Copy from copy.json via lines(ID). No copy literals.
//   2. A BEATS table of local times; every entrance 0.3–0.6 s, every exit 0.15–0.3 s.
//   3. captions = windows(...): each hold is holdFor(text), counted from when the text settles.
//      end = the last caption's out (the timeline cuts there); dur = end + EXIT.
//   4. load() builds paths once; draw(ctx, t) is a pure function of t through withCamera.
//   5. Positions from engine/layout.js only (L.*, column, rowsOf); values from tokens.js only.
import { win, outExpo, outBack, outCubic } from '../engine/ease.js';
import { riseIn, fade, base, fontOf } from '../engine/type.js';
import { lines, windows } from '../engine/copy.js';
import { withCamera, defaultPush, layerScale, punch, Z } from '../engine/camera.js';
import { field, cutout, rect, tape, qrTile, underline, marker } from '../engine/collage.js';
import { burst } from '../engine/particles.js';
import { measure } from '../engine/draw.js';
import { L, rowsOf, baselines, column } from '../engine/layout.js';
import { colors, fields, sizes, tracking, motion, collage } from '../tokens.js';

const ID = 's01_hook';
const [LABEL, NUMBER, REST] = lines(ID); // "INDIA · UPI · 2016", "1 MILLION", "PAYMENTS A MONTH"
const F = fields.yellow;

// Beats, local seconds. The tile falls for motion.enter and first touches down (IMPACT) where
// outBack(u, s) first reaches 1: u = 1 − s / (s + 1).
const DROP = [0, motion.enter], IMPACT = DROP[0] + motion.enter * (1 - motion.overshoot / (motion.overshoot + 1));
const TAPE = [IMPACT + 0.08, IMPACT + 0.08 + 0.3];
const LABEL_IN = 0.15, NUMBER_IN = 0.22, REST_IN = 0.32, UNDERLINE = [0.6, 0.6 + motion.drawOn];
const EXIT = 0.2;

// Type styles (tokens only). Long lines stagger faster so they settle with the short ones.
const STYLE = {
  label: { family: 'label', weight: 700, size: sizes.label, track: tracking.label, color: F.text, stagger: 0.015 },
  number: { family: 'display', weight: 400, size: sizes.giant, track: tracking.display, color: F.text },
  rest: { family: 'display', weight: 400, size: sizes.h1, track: tracking.display, color: F.text, stagger: 0.015 },
};
// riseIn settles stagger × (glyphs − 1) + its dur (0.25 s) after it starts.
const settles = (t0, text, o) => t0 + (o.stagger ?? 0.03) * ([...text].length - 1) + 0.25;

// One caption for the label, one for the number and its line; the number's hold sets the end.
// A caption settles when its type does; marks (the underline) don't delay it.
export const captions = windows(ID, [
  { lines: [0], in: LABEL_IN, at: settles(LABEL_IN, LABEL, STYLE.label) },
  { lines: [1, 2], in: NUMBER_IN, at: Math.max(settles(NUMBER_IN, NUMBER, STYLE.number), settles(REST_IN, REST, STYLE.rest)) },
]);
export const end = Math.max(...captions.map((c) => c.out));
export const dur = end + EXIT;

// Layout: block sizes in px, from tokens. Cap heights: Anton 0.859 em, Inter Tight 0.734 em.
const TILE = collage.tile.size, CAP = { label: sizes.label * 0.734, number: sizes.giant * 0.859, rest: sizes.h1 * 0.859 };
const LINE_H = sizes.h1 * 1.05, GAP = { tile: 90, label: 40, number: 64 };

// Where everything sits, measured once per frame from the copy (pure: depends only on fonts).
function layout(ctx) {
  ctx.save();
  ctx.font = fontOf(base(STYLE.rest));
  const rows = rowsOf(ctx, REST, L.stack ? L.width : L.width / 2);
  ctx.restore();
  const text = [CAP.label, CAP.number, CAP.rest + (rows.length - 1) * LINE_H];
  // 9:16: tile, label, number, rest in one centred column. 16:9: the tile in the left column,
  // the type stacked in the right one.
  const tops = L.stack
    ? column([TILE, ...text], [GAP.tile, GAP.label, GAP.number])
    : [L.cy() - TILE / 2, ...column(text, [GAP.label, GAP.number])];
  const [tileTop, labelTop, numberTop, restTop] = tops;
  const x = L.stack ? L.cx() : L.col(1, 2);
  return {
    tile: { x: L.stack ? L.cx() : L.col(0, 2), y: tileTop + TILE / 2 },
    x,
    label: labelTop + CAP.label,
    number: numberTop + CAP.number,
    rows: rows.map((text, k) => ({ text, y: baselines(rows.length, 0, LINE_H)[k] + restTop + CAP.rest + ((rows.length - 1) * LINE_H) / 2 })),
    underlineY: numberTop + CAP.number + GAP.number * 0.45,
  };
}

const SQUARE = rect(TILE, TILE);
let rule; // the marker underline, in layout px (built once: measure() caches its length)
export async function load() {
  const ctx = new OffscreenCanvas(1, 1).getContext('2d');
  const { x, underlineY } = layout(ctx);
  ctx.font = fontOf(base(STYLE.number));
  const w = ctx.measureText(NUMBER).width;
  rule = underline(x - w / 2 - 10, x + w / 2 + 10, underlineY, { seed: 3 });
  measure(rule);
}

function content(ctx, t) {
  const P = layout(ctx);

  // The tile falls from above the frame, turning from −14° to −2°, and lands with an overshoot.
  const fall = win(t, ...DROP), e = fall >= 1 ? 1 : outBack(fall, motion.overshoot);
  const ty = P.tile.y - (1 - e) * (P.tile.y + TILE), r = -0.24 + 0.2 * Math.min(1, e);
  if (t >= DROP[0]) {
    cutout(ctx, SQUARE, { x: P.tile.x, y: ty, r, fill: colors.white, paint: (c) => qrTile(c, 0, 0, TILE - 2 * 12, { seed: collage.tile.seed }) });
  }
  // Impact: paper bits kicked out from under the tile's bottom edge.
  burst(ctx, t, { t0: IMPACT, x: P.tile.x, y: P.tile.y + TILE / 2, n: 36, speed: 420, gravity: 1400, life: [0.25, 0.5], width: 4, colors: [colors.ink, colors.white] });
  // Tape slaps on: scales down from 1.25 onto the corner as it fades in.
  const tp = win(t, ...TAPE);
  if (tp > 0) {
    const s = 1.25 - 0.25 * outExpo(tp);
    ctx.save();
    ctx.translate(P.tile.x - TILE * 0.42, P.tile.y - TILE * 0.46);
    ctx.scale(s, s);
    tape(ctx, 0, 0, -0.7, { seed: 2, alpha: Math.min(1, tp * 3) });
    ctx.restore();
  }

  riseIn(ctx, t - LABEL_IN, { ...STYLE.label, text: LABEL, x: P.x, y: P.label });
  riseIn(ctx, t - NUMBER_IN, { ...STYLE.number, text: NUMBER, x: P.x, y: P.number });
  for (const r of P.rows) riseIn(ctx, t - REST_IN, { ...STYLE.rest, text: r.text, label: REST, x: P.x, y: r.y });
  marker(ctx, rule, outCubic(win(t, ...UNDERLINE)));
}

// The field, then one subject layer through the default push, punched on the impact. The exit
// lifts and fades the subject over EXIT after `end` (the timeline's whip usually covers it).
export function draw(ctx, t, d = dur) {
  field(ctx, F.fill);
  const cam = defaultPush(t, d), x = outCubic(win(t, end, end + EXIT));
  withCamera(ctx, layerScale({ ...cam, s: cam.s * punch(t, IMPACT) }, Z.subject), (c) => fade(c, 1 - x, -40 * x, (l) => content(l, t)));
}
