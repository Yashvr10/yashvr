// The Ledger: online payments after 2014, in the measured reference style (STYLE.md).
// Shot 1 (0–6.5 s): a ruled ledger page; bars draw on year by year; the camera moves down the
// page to 2020–2024; a red underline and circle mark the steepest year.
// Shot 2 (6.5–9 s, hard cut): a slab-serif quoted phrase types on with a marker behind it,
// above a dashed outline of an absent card.
import { win, inOutCubic } from '../engine/ease.js';
import { hash } from '../engine/rng.js';
import { measure, pointAt, drawOn } from '../engine/draw.js';
import { withCamera } from '../engine/camera.js';
import { lines, windows, registerText } from '../engine/copy.js';
import { W, H, colors, fonts, sizes, safe, motion, stroke, radius } from '../tokens.js';

const ID = 's06_ledger';
// Copy: [title, subtitle, quoted phrase, caption under the absent card].
const T = lines(ID);

// ILLUSTRATIVE figures (share of payments made online, %). Replace with sourced data.
const YEARS = [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024];
const SHARE = [10, 12, 15, 19, 24, 30, 41, 48, 54, 59, 63];
const STEEPEST = 6; // 2019 → 2020, the largest one-year rise

const CUT = 6.5; // hard cut to shot 2
const TYPED = motion.titleDelay + motion.typePerChar * [...T[2]].length; // quote typed, shot-local

// Captions: the header (title + subtitle), the quote (settled once marked), the card caption.
export const captions = windows(ID, [
  { lines: [0, 1], in: motion.titleDelay, at: motion.titleDelay + motion.titleWipe },
  { lines: [2], in: CUT + motion.titleDelay, at: CUT + TYPED + motion.marker },
  { lines: [3], in: CUT, at: CUT },
]);
export const dur = Math.max(9, ...captions.map((c) => c.out));
export const end = dur;
const ROW = 150, ROW0 = 420; // row centres in page px
const RULE_X = safe.x + 290, BAR_X = RULE_X + 44, BAR_H = 56;
const BAR_PER = (W - safe.x - 210 - BAR_X) / 70; // px per percentage point
// The move ends with 2019's top rule on the frame edge, so no row is cut in half.
const MOVE = [3.3, 3.3 + motion.move], OFFSET = ROW0 + ROW * 5 - ROW / 2; // page scroll in px
const rowY = (i) => ROW0 + ROW * i;
const growAt = (i) => (i < 5 ? 0.6 + 0.12 * i : MOVE[1] + 0.07 + 0.12 * (i - 5));
const font = (style, weight, size, family = fonts.display) => `${style} ${weight} ${size}px ${family}`;

// Annotations are fixed polylines in page px, measured once at load.
let underline, circle, card;
export async function load() {
  const y = rowY(STEEPEST) + BAR_H / 2 + 22, x1 = BAR_X + SHARE[STEEPEST] * BAR_PER + 170;
  underline = Array.from({ length: 25 }, (_, k) => [safe.x - 10 + ((x1 - safe.x + 10) * k) / 24, y + 4 * Math.sin(k * 0.9) + (k / 24) * 6]);
  // A hand-drawn loop: 1.1 turns with a slightly uneven, fixed radius.
  const cx = BAR_X + SHARE[STEEPEST] * BAR_PER + 95, cy = rowY(STEEPEST) - 4;
  circle = Array.from({ length: 61 }, (_, k) => {
    const a = -2.4 + (k / 60) * Math.PI * 2 * 1.1, r = 1 + 0.05 * (hash(k >> 3, 61) - 0.5) + 0.04 * (k / 60);
    return [cx + 112 * r * Math.cos(a), cy + 64 * r * Math.sin(a)];
  });
  // The absent card: a rounded-rectangle loop, centred below the quote.
  const cw = 560, ch = 350, x0 = W / 2 - cw / 2, y0 = 560, r = radius * 1.75, pts = [];
  const corner = (cx2, cy2, a0) => { for (let k = 0; k <= 6; k++) { const a = ((a0 + 15 * k) * Math.PI) / 180; pts.push([cx2 + r * Math.cos(a), cy2 + r * Math.sin(a)]); } };
  corner(x0 + r, y0 + r, 180); corner(x0 + cw - r, y0 + r, 270); corner(x0 + cw - r, y0 + ch - r, 0); corner(x0 + r, y0 + ch - r, 90);
  pts.push(pts[0]);
  card = pts;
  [underline, circle, card].forEach(measure);
}

// The first fraction p of a polyline as points (for dashed partial strokes).
function partial(pts, p) {
  const c = measure(pts), L = c.at(-1) * p, out = [pts[0]];
  for (let i = 1; i < pts.length && c[i] < L; i++) out.push(pts[i]);
  out.push(pointAt(pts, L));
  return out;
}

// Characters revealed so far, laid out against the full string so nothing shifts.
function typeOn(ctx, text, x, y, t0, t, align = 'left') {
  const n = Math.floor(win(t, t0, t0 + motion.typePerChar * text.length) * text.length + 1e-9);
  const x0 = align === 'center' ? x - ctx.measureText(text).width / 2 : x;
  ctx.textAlign = 'left';
  ctx.fillText(text.slice(0, n), x0, y);
}

function ledger(ctx, t) {
  // Ruled lines and the red margin rule.
  ctx.fillStyle = colors.dim;
  ctx.globalAlpha = 0.45;
  for (let i = 0; i <= YEARS.length; i++) ctx.fillRect(safe.x - 40, rowY(i) - ROW / 2, W - 2 * safe.x + 80, 2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.accent;
  ctx.fillRect(RULE_X, rowY(0) - ROW / 2 - 40, 3, ROW * YEARS.length + 80);
  ctx.fillRect(RULE_X + 9, rowY(0) - ROW / 2 - 40, 3, ROW * YEARS.length + 80);

  // Header, right-aligned: bold italic title wipes on, italic subtitle under it.
  const titleY = safe.y + Math.round(0.108 * H);
  ctx.save();
  ctx.beginPath();
  const right = W - safe.x, wipe = win(t, motion.titleDelay, motion.titleDelay + motion.titleWipe);
  ctx.font = font('italic', 700, sizes.hero);
  const tw = ctx.measureText(T[0]).width;
  ctx.rect(right - tw - 20, 0, (tw + 40) * wipe, titleY + 40);
  ctx.clip();
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'right';
  ctx.fillText(T[0], right, titleY);
  ctx.restore();
  registerText(ctx, right - tw, titleY - 0.108 * H, right, titleY + sizes.hero * 0.25, colors.ink, T[0]);
  ctx.font = font('italic', 400, sizes.label);
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'right';
  ctx.fillText(T[1], right, titleY + 64);
  const sw = ctx.measureText(T[1]).width;
  registerText(ctx, right - sw, titleY + 64 - sizes.label * 0.72, right, titleY + 64 + sizes.label * 0.25, colors.ink, T[1]);

  // Years, bars (ink hatching, drawn on left to right) and values.
  ctx.font = font('', 400, sizes.body);
  ctx.textBaseline = 'middle';
  YEARS.forEach((year, i) => {
    const y = rowY(i), grow = win(t, growAt(i), growAt(i) + motion.drawOn);
    ctx.fillStyle = colors.ink;
    ctx.textAlign = 'left';
    ctx.fillText(String(year), safe.x, y + 4);
    if (grow <= 0) return;
    const w = SHARE[i] * BAR_PER * grow;
    ctx.save();
    ctx.beginPath();
    ctx.rect(BAR_X, y - BAR_H / 2, w, BAR_H);
    ctx.clip();
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = stroke.detail;
    ctx.beginPath();
    for (let x = BAR_X - BAR_H; x < BAR_X + w + BAR_H; x += 14) {
      ctx.moveTo(x, y + BAR_H / 2);
      ctx.lineTo(x + BAR_H, y - BAR_H / 2);
    }
    ctx.stroke();
    ctx.strokeRect(BAR_X + 1.5, y - BAR_H / 2 + 1.5, w - 3, BAR_H - 3);
    ctx.restore();
    ctx.fillStyle = colors.ink;
    typeOn(ctx, `${SHARE[i]}%`, BAR_X + SHARE[i] * BAR_PER + 30, y + 4, growAt(i) + motion.drawOn, t);
  });
  ctx.textBaseline = 'alphabetic';

  // The steepest year: underline, then a circle round its value.
  const u0 = growAt(YEARS.length - 1) + motion.drawOn + motion.drawDelay * 0.25;
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = stroke.annotate;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawOn(ctx, underline, win(t, u0, u0 + motion.drawOn));
  drawOn(ctx, circle, win(t, u0 + motion.drawOn + 0.1, u0 + 2 * motion.drawOn + 0.1));
}

function quote(ctx, u) {
  const text = T[2], size = sizes.h1, baseline = safe.y + Math.round(0.097 * H);
  ctx.font = font('', 700, size, fonts.slab);
  const full = ctx.measureText(text).width, x0 = W / 2 - full / 2;
  // Marker behind the text: from half the cap height above the baseline to just below it.
  const typed = TYPED;
  const m = win(u, typed, typed + motion.marker), cap = 0.097 * H;
  if (m > 0) {
    ctx.fillStyle = colors.highlight;
    ctx.fillRect(x0 + size * 0.12, baseline - cap * 0.5, (full - size * 0.24) * m, cap * 0.6);
  }
  ctx.fillStyle = colors.ink;
  typeOn(ctx, text, W / 2, baseline, motion.titleDelay, u, 'center');
  registerText(ctx, x0, baseline - cap, x0 + full, baseline + size * 0.25, colors.ink, text);

  // The absent card: a dashed red outline drawing on, with a caption under it.
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = stroke.annotate;
  ctx.lineCap = 'round';
  ctx.setLineDash([28, 18]);
  const p = win(u, motion.drawDelay, motion.drawDelay + motion.drawOn * 2);
  if (p > 0) {
    const pts = partial(card, p);
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.font = font('italic', 400, sizes.label);
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'center';
  ctx.fillText(T[3], W / 2, 1000);
  const cw = ctx.measureText(T[3]).width;
  registerText(ctx, W / 2 - cw / 2, 1000 - sizes.label * 0.72, W / 2 + cw / 2, 1000 + sizes.label * 0.25, colors.ink, T[3]);
}

export function draw(ctx, t) {
  if (t < CUT) {
    // Locked-off camera; one move down the page between holds.
    const y = -OFFSET * inOutCubic(win(t, MOVE[0], MOVE[1]));
    withCamera(ctx, { s: 1, x: 0, y, r: 0 }, (c) => ledger(c, t));
  } else {
    withCamera(ctx, { s: 1, x: 0, y: 0, r: 0 }, (c) => quote(c, t - CUT));
  }
}
