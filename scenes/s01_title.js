import { win, outExpo, inOutQuint } from '../engine/ease.js';
import { withCamera, defaultPush, layerScale, Z, PUSH, DRIFT } from '../engine/camera.js';
import { lines, windows, registerText } from '../engine/copy.js';
import { L, rowsOf } from '../engine/layout.js';
import { W, H, SS, colors, fonts, sizes, tracking } from '../tokens.js';

// Copy: [headline, slate label].
const [HEADLINE, LABEL] = lines('s01_title');
const ACCENT_WORD = HEADLINE.split(' ').length - 1;

const STAGGER = 0.09, ENTER = 0.3, WORD_DUR = 0.8, EXIT = 0.5;

// The headline is the caption: settled once its last word is 70% through outExpo (99%).
export const captions = windows('s01_title', [
  { lines: [0], in: ENTER, at: ENTER + (ACCENT_WORD * STAGGER) + 0.7 * WORD_DUR },
]);
// Cut where the hold ends; the exit plays after it.
export const end = captions[0].out;
export const dur = end + EXIT;

// Safe box in scene space, inset so the full camera push plus drift never crosses the margins.
const SX = W / 2 - (W / 2 - L.left - DRIFT.x) / (1 + PUSH), SY = H / 2 - (H / 2 - L.top - DRIFT.y) / (1 + PUSH);

// The word layer is scratch space, cleared before every use, so it carries nothing between calls.
let layer, lctx;
export async function load() {
  layer = new OffscreenCanvas(W * SS, H * SS);
  lctx = layer.getContext('2d');
  lctx.setTransform(SS, 0, 0, SS, 0, 0);
}

// 16:9: one line if it fits at 85% of hero or more; otherwise greedy wrap to two, shrinking if needed.
// 9:16: stacked, the accent word alone on the last line under the others, balanced over one or two lines.
function layout(ctx) {
  if (L.stack) return stacked(ctx);
  const words = HEADLINE.split(' '), maxW = W - 2 * SX;
  for (let size = sizes.hero; size >= sizes.hero * 0.85; size -= 2) {
    ctx.font = `700 ${size}px ${fonts.display}`;
    ctx.letterSpacing = `${tracking.display * size}px`;
    if (ctx.measureText(HEADLINE).width <= maxW) return wrap(ctx, words, size, Infinity);
  }
  for (let size = sizes.hero; ; size -= 4) {
    const l = wrap(ctx, words, size, maxW);
    if (l.lines <= 2 || size <= sizes.h1) return l;
  }
}

function stacked(ctx) {
  const words = HEADLINE.split(' '), maxW = W - 2 * SX, head = words.slice(0, ACCENT_WORD).join(' ');
  for (let size = sizes.hero; ; size -= 2) {
    ctx.font = `700 ${size}px ${fonts.display}`;
    ctx.letterSpacing = `${tracking.display * size}px`;
    const rows = [...(head ? rowsOf(ctx, head, maxW, 2) : []), words[ACCENT_WORD]];
    if (Math.max(...rows.map((r) => ctx.measureText(r).width)) <= maxW || size <= sizes.h2) return place(ctx, rows, size);
  }
}

// Word positions for fixed rows.
function place(ctx, rows, size) {
  const space = ctx.measureText(' ').width, placed = [];
  rows.forEach((row, line) => {
    let x = 0;
    for (const w of row.split(' ')) {
      placed.push({ w, i: placed.length, x, line });
      x += ctx.measureText(w).width + space;
    }
  });
  return { size, placed, lines: rows.length };
}

function wrap(ctx, words, size, maxW) {
  ctx.font = `700 ${size}px ${fonts.display}`;
  ctx.letterSpacing = `${tracking.display * size}px`;
  const space = ctx.measureText(' ').width;
  let x = 0, line = 0;
  const placed = words.map((w, i) => {
    const ww = ctx.measureText(w).width;
    if (x > 0 && x + ww > maxW) { line++; x = 0; }
    const p = { w, i, x, line };
    x += ww + space;
    return p;
  });
  return { size, placed, lines: line + 1 };
}

// One layer, the subject: label and headline.
export function draw(ctx, t, d = dur) {
  withCamera(ctx, layerScale(defaultPush(t, d), Z.subject), (c) => content(c, t, d));
}

function content(ctx, t, d) {
  const out = inOutQuint(win(t, d - EXIT, d));
  ctx.translate(0, -40 * out);
  const fade = 1 - out;

  // Label types on between 0.2 and 0.7 s.
  const n = Math.floor(win(t, 0.2, 0.7) * LABEL.length + 1e-9);
  ctx.font = `400 ${sizes.label}px ${fonts.mono}`;
  ctx.letterSpacing = `${tracking.label * sizes.label}px`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = colors.ink;
  ctx.globalAlpha = fade;
  ctx.fillText(LABEL.slice(0, n), SX, SY);
  if (t >= 0.2 && t < 1.4 && Math.floor(t * 4) % 2 === 0) {
    const cx = SX + ctx.measureText(LABEL.slice(0, n)).width;
    ctx.fillRect(cx + 4, SY, 14, sizes.label);
  }

  // Headline, left-aligned on the safe margin and centred in the safe band.
  const { size, placed, lines } = layout(ctx);
  const lineH = size * 1.02, top = L.cy() - (lines * lineH) / 2;
  lctx.font = ctx.font;
  lctx.letterSpacing = ctx.letterSpacing;
  for (const p of placed) {
    const u = outExpo(win(t, ENTER + p.i * STAGGER, ENTER + p.i * STAGGER + WORD_DUR));
    if (u <= 0) continue;
    // Draw the word opaque, then fade the whole layer, so overlapping glyphs don't double up.
    lctx.clearRect(0, 0, W, H);
    lctx.fillStyle = colors.ink; // captions are ink (contrast ≥ 7:1 on paper)
    lctx.fillText(p.w, SX + p.x, top + p.line * lineH + size * 0.8);
    const blur = 12 * (1 - u);
    ctx.filter = blur > 0.05 ? `blur(${blur * SS}px)` : 'none';
    ctx.globalAlpha = fade * u;
    ctx.drawImage(layer, 0, 60 * (1 - u), W, H);
  }
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
  const right = Math.max(...placed.map((p) => SX + p.x + lctx.measureText(p.w).width));
  registerText(ctx, SX, top, right, top + lines * lineH + size * 0.25, colors.ink, HEADLINE);
  registerText(ctx, SX, SY, SX + ctx.measureText(LABEL).width, SY + sizes.label, colors.ink, LABEL);
}
