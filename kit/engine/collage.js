// Collage pieces for the Mixed Media look: flat fields, paper cutouts (white border, one drop
// shadow), halftone dots, torn edges, tape strips, hand-drawn marker loops and underlines, and the
// decorative QR tile that runs through the video. Shapes are closed polylines in local px about
// (0, 0); every jitter comes from hash(i, seed), so a shape is the same on every frame and at any t.
import { hash } from './rng.js';
import { layer } from './layer.js';
import { drawOn } from './draw.js';
import { W, H, colors, collage, stroke, radius } from '../tokens.js';

// A flat colour field covering the frame under any camera push or pan (drawn 3× oversize).
export function field(ctx, color) {
  ctx.fillStyle = color;
  ctx.fillRect(-W, -H, 3 * W, 3 * H);
}

// Adds a closed polyline to ctx as a path.
export function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

// A w × h rectangle centred on (0, 0) with corner radius r, as a polyline (6 points per corner).
export function rect(w, h, r = radius) {
  const pts = [], k = 6;
  const corner = (cx, cy, a0) => {
    for (let j = 0; j <= k; j++) {
      const a = a0 + (j / k) * (Math.PI / 2);
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  };
  corner(w / 2 - r, -h / 2 + r, -Math.PI / 2);
  corner(w / 2 - r, h / 2 - r, 0);
  corner(-w / 2 + r, h / 2 - r, Math.PI / 2);
  corner(-w / 2 + r, -h / 2 + r, Math.PI);
  return pts;
}

// A w × h rectangle with torn paper edges: points every `step` px, each pushed in or out by up
// to amp px along the edge normal.
export function tornRect(w, h, { seed = 0, amp = 4, step = 14 } = {}) {
  const pts = [];
  const edge = (x0, y0, x1, y1, nx, ny, k0) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / step));
    for (let j = 0; j < n; j++) {
      const u = j / n, d = (hash(k0 + j, seed) * 2 - 1) * amp;
      pts.push([x0 + (x1 - x0) * u + nx * d, y0 + (y1 - y0) * u + ny * d]);
    }
  };
  edge(-w / 2, -h / 2, w / 2, -h / 2, 0, -1, 0);
  edge(w / 2, -h / 2, w / 2, h / 2, 1, 0, 1000);
  edge(w / 2, h / 2, -w / 2, h / 2, 0, 1, 2000);
  edge(-w / 2, h / 2, -w / 2, -h / 2, -1, 0, 3000);
  return pts;
}

// A paper cutout of shape pts at (x, y), scale s, rotation r (radians): a single drop shadow
// under a white paper border `border` px wide, then the fill, then paint(ctx) clipped to the shape
// in the same local px (halftone, a QR tile, a drawing). alpha fades the whole piece.
// Uses scratch layer 2 for the border, so don't call it from inside another layer-2 user.
export function cutout(ctx, pts, { x = 0, y = 0, s = 1, r = 0, fill = colors.paper, border = collage.border, shadow = collage.shadow, alpha = 1, paint = null } = {}) {
  if (alpha <= 0) return;
  const place = (c) => {
    c.translate(x, y);
    c.rotate(r);
    c.scale(s, s);
  };
  // Border and shadow: the bordered silhouette drawn once on a layer, then composited with the
  // shadow, so the shadow is one shape (a fill plus a stroke would double it where they overlap).
  if (border > 0 || shadow) {
    const l = layer(2, ctx);
    place(l);
    l.fillStyle = colors.white;
    l.strokeStyle = colors.white;
    l.lineWidth = 2 * border;
    l.lineJoin = 'round';
    poly(l, pts);
    l.fill();
    if (border > 0) l.stroke();
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha *= alpha;
    if (shadow) {
      // shadow* ignore the transform, so scale them by device px per local px (SS × camera × s):
      // a smaller piece sits closer to the paper and casts a smaller shadow.
      const m = l.getTransform(), k = Math.hypot(m.a, m.b);
      ctx.shadowColor = `rgba(0, 0, 0, ${shadow.alpha})`;
      ctx.shadowBlur = shadow.blur * k;
      ctx.shadowOffsetX = shadow.x * k;
      ctx.shadowOffsetY = shadow.y * k;
    }
    ctx.drawImage(l.canvas, 0, 0);
    ctx.restore();
  }
  ctx.save();
  ctx.globalAlpha *= alpha;
  place(ctx);
  poly(ctx, pts);
  ctx.fillStyle = fill;
  ctx.fill();
  if (paint) {
    ctx.clip();
    paint(ctx);
  }
  ctx.restore();
}

// Halftone dots over the box [x0, y0, x1, y1] (current coordinates; clip first to keep them in a
// shape). Dots sit on a lattice of `cell` px turned by `angle`; their radius runs from `from` to
// `to` (fractions of half a cell) along the unit direction dir, across the box.
export function halftone(ctx, [x0, y0, x1, y1], { color = colors.ink, cell = collage.halftone.cell, angle = collage.halftone.angle, from = 0.15, to = 0.9, dir = [0, 1] } = {}) {
  const c = Math.cos(angle), s = Math.sin(angle), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const R = Math.hypot(x1 - x0, y1 - y0) / 2, n = Math.ceil(R / cell);
  const span = Math.abs(dir[0]) * (x1 - x0) + Math.abs(dir[1]) * (y1 - y0) || 1;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = -n; i <= n; i++) {
    for (let j = -n; j <= n; j++) {
      const px = cx + (i * c - j * s) * cell, py = cy + (i * s + j * c) * cell;
      if (px < x0 - cell || px > x1 + cell || py < y0 - cell || py > y1 + cell) continue;
      const u = Math.min(1, Math.max(0, ((px - x0) * Math.abs(dir[0]) + (py - y0) * Math.abs(dir[1])) / span));
      const k = dir[0] + dir[1] < 0 ? 1 - u : u, rad = (cell / 2) * (from + (to - from) * k);
      if (rad < 0.3) continue;
      ctx.moveTo(px + rad, py);
      ctx.arc(px, py, rad, 0, Math.PI * 2);
    }
  }
  ctx.fill();
}

// A strip of tape centred at (x, y), turned r radians, with zigzag torn ends.
export function tape(ctx, x, y, r = 0, { w = collage.tape.w, h = collage.tape.h, color = collage.tape.color, seed = 0, alpha = 1 } = {}) {
  if (alpha <= 0) return;
  const teeth = 5, pts = [];
  for (let j = 0; j <= teeth; j++) pts.push([w / 2 + (j % 2 ? 4 : -2) + hash(j, seed) * 3, -h / 2 + (h * j) / teeth]);
  for (let j = teeth; j >= 0; j--) pts.push([-w / 2 - (j % 2 ? 4 : -2) - hash(j + 9, seed) * 3, -h / 2 + (h * j) / teeth]);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(x, y);
  ctx.rotate(r);
  poly(ctx, pts);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

// A hand-drawn marker loop around (cx, cy): 1.1 turns of a slightly uneven ellipse rx × ry,
// starting at angle `start`. Returns points for marker() / drawOn().
export function loop(cx, cy, rx, ry, { seed = 0, turns = 1.1, start = -2.4, n = 64 } = {}) {
  return Array.from({ length: n + 1 }, (_, k) => {
    const a = start + (k / n) * Math.PI * 2 * turns;
    const r = 1 + 0.05 * (hash(k >> 3, seed) - 0.5) + 0.04 * (k / n);
    return [cx + rx * r * Math.cos(a), cy + ry * r * Math.sin(a)];
  });
}

// A hand-drawn underline from x0 to x1 at y: a gentle wave that drifts down 6 px to its end.
export function underline(x0, x1, y, { seed = 0, n = 24 } = {}) {
  return Array.from({ length: n + 1 }, (_, k) => [x0 + ((x1 - x0) * k) / n, y + 4 * Math.sin(k * 0.9 + seed) + (k / n) * 6]);
}

// Strokes the first fraction p of a marker path (loop or underline) in the accent colour.
export function marker(ctx, pts, p, { color = colors.accent, width = stroke.annotate } = {}) {
  if (p <= 0) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  drawOn(ctx, pts, p);
  ctx.restore();
}

// The decorative QR tile: a 21 × 21 module grid with the three finder squares, its other modules
// hashed from seed, centred at (x, y), `size` px wide including a one-module quiet zone. Not a
// scannable code. reveal (0..1) fills modules in hashed order, for builds.
const QR = 21;
const finder = (i, j) => [[0, 0], [QR - 7, 0], [0, QR - 7]].find(([a, b]) => i >= a && i < a + 7 && j >= b && j < b + 7);
export function qrTile(ctx, x, y, size, { seed = 0, fg = colors.ink, bg = colors.white, reveal = 1 } = {}) {
  const m = size / (QR + 2), x0 = x - size / 2 + m, y0 = y - size / 2 + m;
  ctx.fillStyle = bg;
  ctx.fillRect(x - size / 2, y - size / 2, size, size);
  ctx.fillStyle = fg;
  ctx.beginPath();
  for (let i = 0; i < QR; i++) {
    for (let j = 0; j < QR; j++) {
      const f = finder(i, j);
      let on;
      if (f) {
        const u = Math.max(Math.abs(i - f[0] - 3), Math.abs(j - f[1] - 3));
        on = u !== 2; // ring, gap, 3 × 3 centre
      } else on = hash(i * QR + j, seed) < 0.5 && !(i < 8 && j < 8) && !(i > QR - 9 && j < 8) && !(i < 8 && j > QR - 9);
      if (on && (f || hash(i * QR + j, seed + 7) < reveal)) ctx.rect(x0 + i * m, y0 + j * m, m + 0.4, m + 0.4);
    }
  }
  ctx.fill();
}
