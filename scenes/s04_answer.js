// s04_answer: the answer. Scene type: KINETIC TYPE OVER A COLLAGE (same pattern as s01_hook).
// Paper field. The QR tile drops in small (a callback to s01) and lands with an impact; the number
// "21.6 BILLION" and its line rise in; a coral marker loop draws round the number; the source
// credit rises in; last, the punchline "≈20,000× SINCE 2016" lands with a yellow marker bar under
// its first word. The video ends on that hold: no exit is ever seen.
//
// Facts (NOTES.md): 21.63 billion UPI payments in Dec 2025 vs about 1 million in Aug 2016, so
// about 20,000×. The credit is reported through the press (Business Today, Punjab Kesari), not read
// from NPCI directly.
//
// Timing: the edit gives this scene a slot that ends exactly at 10.000 s. KICKER_IN is chosen so
// the last hold (holdFor of the punchline) ends there: end = KICKER_IN + motion.drawOn + holdFor.
import { win, outExpo, outBack, outCubic } from '../engine/ease.js';
import { riseIn, markerWipe, fade, base, fontOf } from '../engine/type.js';
import { lines, windows } from '../engine/copy.js';
import { withCamera, defaultPush, layerScale, punch, inPush, Z } from '../engine/camera.js';
import { field, cutout, rect, tape, qrTile, loop, marker } from '../engine/collage.js';
import { burst } from '../engine/particles.js';
import { measure } from '../engine/draw.js';
import { trace } from '../engine/trace.js';
import { L, column } from '../engine/layout.js';
import { colors, fields, sizes, tracking, motion, collage } from '../tokens.js';

const ID = 's04_answer';
const [NUMBER, LINE, KICKER, SOURCE] = lines(ID);
const F = fields.paper;

// Beats, local seconds. The tile falls for motion.enter and first touches down (IMPACT) where
// outBack(u, s) first reaches 1: u = 1 − s / (s + 1).
const DROP = [0, motion.enter], IMPACT = DROP[0] + motion.enter * (1 - motion.overshoot / (motion.overshoot + 1));
const TAPE = [IMPACT + 0.08, IMPACT + 0.08 + 0.3];
const NUMBER_IN = 0.1, LINE_IN = 0.2, LOOP = [0.5, 0.5 + motion.drawOn], SOURCE_IN = 0.6, KICKER_IN = 1.08;
const EXIT = 0.2;

// Type styles (tokens only). Long lines stagger faster so they settle with the short ones.
const STYLE = {
  number: { family: 'display', weight: 400, size: sizes.giant, track: tracking.display, color: F.text },
  line: { family: 'display', weight: 400, size: sizes.h1, track: tracking.display, color: F.text, stagger: 0.015 },
  kicker: { family: 'display', weight: 400, size: sizes.h2, track: tracking.display, color: F.text },
  source: { family: 'small', weight: 400, size: sizes.small, track: tracking.label, color: F.text, stagger: 0.015 },
};
// riseIn settles stagger × (glyphs − 1) + its dur (0.25 s) after it starts.
const settles = (t0, text, o) => t0 + (o.stagger ?? 0.03) * ([...text].length - 1) + 0.25;

// Four captions. Marks (the loop) don't delay `at`; the kicker settles when its marker bar is done.
export const captions = windows(ID, [
  { lines: [0], in: NUMBER_IN, at: settles(NUMBER_IN, NUMBER, STYLE.number) },
  { lines: [1], in: LINE_IN, at: settles(LINE_IN, LINE, STYLE.line) },
  { lines: [2], in: KICKER_IN, at: KICKER_IN + motion.drawOn },
  { lines: [3], in: SOURCE_IN, at: settles(SOURCE_IN, SOURCE, STYLE.source) },
]);
export const end = Math.max(...captions.map((c) => c.out));
export const dur = end + EXIT;

// Layout. The tile is the s01 tile at 0.6; cap heights: Anton 0.859 em, Inter 0.734 em.
const SCALE = 0.6, TILE = collage.tile.size * SCALE, FIT = 0.9; // the number fills 90% of its column (loop room)
const CAP = { line: sizes.h1 * 0.859, kicker: sizes.h2 * 0.859, source: sizes.small * 0.734 };
// Gaps in px. The two around the number leave room for the loop, which runs 0.55 cap past it.
const GAP = { tile: 110, number: 100, line: 44, kicker: 50 };

// Largest size of a line, up to its style's, that fits maxW.
function fit(ctx, text, style, maxW) {
  ctx.font = fontOf(base(style));
  return Math.min(style.size, Math.floor((style.size * maxW) / ctx.measureText(text).width));
}

// Where everything sits (pure: depends only on fonts). 9:16: tile over type in one centred column.
// 16:9: the tile in the left column, the type stacked in the right one.
function layout(ctx) {
  const colW = (L.stack ? L.width : L.width / 2) - 2 * (L.right - inPush(L.right, 0)[0]);
  ctx.save();
  const numberSize = fit(ctx, NUMBER, STYLE.number, colW * FIT);
  const sizeOf = { line: fit(ctx, LINE, STYLE.line, colW), kicker: fit(ctx, KICKER, STYLE.kicker, colW * 0.9) };
  ctx.font = fontOf(base({ ...STYLE.number, size: numberSize }));
  const numberW = ctx.measureText(NUMBER).width;
  ctx.restore();
  const capN = numberSize * 0.859, cap = { line: (CAP.line * sizeOf.line) / sizes.h1, kicker: (CAP.kicker * sizeOf.kicker) / sizes.h2 };
  const text = [capN, cap.line, cap.kicker, CAP.source], gaps = [GAP.number, GAP.line, GAP.kicker];
  const tops = L.stack ? column([TILE, ...text], [GAP.tile, ...gaps]) : [L.cy() - TILE / 2, ...column(text, gaps)];
  const [tileTop, numberTop, lineTop, kickerTop, sourceTop] = tops;
  const x = L.stack ? L.cx() : L.col(1, 2);
  return {
    x, numberSize, sizeOf,
    tile: { x: L.stack ? L.cx() : L.col(0, 2), y: tileTop + TILE / 2 },
    number: numberTop + capN, line: lineTop + cap.line, kicker: kickerTop + cap.kicker, source: sourceTop + CAP.source,
    // The loop round the number: an ellipse that just contains its box (0.59 × width, 1.05 × cap).
    ring: { cx: x, cy: numberTop + capN / 2, rx: numberW * 0.59, ry: capN * 1.05 },
  };
}

const SQUARE = rect(collage.tile.size, collage.tile.size);
let ring; // the marker loop (built once: measure() caches its length)
export async function load() {
  const { ring: r } = layout(new OffscreenCanvas(1, 1).getContext('2d'));
  ring = loop(r.cx, r.cy, r.rx, r.ry, { seed: 5 });
  measure(ring);
}

function content(ctx, t) {
  const P = layout(ctx);

  // The tile falls from above the frame, turning from −14° to −2°, and lands with an overshoot.
  const fall = win(t, ...DROP), e = fall >= 1 ? 1 : outBack(fall, motion.overshoot);
  const ty = P.tile.y - (1 - e) * (P.tile.y + TILE), r = -0.24 + 0.2 * Math.min(1, e);
  trace(ctx, 's04.tile', P.tile.x, ty);
  cutout(ctx, SQUARE, { x: P.tile.x, y: ty, s: SCALE, r, fill: colors.white, paint: (c) => qrTile(c, 0, 0, collage.tile.size - 24, { seed: collage.tile.seed }) });
  // Impact: paper bits kicked out from under the tile's bottom edge.
  burst(ctx, t, { t0: IMPACT, x: P.tile.x, y: P.tile.y + TILE / 2, n: 28, speed: 360, gravity: 1400, life: [0.25, 0.5], width: 4, colors: [colors.ink, colors.white] });
  // Tape slaps on: scales down from 1.25 onto the corner as it fades in.
  const tp = win(t, ...TAPE);
  if (tp > 0) {
    const s = (1.25 - 0.25 * outExpo(tp)) * SCALE;
    ctx.save();
    ctx.translate(P.tile.x - TILE * 0.42, P.tile.y - TILE * 0.46);
    ctx.scale(s, s);
    tape(ctx, 0, 0, -0.7, { seed: 2, alpha: Math.min(1, tp * 3) });
    ctx.restore();
  }

  riseIn(ctx, t - NUMBER_IN, { ...STYLE.number, size: P.numberSize, text: NUMBER, x: P.x, y: P.number });
  riseIn(ctx, t - LINE_IN, { ...STYLE.line, size: P.sizeOf.line, text: LINE, x: P.x, y: P.line });
  marker(ctx, ring, outCubic(win(t, ...LOOP)));
  riseIn(ctx, t - SOURCE_IN, { ...STYLE.source, text: SOURCE, x: P.x, y: P.source });
  if (t >= KICKER_IN) {
    // The punchline fades in over motion.enter while its marker bar wipes under the first word.
    ctx.save();
    ctx.globalAlpha = outExpo(win(t, KICKER_IN, KICKER_IN + motion.enter));
    markerWipe(ctx, t - KICKER_IN, { ...STYLE.kicker, size: P.sizeOf.kicker, text: KICKER, word: 0, x: P.x, y: P.kicker, accent: colors.yellow, on: colors.ink, dur: motion.drawOn });
    ctx.restore();
  }
}

// The field, then one subject layer through the default push, punched on the impact. The exit
// (lift and fade after `end`) is never reached in the edit: the video ends on the hold.
export function draw(ctx, t, d = dur) {
  field(ctx, F.fill);
  const cam = defaultPush(t, d), x = outCubic(win(t, end, end + EXIT));
  withCamera(ctx, layerScale({ ...cam, s: cam.s * punch(t, IMPACT) }, Z.subject), (c) => fade(c, 1 - x, -40 * x, (l) => content(l, t)));
}
