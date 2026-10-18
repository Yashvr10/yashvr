// Kinetic type for Canvas2D. Every move is move(ctx, t, opts): t is seconds since the move
// started, it draws immediately and depends only on t and opts.
// Common opts: text, x, y (baseline), align ('center' | 'left' | 'right'), size, weight,
// family (a key of tokens.fonts), track (em), color, accent.
import { win, outExpo, outCubic, inOutQuint } from './ease.js';
import { hash } from './rng.js';
import { layer, blit } from './layer.js';
import { W, H, FPS, colors, fonts, sizes, tracking } from '../tokens.js';

const base = (o) => ({
  family: 'display', weight: 700, size: sizes.hero, track: tracking.display,
  color: colors.ink, accent: colors.accent, align: 'center', x: W / 2, y: H / 2, ...o,
});
const fontOf = (o) => `${o.weight} ${o.size}px ${fonts[o.family]}`;
const leftOf = (o, width) => (o.align === 'center' ? o.x - width / 2 : o.align === 'right' ? o.x - width : o.x);

// Glyph positions keep the font's kerning: each x is the width of the prefix up to and
// including that glyph, minus the glyph itself.
export function layoutGlyphs(ctx, str, x, y, font, trackPx = 0) {
  ctx.font = font;
  ctx.letterSpacing = '0px';
  const chars = [...str];
  let prefix = '';
  const glyphs = chars.map((ch, i) => {
    prefix += ch;
    const w = ctx.measureText(ch).width;
    return { ch, i, y, w, x: x + ctx.measureText(prefix).width - w + i * trackPx };
  });
  return { glyphs, width: ctx.measureText(str).width + Math.max(0, chars.length - 1) * trackPx };
}

// Glyph index range [start, end) of word k.
function wordSpan(text, k) {
  const words = text.split(' '), s = words.slice(0, k).join(' ').length + (k ? 1 : 0);
  return [s, s + words[k].length];
}

// opts.room = { word, px } adds px of space on each side of a word (used by markerWipe),
// keeping the line anchored to its alignment.
function lay(ctx, o, str = o.text) {
  const l = layoutGlyphs(ctx, str, 0, o.y, fontOf(o), o.track * o.size);
  const px = o.room?.px ?? 0, [s, e] = px ? wordSpan(str, o.room.word) : [0, 0];
  const shift = o.align === 'center' ? -px : o.align === 'right' ? -2 * px : 0;
  const dx = leftOf(o, l.width);
  for (const g of l.glyphs) g.x += dx + shift + (g.i >= e ? 2 * px : g.i >= s ? px : 0);
  ctx.textBaseline = 'alphabetic';
  return l;
}

// Draws fn into a layer, then composites it at alpha, shifted dy. Fading the whole layer keeps
// overlapping glyphs from doubling up. Don't nest it around splitExit, which uses the layers itself.
export function fade(ctx, alpha, dy, fn) {
  if (alpha <= 0) return;
  if (alpha >= 1 && !dy) return fn(ctx);
  const l = layer(0, ctx);
  fn(l);
  blit(ctx, l, alpha, 0, dy * ctx.getTransform().d);
}

// 1. Per-glyph rise, blur and alpha. Total time: stagger * (glyphs - 1) + dur.
export function riseIn(ctx, t, opts) {
  const o = base({ stagger: 0.03, dur: 0.25, rise: 40, blur: 8, ...opts });
  ctx.fillStyle = o.color;
  for (const g of lay(ctx, o).glyphs) {
    const u = outExpo(win(t, g.i * o.stagger, g.i * o.stagger + o.dur));
    if (u <= 0 || g.ch === ' ') continue;
    ctx.globalAlpha = u;
    ctx.filter = u < 0.995 ? `blur(${o.blur * (1 - u)}px)` : 'none';
    ctx.fillText(g.ch, g.x, g.y + o.rise * (1 - u));
  }
  ctx.filter = 'none';
  ctx.globalAlpha = 1;
}

// 2. Glyphs lock left to right over dur. Unlocked cells cycle through POOL at `rate` Hz,
// centred in the final glyph's cell so the line never shifts.
const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>';
export function scramble(ctx, t, opts) {
  const o = base({ dur: 0.45, seed: 1, rate: 20, ...opts });
  if (t < 0) return;
  const { glyphs } = lay(ctx, o), tick = Math.floor(t * o.rate);
  for (const g of glyphs) {
    if (g.ch === ' ') continue;
    const locked = t >= (o.dur * (g.i + 1)) / glyphs.length;
    const ch = locked ? g.ch : POOL[Math.floor(hash(g.i, o.seed + tick) * POOL.length)];
    ctx.fillStyle = locked ? o.color : o.accent;
    ctx.fillText(ch, g.x + (g.w - ctx.measureText(ch).width) / 2, g.y);
  }
}

// 3. Types over dur. The newest character is accent while typing; the caret is solid while
// typing and blinks at 2 Hz after. Laid out against the full string so it never shifts.
export function typeOn(ctx, t, opts) {
  const o = base({ dur: 0.45, caret: true, ...opts });
  if (t < 0) return;
  const { glyphs } = lay(ctx, o);
  const n = Math.floor(win(t, 0, o.dur) * glyphs.length + 1e-9), typing = t < o.dur;
  for (const g of glyphs.slice(0, n)) {
    ctx.fillStyle = typing && g.i === n - 1 ? o.accent : o.color;
    ctx.fillText(g.ch, g.x, g.y);
  }
  if (o.caret && (typing || Math.floor((t - o.dur) * 4) % 2 === 0)) {
    const last = glyphs[n - 1], cx = last ? last.x + last.w + o.size * 0.06 : glyphs[0].x;
    ctx.fillStyle = o.accent;
    ctx.fillRect(cx, o.y - o.size * 0.74, Math.max(3, o.size * 0.06), o.size * 0.88);
  }
}

// 4. Rolls an integer from `from` to `to`. Every column turns `spins` extra times plus its own
// distance on one outCubic curve, so all land together. Columns follow the final value's digits
// and use the widest digit, so nothing shifts. Columns `from` doesn't have fade in instead of
// showing leading zeros. The clip window hugs the figure height and one roll step is one window.
// Summed samples over half a frame give the roll a 180° shutter blur.
export function odometer(ctx, t, opts) {
  const o = base({ from: 0, to: 0, dur: 0.5, spins: 1, prefix: '', suffix: '', ...opts });
  if (t < 0) return;
  const end = String(Math.abs(o.to)), cols = end.length, from = String(Math.abs(o.from));
  const begin = from.padStart(cols, '0').slice(-cols), lead = cols - from.length;
  ctx.font = fontOf(o);
  ctx.letterSpacing = '0px';
  ctx.textBaseline = 'alphabetic';
  const track = o.track * o.size;
  const cell = Math.max(...[...'0123456789'].map((d) => ctx.measureText(d).width)) + track;
  const pre = o.prefix ? ctx.measureText(o.prefix).width + track : 0;
  const x0 = leftOf(o, pre + cols * cell + (o.suffix ? ctx.measureText(o.suffix).width : 0));
  const m = o.size * 0.08, top = o.y - ctx.measureText('0').actualBoundingBoxAscent - m, pitch = o.y + m - top;
  const show = outCubic(win(t, 0, 0.15)), grow = outCubic(win(t, 0, o.dur * 0.6));

  ctx.globalAlpha = show;
  ctx.fillStyle = o.color;
  ctx.fillText(o.prefix, x0, o.y);
  ctx.fillText(o.suffix, x0 + pre + cols * cell, o.y);
  ctx.globalAlpha = 1;

  // Blur samples: enough that neighbours sit about 2 px apart at the current roll speed.
  const dist = [...end].map((b, k) => ((+b - +begin[k] + 10) % 10) + 10 * o.spins);
  const shutter = 0.5 / FPS, at = (tt) => outCubic(win(tt, 0, o.dur));
  const spread = (at(t) - at(t - shutter)) * Math.max(...dist) * pitch;
  const taps = Math.min(48, Math.max(2, Math.ceil(spread / 2)));

  // Running mean (tap j at alpha 1/(j+1)): one colour throughout, so no rounding tint, and a
  // still digit stays fully solid.
  const acc = layer(1, ctx);
  acc.font = ctx.font;
  acc.textBaseline = 'alphabetic';
  acc.fillStyle = o.color;
  for (let j = 0; j < taps; j++) {
    const u = at(t - (j * shutter) / (taps - 1));
    acc.globalAlpha = 1 / (j + 1);
    for (let k = 0; k < cols; k++) {
      const x = x0 + pre + k * cell, p = +begin[k] + u * dist[k], d = Math.floor(p), f = p - d;
      acc.save();
      acc.beginPath();
      acc.rect(x, top, cell, pitch);
      acc.clip();
      for (const [digit, dy] of [[d % 10, -f * pitch], [(d + 1) % 10, (1 - f) * pitch]]) {
        const s = String(digit);
        acc.fillText(s, x + (cell - track - acc.measureText(s).width) / 2, o.y + dy);
      }
      acc.restore();
    }
  }
  // Mask each column: fade in its margins (still digits never reach them) and apply its alpha.
  acc.globalCompositeOperation = 'destination-in';
  acc.globalAlpha = 1;
  for (let k = 0; k < cols; k++) {
    const x = x0 + pre + k * cell, a = k < lead ? grow : show, g = acc.createLinearGradient(0, top, 0, top + pitch);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(m / pitch, `rgba(0,0,0,${a})`);
    g.addColorStop(1 - m / pitch, `rgba(0,0,0,${a})`);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    acc.save();
    acc.beginPath();
    acc.rect(x, top, cell, pitch);
    acc.clip();
    acc.fillStyle = g;
    acc.fillRect(x, top, cell, pitch);
    acc.restore();
  }
  blit(ctx, acc, 1);
}

// 5. An accent pill grows behind word number `word` while its neighbours slide apart to make
// room, then a second wipe flips that word's glyphs to `on` (default bg: our ink is light and
// would vanish on the accent).
export function markerWipe(ctx, t, opts) {
  const o = base({ word: 0, dur: 0.4, pad: 0.16, on: colors.bg, ...opts });
  const grow = outExpo(win(t, 0, o.dur * 0.6)), flip = outExpo(win(t, o.dur * 0.35, o.dur));
  const padX = o.size * o.pad, [s, e] = wordSpan(o.text, o.word);
  const { glyphs } = lay(ctx, { ...o, room: { word: o.word, px: padX * grow } });
  const x0 = glyphs[s].x - padX, full = glyphs[e - 1].x + glyphs[e - 1].w + padX - x0;
  const top = o.y - o.size * 0.86, h = o.size * 1.06;

  if (grow > 0) {
    ctx.fillStyle = o.accent;
    ctx.beginPath();
    ctx.roundRect(x0, top, full * grow, h, h / 2);
    ctx.fill();
  }
  ctx.fillStyle = o.color;
  for (const g of glyphs) ctx.fillText(g.ch, g.x, g.y);
  if (flip > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(x0, top, full * flip, h);
    ctx.clip();
    ctx.fillStyle = o.on;
    for (const g of glyphs.slice(s, e)) ctx.fillText(g.ch, g.x, g.y);
    ctx.restore();
  }
}

// 6. Breaks the line in the space before its middle word; the halves slide apart and fade over
// dur. opts.paint(ctx) draws the settled line (default: plain text), so a marked line keeps
// its pill; pass the same `room` the painted line uses so the break lands in the right gap.
// Motion blur: each half is drawn `taps` times across half a frame of travel (a 180° shutter),
// added together so a stationary half comes out exactly solid.
export function splitExit(ctx, t, opts) {
  const o = base({ dur: 0.25, dist: 420, taps: 6, ...opts });
  if (t >= o.dur) return;
  const m = Math.floor(o.text.split(' ').length / 2), [s] = wordSpan(o.text, m), { glyphs } = lay(ctx, o);
  const cut = m ? (glyphs[s - 2].x + glyphs[s - 2].w + glyphs[s].x) / 2 : -1e5;
  const paint = o.paint ?? ((c) => {
    c.font = fontOf(o);
    c.textBaseline = 'alphabetic';
    c.fillStyle = o.color;
    for (const g of glyphs) c.fillText(g.ch, g.x, g.y);
  });
  const travel = (tt) => o.dist * inOutQuint(win(tt, 0, o.dur));
  const sx = ctx.getTransform().a, acc = layer(1, ctx);
  acc.setTransform(1, 0, 0, 1, 0, 0);
  acc.globalCompositeOperation = 'lighter';
  acc.globalAlpha = 1 / o.taps;

  for (const dir of [-1, 1]) {
    const half = layer(0, ctx);
    half.beginPath();
    half.rect(dir < 0 ? cut - 1e5 : cut, -1e5, 1e5, 2e5);
    half.clip();
    paint(half);
    for (let k = 0; k < o.taps; k++) {
      acc.drawImage(half.canvas, dir * travel(t - (k * 0.5) / FPS / (o.taps - 1)) * sx, 0);
    }
  }
  blit(ctx, acc, 1 - outCubic(win(t, o.dur * 0.25, o.dur)));
}
