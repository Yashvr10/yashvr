// Illustration helpers for Canvas2D. Pure functions of their inputs; the noise tile is built
// once at load and path lengths are cached by measure().
import { clamp01 } from './ease.js';
import { hash } from './rng.js';
import { layer, blit } from './layer.js';
import { W, H, FPS, colors, stroke, shadowAlpha } from '../tokens.js';

// Lighting model: one key light at the top left. Lightness shifts for the lit and shaded ends
// of a fill, and the strength of the rim light on the far edge.
const LIGHT = { hi: 0.08, lo: -0.1, rim: 0.35 };

function toHsl(hex) {
  const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2, d = max - min;
  if (!d) return [0, 0, l];
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function toHex(h, s, l) {
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x]
    : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return '#' + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
}

// Shifts a colour's HSL lightness by dl (-1..1), keeping hue and saturation.
export function shade(hex, dl) {
  const [h, s, l] = toHsl(hex);
  return toHex(h, s, clamp01(l + dl));
}

// Top-left-lit fill for the box (x, y, w, h): lit, base, shaded along the diagonal.
export function litFill(ctx, x, y, w, h, base) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, shade(base, LIGHT.hi));
  g.addColorStop(0.5, base);
  g.addColorStop(1, shade(base, LIGHT.lo));
  return g;
}

// Grey noise tile from the stateless hash.
export function noiseTile(size, seed) {
  const c = new OffscreenCanvas(size, size), g = c.getContext('2d'), img = g.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = hash(i, seed) * 255;
    img.data.set([v, v, v, 255], i * 4);
  }
  g.putImageData(img, 0, 0);
  return c;
}

let tile;
export async function loadDraw() {
  tile = noiseTile(512, 23);
}

// Film grain on whatever is drawn so far: overlay at 8%, tile offset re-picked every frame.
// Worked on a copy and masked back to the content's alpha, so transparent areas stay
// transparent for the GL background underneath.
export function grain(ctx, t) {
  const f = Math.round(t * FPS), l = layer(2, ctx);
  l.setTransform(1, 0, 0, 1, 0, 0);
  l.drawImage(ctx.canvas, 0, 0);
  l.globalCompositeOperation = 'overlay';
  l.globalAlpha = 0.08;
  l.fillStyle = l.createPattern(tile, 'repeat');
  l.translate(-hash(f, 31) * 512, -hash(f, 32) * 512);
  l.fillRect(0, 0, W + 512, H + 512);
  l.setTransform(1, 0, 0, 1, 0, 0);
  l.globalCompositeOperation = 'destination-in';
  l.globalAlpha = 1;
  l.drawImage(ctx.canvas, 0, 0);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalCompositeOperation = 'copy';
  ctx.drawImage(l.canvas, 0, 0);
  ctx.restore();
}

// Strokes pts ([[x, y], ...]) with hand-drawn boil: vertices jitter by up to amp and the width
// by ±15%, re-picked fps times a second. The jitter is hashed at every third vertex and eased
// in between, so the line wobbles as one stroke instead of chipping at dense corners.
// Uses the current strokeStyle.
export function boilPath(ctx, pts, t, { amp = 1.5, fps = 8, seed = 0, width = stroke.outline, closed = false } = {}) {
  const k = seed + Math.floor(t * fps), STEP = 3, knots = Math.ceil(pts.length / STEP);
  const knot = (j, axis) => hash(2 * (closed ? j % knots : j) + axis, k) * 2 - 1;
  const jitter = (i, axis) => {
    const u = i / STEP, j = Math.floor(u), f = u - j, e = f * f * (3 - 2 * f);
    return amp * (knot(j, axis) + (knot(j + 1, axis) - knot(j, axis)) * e);
  };
  ctx.beginPath();
  pts.forEach(([x, y], i) => {
    const jx = jitter(i, 0), jy = jitter(i, 1);
    if (i) ctx.lineTo(x + jx, y + jy); else ctx.moveTo(x + jx, y + jy);
  });
  if (closed) ctx.closePath();
  ctx.lineWidth = width * (1 + 0.3 * (hash(-1, k) - 0.5));
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.stroke();
}

// Soft ellipse under an object of width w standing at (x, y).
export function contactShadow(ctx, x, y, w) {
  ctx.save();
  ctx.filter = `blur(${w * 0.04}px)`;
  ctx.globalAlpha = shadowAlpha;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(x, y, w / 2, w * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Rim light from behind on the right edge: the shape, minus itself shifted left by d, leaves a
// sliver. Only the side edge, so it never reads as a bevel along the bottom.
// shape(c) adds the outline as a path on c; d is in local units.
export function rimLight(ctx, shape, d = stroke.detail, color = colors.ink) {
  const l = layer(2, ctx);
  l.fillStyle = color;
  shape(l);
  l.fill();
  l.globalCompositeOperation = 'destination-out';
  l.translate(-d, 0);
  shape(l);
  l.fill();
  blit(ctx, l, LIGHT.rim);
}

// Cumulative lengths of a polyline, cached per points array. Call at load for every path.
const lengths = new WeakMap();
export function measure(pts) {
  let c = lengths.get(pts);
  if (!c) {
    c = [0];
    for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    lengths.set(pts, c);
  }
  return c;
}

// Point at distance d along the polyline.
export function pointAt(pts, d) {
  const c = measure(pts);
  let i = 1;
  while (i < c.length - 1 && c[i] < d) i++;
  const u = clamp01((d - c[i - 1]) / (c[i] - c[i - 1] || 1));
  return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u];
}

// Reveals the first fraction p of the polyline with a dash offset. Uses the current stroke style.
export function drawOn(ctx, pts, p) {
  if (p <= 0) return;
  const L = measure(pts).at(-1);
  ctx.save();
  ctx.setLineDash([L, L]);
  ctx.lineDashOffset = L * (1 - clamp01(p));
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
  ctx.restore();
}

// A bright head at fraction p along pts with an 8-dot additive tail behind it.
export function pulseAlong(ctx, pts, p, { color = colors.accent, r = 7, gap = 12 } = {}) {
  const L = measure(pts).at(-1), head = p * L;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = color;
  for (let i = 8; i >= 1; i--) {
    const d = head - i * gap;
    if (d < 0 || d > L) continue;
    const [x, y] = pointAt(pts, d);
    ctx.globalAlpha = 0.5 * (1 - i / 9);
    ctx.beginPath();
    ctx.arc(x, y, r * (1 - i / 12), 0, Math.PI * 2);
    ctx.fill();
  }
  if (head >= 0 && head <= L) {
    const [x, y] = pointAt(pts, head);
    ctx.globalAlpha = 0.35;
    ctx.filter = `blur(${r}px)`;
    ctx.beginPath();
    ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.filter = 'none';
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = colors.ink;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
