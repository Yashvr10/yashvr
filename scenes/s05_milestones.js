// s05_milestones: the doubling. Scene type: CUTOUTS SLAM IN OVER A FIELD (strip pattern of
// s02_growth, layout and fitting of s01_hook / s04_answer).
// Yellow field. A torn white paper strip slams in with "AUG 2023 / 10 BILLION"; a second slams in
// with "AUG 2025 / 20 BILLION" (below it in 9:16, beside it in 16:9); a hand-drawn coral arrow
// draws from the first to the second; "NEARLY DOUBLED" rises in; a small tile (the through-line
// object) pops onto the second strip's corner.
//
// Facts (NOTES.md): UPI first crossed 10 billion transactions in a month in Aug 2023 (10.58 billion
// full month, YourStory; Business Today and Business Standard report the milestone) and reached 20.01
// billion in Aug 2025 (Storyboard18). 20.01 / 10.58 = 1.89, hence "nearly" doubled.
//
// Local code (the engine has none): the coral arrow's points, built in load().
import { win, outExpo, outBack, outCubic } from '../engine/ease.js';
import { riseIn, fade, base, fontOf } from '../engine/type.js';
import { lines, windows } from '../engine/copy.js';
import { withCamera, defaultPush, layerScale, punch, inPush, Z } from '../engine/camera.js';
import { field, cutout, rect, tornRect, tape, qrTile, marker } from '../engine/collage.js';
import { burst } from '../engine/particles.js';
import { measure } from '../engine/draw.js';
import { L, column } from '../engine/layout.js';
import { colors, fields, sizes, tracking, motion, collage } from '../tokens.js';

const ID = 's05_milestones';
const [DATE_A, NUM_A, DATE_B, NUM_B, KICKER] = lines(ID);
const F = fields.yellow;

// Beats, local seconds. A strip slams in over motion.enter (scale 1.4 → 1, outBack) and first lands
// (its IMPACT) where outBack(u, s) first reaches 1: u = 1 − s / (s + 1).
const S = motion.overshoot, impactOf = (t0) => t0 + motion.enter * (1 - S / (S + 1));
const SLAM_A = 0, SLAM_B = 0.5, IMPACT_A = impactOf(SLAM_A), IMPACT_B = impactOf(SLAM_B);
const IN_A = IMPACT_A + 0.02, IN_B = IMPACT_B + 0.02;
const ARROW = [IMPACT_B + 0.15, IMPACT_B + 0.15 + motion.drawOn];
const KICKER_IN = ARROW[1] - 0.1, TILE_IN = IMPACT_B + 0.05, EXIT = 0.2;

const STYLE = {
  date: { family: 'label', weight: 700, size: sizes.label, track: tracking.label, color: colors.ink, stagger: 0.015 },
  num: { family: 'display', weight: 400, size: sizes.giant, track: tracking.display, color: colors.ink },
  kicker: { family: 'display', weight: 400, size: sizes.h1, track: tracking.display, color: F.text, stagger: 0.015 },
};
// riseIn settles stagger × (glyphs − 1) + its dur (0.25 s) after it starts.
const settles = (t0, text, o) => t0 + (o.stagger ?? 0.03) * ([...text].length - 1) + 0.25;

// Five captions, one per element; each holds holdFor of its own words.
export const captions = windows(ID, [
  { lines: [0], in: IN_A, at: settles(IN_A, DATE_A, STYLE.date) },
  { lines: [1], in: IN_A, at: settles(IN_A, NUM_A, STYLE.num) },
  { lines: [2], in: IN_B, at: settles(IN_B, DATE_B, STYLE.date) },
  { lines: [3], in: IN_B, at: settles(IN_B, NUM_B, STYLE.num) },
  { lines: [4], in: KICKER_IN, at: settles(KICKER_IN, KICKER, STYLE.kicker) },
]);
export const end = Math.max(...captions.map((c) => c.out));
export const dur = end + EXIT;

// Layout, in px. A strip is padded around a date label and the number; the number fills the
// strip's width. Gaps: the arrow's room between strips (9:16), and strips to the kicker.
const PAD = { x: 44, y: 40 }, GAP = { inner: 26, arrow: 150, kicker: 70 }, CAP_LABEL = sizes.label * 0.734;
const TILE = collage.tile.size, TILE_SCALE = 0.28, SQUARE = rect(TILE, TILE);

// Largest size of a line, up to its style's, that fits maxW.
function fit(ctx, text, style, maxW) {
  ctx.font = fontOf(base(style));
  return Math.min(style.size, Math.floor((style.size * maxW) / ctx.measureText(text).width));
}

// Where everything sits (pure: depends only on fonts). 9:16: strip, arrow room, strip, kicker in
// one centred column. 16:9: the strips side by side, the kicker centred under them.
function layout(ctx) {
  const colW = (L.stack ? L.width : L.width / 2) - 2 * (L.right - inPush(L.right, 0)[0]), maxStrip = colW * 0.82;
  ctx.save();
  const numSize = Math.min(fit(ctx, NUM_A, STYLE.num, maxStrip - 2 * PAD.x), fit(ctx, NUM_B, STYLE.num, maxStrip - 2 * PAD.x));
  const kickSize = fit(ctx, KICKER, STYLE.kicker, colW);
  ctx.font = fontOf(base({ ...STYLE.num, size: numSize }));
  const wNum = Math.max(ctx.measureText(NUM_A).width, ctx.measureText(NUM_B).width);
  ctx.restore();
  const capNum = numSize * 0.859, capKick = kickSize * 0.859;
  const w = Math.min(maxStrip, wNum + 2 * PAD.x), h = 2 * PAD.y + CAP_LABEL + GAP.inner + capNum;
  let a, b, kickTop;
  if (L.stack) {
    const [ta, tb, tk] = column([h, h, capKick], [GAP.arrow, GAP.kicker]);
    a = { x: L.cx(), y: ta + h / 2 };
    b = { x: L.cx(), y: tb + h / 2 };
    kickTop = tk;
  } else {
    const [ts, tk] = column([h, capKick], [GAP.kicker]);
    a = { x: L.col(0, 2), y: ts + h / 2 };
    b = { x: L.col(1, 2), y: ts + h / 2 };
    kickTop = tk;
  }
  return { w, h, a, b, numSize, kickSize, capNum, kick: kickTop + capKick };
}

// The arrow: a gentle curve from strip A to strip B (down the left side in 9:16, over the top in
// 16:9), ending in a two-stroke head that is part of the same path so it draws on with it.
function arrowPath({ w, h, a, b }) {
  const n = 24, bow = 90, lead = 18;
  const [p0, p2] = L.stack
    ? [[a.x - w * 0.2, a.y + h / 2 + lead], [b.x - w * 0.2, b.y - h / 2 - lead]]
    : [[a.x + w / 2 + lead, a.y], [b.x - w / 2 - lead, b.y]];
  const c = L.stack ? [p0[0] - bow, (p0[1] + p2[1]) / 2] : [(p0[0] + p2[0]) / 2, p0[1] - bow];
  const shaft = Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n, v = 1 - u;
    return [v * v * p0[0] + 2 * v * u * c[0] + u * u * p2[0], v * v * p0[1] + 2 * v * u * c[1] + u * u * p2[1]];
  });
  const [px, py] = shaft[n - 1], d = Math.hypot(p2[0] - px, p2[1] - py), ux = (p2[0] - px) / d, uy = (p2[1] - py) / d;
  const side = (ang) => [p2[0] - 38 * (ux * Math.cos(ang) - uy * Math.sin(ang)), p2[1] - 38 * (ux * Math.sin(ang) + uy * Math.cos(ang))];
  return [...shaft, side(0.5), p2, side(-0.5)];
}

let G, STRIP, arrow;
export async function load() {
  G = layout(new OffscreenCanvas(1, 1).getContext('2d'));
  STRIP = tornRect(G.w, G.h, { seed: 4, amp: 5 });
  arrow = arrowPath(G);
  measure(arrow);
}

// One strip: slams in (1.4 → 1), then its date and number rise in.
function strip(ctx, t, slam, inT, at, date, num, turn) {
  const u = win(t, slam, slam + motion.enter);
  if (u <= 0) return;
  const k = u >= 1 ? 1 : 1.4 - 0.4 * outBack(u, S);
  cutout(ctx, STRIP, { x: at.x, y: at.y, s: k, r: turn, fill: colors.white, alpha: Math.min(1, u * 4) });
  const top = at.y - G.h / 2 + PAD.y + CAP_LABEL;
  riseIn(ctx, t - inT, { ...STYLE.date, text: date, x: at.x, y: top });
  riseIn(ctx, t - inT, { ...STYLE.num, size: G.numSize, text: num, x: at.x, y: top + GAP.inner + G.capNum });
  // Impact: paper bits kicked out from under the strip's bottom edge.
  burst(ctx, t, { t0: inT - 0.02, x: at.x, y: at.y + G.h / 2, n: 24, speed: 360, gravity: 1400, life: [0.25, 0.5], width: 4, colors: [colors.ink, colors.white] });
}

function content(ctx, t) {
  strip(ctx, t, SLAM_A, IN_A, G.a, DATE_A, NUM_A, -0.02);
  strip(ctx, t, SLAM_B, IN_B, G.b, DATE_B, NUM_B, 0.02);
  marker(ctx, arrow, outCubic(win(t, ...ARROW)));
  // The tile pops onto strip B's top-right corner, taped.
  const u = win(t, TILE_IN, TILE_IN + motion.enter);
  if (u > 0) {
    const s = TILE_SCALE * (u >= 1 ? 1 : outBack(u, S)), x = G.b.x + G.w / 2 - 24, y = G.b.y - G.h / 2 + 12;
    cutout(ctx, SQUARE, { x, y, s, r: 0.14, fill: colors.white, paint: (c) => qrTile(c, 0, 0, TILE - 24, { seed: collage.tile.seed }) });
    ctx.save();
    ctx.translate(x - TILE * s * 0.4, y - TILE * s * 0.46);
    ctx.scale(0.5 * (1.25 - 0.25 * outExpo(Math.min(1, u * 2))), 0.5 * (1.25 - 0.25 * outExpo(Math.min(1, u * 2))));
    tape(ctx, 0, 0, -0.7, { seed: 2, alpha: Math.min(1, u * 3) });
    ctx.restore();
  }
  riseIn(ctx, t - KICKER_IN, { ...STYLE.kicker, size: G.kickSize, text: KICKER, x: L.cx(), y: G.kick });
}

// The field, then one subject layer through the default push, punched on each impact. The exit
// lifts and fades the subject over EXIT after `end`.
export function draw(ctx, t, d = dur) {
  field(ctx, F.fill);
  const cam = defaultPush(t, d), x = outCubic(win(t, end, end + EXIT));
  const hit = punch(t, IMPACT_A) * punch(t, IMPACT_B);
  withCamera(ctx, layerScale({ ...cam, s: cam.s * hit }, Z.subject), (c) => fade(c, 1 - x, -40 * x, (l) => content(l, t)));
}
