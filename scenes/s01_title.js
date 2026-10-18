import { win, lerp, outExpo, inOutQuint } from '../engine/ease.js';
import { backdrop, loadBackdrop } from '../engine/backdrop.js';
import { W, H, colors, fonts, sizes, tracking, safe } from '../tokens.js';

export const start = 0;
export const dur = 5;

// Stand-in copy: the brief's {{HEADLINE}} and {{LABEL}} were never filled in.
const HEADLINE = 'Motion, written in code.';
const ACCENT_WORD = 3;
const LABEL = 'S01 / TITLE CARD';

const STAGGER = 0.09, ENTER = 0.3, WORD_DUR = 0.8, EXIT = 0.5, PUSH = 1.03;

// Safe box in scene space, inset so the camera push ends exactly on the safe margins.
const SX = W / 2 - (W / 2 - safe.x) / PUSH, SY = H / 2 - (H / 2 - safe.y) / PUSH;

// The word layer is scratch space, cleared before every use, so it carries nothing between calls.
let layer, lctx;
export async function load() {
  layer = new OffscreenCanvas(W, H);
  lctx = layer.getContext('2d');
  await loadBackdrop();
}

// One line if it fits at 85% of hero or more; otherwise greedy wrap to two, shrinking if needed.
function layout(ctx) {
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

export function draw(ctx, t, d = dur) {
  const push = lerp(1, PUSH, t / d);
  ctx.setTransform(push, 0, 0, push, (W * (1 - push)) / 2, (H * (1 - push)) / 2);
  backdrop(ctx, t);

  const out = inOutQuint(win(t, d - EXIT, d));
  ctx.translate(0, -40 * out);
  const fade = 1 - out;

  // Label types on between 0.2 and 0.7 s.
  const n = Math.floor(win(t, 0.2, 0.7) * LABEL.length + 1e-9);
  ctx.font = `400 ${sizes.label}px ${fonts.mono}`;
  ctx.letterSpacing = `${tracking.label * sizes.label}px`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = colors.dim;
  ctx.globalAlpha = fade;
  ctx.fillText(LABEL.slice(0, n), SX, SY);
  if (t >= 0.2 && t < 1.4 && Math.floor(t * 4) % 2 === 0) {
    const cx = SX + ctx.measureText(LABEL.slice(0, n)).width;
    ctx.fillRect(cx + 4, SY, 14, sizes.label);
  }

  // Headline, left-aligned on the safe margin and vertically centred.
  const { size, placed, lines } = layout(ctx);
  const lineH = size * 1.02, top = H / 2 - (lines * lineH) / 2;
  lctx.font = ctx.font;
  lctx.letterSpacing = ctx.letterSpacing;
  for (const p of placed) {
    const u = outExpo(win(t, ENTER + p.i * STAGGER, ENTER + p.i * STAGGER + WORD_DUR));
    if (u <= 0) continue;
    // Draw the word opaque, then fade the whole layer, so overlapping glyphs don't double up.
    lctx.clearRect(0, 0, W, H);
    lctx.fillStyle = p.i === ACCENT_WORD ? colors.accent : colors.ink;
    lctx.fillText(p.w, SX + p.x, top + p.line * lineH + size * 0.8);
    const blur = 12 * (1 - u);
    ctx.filter = blur > 0.05 ? `blur(${blur}px)` : 'none';
    ctx.globalAlpha = fade * u;
    ctx.drawImage(layer, 0, 60 * (1 - u));
  }
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
}
