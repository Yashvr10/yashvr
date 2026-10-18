// FROZEN: read-only from phase 7 on. Need something it lacks? Write it in your scene file and report it (NOTES.md).
// On-screen copy as a system. All visible text lives in copy.json, keyed by scene id; scenes
// read it with lines(id). A scene declares its captions (which lines, when they enter and when
// they are fully settled), and holdFor sizes how long each stays fully legible.
import copy from '../copy.json' with { type: 'json' };
import { win, clamp01 } from './ease.js';
import { riseIn } from './type.js';
import { boxes } from './textboxes.js';
import { W, H, SS, hold, colors, fonts, sizes, tracking } from '../tokens.js';

export const lines = (id) => copy[id];

const words = (text) => text.trim().split(/\s+/).filter(Boolean).length;
// Seconds of fully settled legibility for a caption.
export const holdFor = (text) => Math.max(hold, 0.35 + words(text) / 3.2);

// "$120K+" → { prefix: '$', value: 120, suffix: 'K+' }. For numbers that count or roll.
export function parseNumber(text) {
  const m = text.match(/^(\D*)([\d,]+)(.*)$/);
  return { prefix: m[1], value: Number(m[2].replace(/,/g, '')), suffix: m[3] };
}

// A scene's caption windows from its declarations [{ lines: [k, …], in, at }] (local seconds:
// entrance starts at `in`, fully settled at `at`). out = at + holdFor(the caption's text).
export function windows(id, captions) {
  return captions.map((c) => {
    const text = c.lines.map((k) => copy[id][k]).join('\n');
    return { ...c, text, out: c.at + holdFor(text) };
  });
}

// 1 while any caption is fully settled, ramping over `ramp` seconds outside each window, 0 in
// the gaps. Scenes scale background particle density and bloom by 1 − 0.4 × duck.
export const DUCK = 0.4;
export function duckAt(wins, t, ramp = 0.5) {
  let d = 0;
  for (const w of wins) d = Math.max(d, Math.min(win(t, w.at - ramp, w.at), 1 - win(t, w.out, w.out + ramp)));
  return d;
}

export { boxes, resetBoxes, registerText, registerBox } from './textboxes.js';

// WCAG relative luminance of an sRGB triple, and hex → triple.
const relLum = ([r, g, b]) => {
  const f = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const hexRGB = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

// A caption block: lines rise in (kinetic riseIn, per-glyph), over an automatic soft radial
// scrim (30%, feathered) sized to the block, with a 24 px blur shadow at 40% alpha. Scrim and
// shadow take the opposite polarity to the text: black behind light text, paper behind dark
// text, so they always add contrast.
// opts: x, y (first baseline), align, size, family, weight, color, lineH (× size), stagger
// between lines (s), and riseIn's own options.
export function caption(ctx, t, text, opts = {}) {
  const o = {
    align: 'center', size: sizes.body, family: 'body', weight: 400, color: colors.ink,
    lineH: 1.2, stagger: 0.12, track: tracking.body, x: W / 2, y: H / 2, ...opts,
  };
  const rows = Array.isArray(text) ? text : [text];
  if (t < 0) return;
  ctx.save();
  ctx.font = `${o.weight} ${o.size}px ${fonts[o.family]}`;
  ctx.letterSpacing = `${o.track * o.size}px`;
  const widths = rows.map((r) => ctx.measureText(r).width), bw = Math.max(...widths);
  const left = o.align === 'center' ? o.x - bw / 2 : o.align === 'right' ? o.x - bw : o.x;
  const top = o.y - o.size * 0.8, bottom = o.y + (rows.length - 1) * o.size * o.lineH + o.size * 0.25;

  // Scrim: an ellipse 1.5× the block, 30% black at the centre, fading to 0 at its edge.
  const dark = relLum(hexRGB(o.color)) < 0.18, halo = dark ? hexRGB(colors.bg).join(',') : '0,0,0';
  const show = clamp01(t / 0.3), cx = left + bw / 2, cy = (top + bottom) / 2;
  const rx = bw * 0.75 + o.size * 0.5, ry = (bottom - top) * 0.75 + o.size * 0.5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(${halo},${0.3 * show})`);
  g.addColorStop(0.6, `rgba(${halo},${0.18 * show})`);
  g.addColorStop(1, `rgba(${halo},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(-rx, -rx, 2 * rx, 2 * rx);
  ctx.restore();

  ctx.shadowColor = `rgba(${halo},0.4)`;
  ctx.shadowBlur = 24 * SS; // shadowBlur ignores the transform
  // riseIn registers each line's box itself.
  rows.forEach((r, i) => riseIn(ctx, t - i * o.stagger, { ...o, text: r, y: o.y + i * o.size * o.lineH }));
  ctx.restore();
}

// WCAG contrast of each recorded box against the finished frame behind it (read back from the
// WebGL canvas). Background = the median of the box's pixels on the far side from the text
// colour. Logs a warning below `min` (once per text if `seen` is a Set) and returns every result.
export function checkContrast(gl, min = 7, seen = null) {
  return boxes.map((b) => {
    // Boxes are in layout px; the frame is SS× that.
    const x = Math.max(0, Math.floor(b.x0 * SS)), y = Math.max(0, Math.floor(b.y0 * SS));
    const w = Math.min(W * SS, Math.ceil(b.x1 * SS)) - x, h = Math.min(H * SS, Math.ceil(b.y1 * SS)) - y;
    if (w <= 0 || h <= 0) return { ...b, ratio: null };
    const px = new Uint8Array(w * h * 4);
    gl.readPixels(x, H * SS - y - h, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const lt = relLum(hexRGB(b.color)), ls = [];
    for (let i = 0; i < px.length; i += 4) ls.push(relLum([px[i], px[i + 1], px[i + 2]]));
    ls.sort((p, q) => (lt < 0.5 ? q - p : p - q)); // far side from the text colour first
    const lb = ls[Math.floor(ls.length * 0.2)];
    const ratio = (Math.max(lt, lb) + 0.05) / (Math.min(lt, lb) + 0.05);
    if (ratio < min && !seen?.has(b.text)) {
      seen?.add(b.text);
      console.warn(`contrast ${ratio.toFixed(1)}:1 < ${min}:1 for "${b.text}"`);
    }
    return { ...b, ratio };
  });
}

// Whether a box lies inside a safe rect { x, y, w, h }.
export const inside = (b, s) => b.x0 >= s.x && b.y0 >= s.y && b.x1 <= s.x + s.w && b.y1 <= s.y + s.h;
