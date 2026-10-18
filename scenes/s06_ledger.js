// The Ledger: online payments after 2014, in the measured reference style (STYLE.md).
// Shot 1 (0–6.5 s): a ruled ledger page; bars draw on year by year; the camera moves down the
// page to 2020–2024; a red underline and circle mark the steepest year.
// Shot 2 (6.5–9 s, hard cut): a slab-serif quoted phrase types on with a marker behind it,
// above a dashed outline of an absent card. Its exit (lift and fade to bare paper, after `end`)
// plays only where an edit includes it: the vertical edit ends on it, so it loops into s01's empty first frame.
import { win, inOutCubic } from '../engine/ease.js';
import { hash } from '../engine/rng.js';
import { measure, pointAt, drawOn } from '../engine/draw.js';
import { withCamera } from '../engine/camera.js';
import { fade } from '../engine/type.js';
import { L, rowsOf, baselines } from '../engine/layout.js';
import { lines, windows, registerText } from '../engine/copy.js';
import { FPS, colors, fonts, sizes, motion, stroke, radius } from '../tokens.js';

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
export const end = Math.max(9, ...captions.map((c) => c.out));
const EXIT = 0.5;
export const dur = end + EXIT;
// The page, in the layout: header on the safe top, rows sized with the type, bars filling the band.
const TITLE_Y = L.textTop + L.cap(10.8); // title baseline: its cap height under the text top
const ROW = L.type(150), ROW0 = TITLE_Y + L.type(177); // row centres in page px
const RULE_X = L.left + L.type(290), BAR_X = RULE_X + L.type(44), BAR_H = L.type(56);
const BAR_PER = (L.right - L.type(210) - BAR_X) / 70; // px per percentage point
// The move ends with 2019's top rule on the frame edge (16:9) or the safe top (9:16, under the
// platform's top bar), so no row is cut in half.
const MOVE = [3.3, 3.3 + motion.move], OFFSET = ROW0 + ROW * 5 - ROW / 2 - (L.stack ? L.top : 0); // page scroll in px
const rowY = (i) => ROW0 + ROW * i;
const growAt = (i) => (i < 5 ? 0.6 + 0.12 * i : MOVE[1] + 0.07 + 0.12 * (i - 5));
const font = (style, weight, size, family = fonts.display) => `${style} ${weight} ${size}px ${family}`;

// Annotations are fixed polylines in page px, measured once at load.
let underline, circle, card;
export async function load() {
  const y = rowY(STEEPEST) + BAR_H / 2 + L.type(22), x1 = BAR_X + SHARE[STEEPEST] * BAR_PER + L.type(170);
  underline = Array.from({ length: 25 }, (_, k) => [L.left - 10 + ((x1 - L.left + 10) * k) / 24, y + 4 * Math.sin(k * 0.9) + (k / 24) * 6]);
  // A hand-drawn loop: 1.1 turns with a slightly uneven, fixed radius.
  const cx = BAR_X + SHARE[STEEPEST] * BAR_PER + L.type(95), cy = rowY(STEEPEST) - 4;
  circle = Array.from({ length: 61 }, (_, k) => {
    const a = -2.4 + (k / 60) * Math.PI * 2 * 1.1, r = 1 + 0.05 * (hash(k >> 3, 61) - 0.5) + 0.04 * (k / 60);
    return [cx + L.type(112) * r * Math.cos(a), cy + L.type(64) * r * Math.sin(a)];
  });
  // The absent card: a rounded-rectangle loop, centred below the quote, its top just under the band's centre.
  const cw = CARD.w, ch = CARD.h, x0 = L.cx() - cw / 2, y0 = CARD.y, r = radius * 1.75, pts = [];
  const corner = (cx2, cy2, a0) => { for (let k = 0; k <= 6; k++) { const a = ((a0 + 15 * k) * Math.PI) / 180; pts.push([cx2 + r * Math.cos(a), cy2 + r * Math.sin(a)]); } };
  corner(x0 + r, y0 + r, 180); corner(x0 + cw - r, y0 + r, 270); corner(x0 + cw - r, y0 + ch - r, 0); corner(x0 + r, y0 + ch - r, 90);
  pts.push(pts[0]);
  card = pts;
  [underline, circle, card].forEach(measure);
}

// The absent card and its caption, 90 px under it: the card's top just under the band's centre,
// raised if that would put the caption's descenders past the safe bottom.
const CARD_CAPTION = Math.min(L.cy() + 460, L.bottom - sizes.label * 0.25);
const CARD = { w: 560, h: 350, y: CARD_CAPTION - 90 - 350 };

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
  for (let i = 0; i <= YEARS.length; i++) ctx.fillRect(L.left - 40, rowY(i) - ROW / 2, L.width + 80, 2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = colors.accent;
  ctx.fillRect(RULE_X, rowY(0) - ROW / 2 - 40, 3, ROW * YEARS.length + 80);
  ctx.fillRect(RULE_X + 9, rowY(0) - ROW / 2 - 40, 3, ROW * YEARS.length + 80);

  // Header, right-aligned: bold italic title wipes on, italic subtitle under it.
  const titleY = TITLE_Y;
  ctx.save();
  ctx.beginPath();
  const right = L.right, wipe = win(t, motion.titleDelay, motion.titleDelay + motion.titleWipe);
  ctx.font = font('italic', 700, sizes.hero);
  const tw = ctx.measureText(T[0]).width;
  ctx.rect(right - tw - 20, 0, (tw + 40) * wipe, titleY + 40);
  ctx.clip();
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'right';
  ctx.fillText(T[0], right, titleY);
  ctx.restore();
  registerText(ctx, right - tw, titleY - L.cap(10.8), right, titleY + sizes.hero * 0.25, colors.ink, T[0]);
  ctx.font = font('italic', 400, sizes.label);
  ctx.fillStyle = colors.ink;
  ctx.textAlign = 'right';
  const subY = titleY + L.type(64);
  ctx.fillText(T[1], right, subY);
  const sw = ctx.measureText(T[1]).width;
  registerText(ctx, right - sw, subY - sizes.label * 0.72, right, subY + sizes.label * 0.25, colors.ink, T[1]);

  // Years, bars (ink hatching, drawn on left to right) and values.
  ctx.font = font('', 400, sizes.body);
  ctx.textBaseline = 'middle';
  YEARS.forEach((year, i) => {
    const y = rowY(i), grow = win(t, growAt(i), growAt(i) + motion.drawOn);
    ctx.fillStyle = colors.ink;
    ctx.textAlign = 'left';
    ctx.fillText(String(year), L.left, y + 4);
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
    typeOn(ctx, `${SHARE[i]}%`, BAR_X + SHARE[i] * BAR_PER + L.type(30), y + 4, growAt(i) + motion.drawOn, t);
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
  const size = sizes.h1, cap = L.type(0.097 * 1080), first = L.textTop + Math.ceil(cap); // box top on or under textTop
  ctx.font = font('', 700, size, fonts.slab);
  // One line in 16:9; balanced rows in 9:16, typed one after the other (same total time).
  // Marker behind each row: from half the cap height above the baseline to just below it.
  const m = win(u, TYPED, TYPED + motion.marker);
  let off = 0;
  for (const [k, text] of rowsOf(ctx, T[2], L.width).entries()) {
    const baseline = first + k * size * 1.1, full = ctx.measureText(text).width, x0 = L.cx() - full / 2;
    if (m > 0) {
      ctx.fillStyle = colors.highlight;
      ctx.fillRect(x0 + size * 0.12, baseline - cap * 0.5, (full - size * 0.24) * m, cap * 0.6);
    }
    ctx.fillStyle = colors.ink;
    typeOn(ctx, text, L.cx(), baseline, motion.titleDelay + motion.typePerChar * off, u, 'center');
    registerText(ctx, x0, baseline - cap, x0 + full, baseline + size * 0.25, colors.ink, T[2]);
    off += [...text].length + 1;
  }

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
  ctx.fillText(T[3], L.cx(), CARD_CAPTION);
  const cw = ctx.measureText(T[3]).width;
  registerText(ctx, L.cx() - cw / 2, CARD_CAPTION - sizes.label * 0.72, L.cx() + cw / 2, CARD_CAPTION + sizes.label * 0.25, colors.ink, T[3]);
}

export function draw(ctx, t) {
  if (t < CUT) {
    // Locked-off camera; one move down the page between holds.
    const y = -OFFSET * inOutCubic(win(t, MOVE[0], MOVE[1]));
    withCamera(ctx, { s: 1, x: 0, y, r: 0 }, (c) => ledger(c, t));
  } else {
    // After `end`, the exit: lift and fade to bare paper, gone by the scene's last frame.
    const e = inOutCubic(win(t, end, dur - 1 / FPS));
    withCamera(ctx, { s: 1, x: 0, y: 0, r: 0 }, (c) => fade(c, 1 - e, -40 * e, (l) => quote(l, t - CUT)));
  }
}
