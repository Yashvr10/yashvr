// Lit, hand-inked props. Each is drawThing(ctx, t, { x, y, s, rot, seed }): (x, y) is the point
// on the ground under the prop, s its scale (1 ≈ 240 px wide), rot radians. t drives the line boil.
// Local units: origin on the ground, y up is negative. Strokes stay at token widths on screen.
import { colors, stroke, radius } from '../tokens.js';
import { shade, litFill, boilPath, contactShadow, rimLight } from './draw.js';

// Outlines are a darker tone of each piece's own fill, never one shared black keyline.
const lineOf = (base) => shade(base, -0.22);

// Rounded-rect outline as points, corners clockwise from top left. Returns the four corner arcs
// so callers can splice extra points (a bubble tail) between them.
function corners(x, y, w, h, r, seg = 5) {
  r = Math.min(r, w / 2, h / 2);
  return [[x + r, y + r, 180], [x + w - r, y + r, 270], [x + w - r, y + h - r, 0], [x + r, y + h - r, 90]]
    .map(([cx, cy, a0]) => Array.from({ length: seg + 1 }, (_, i) => {
      const a = ((a0 + (90 * i) / seg) * Math.PI) / 180;
      return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    }));
}
const rr = (x, y, w, h, r = radius) => corners(x, y, w, h, r).flat();

function poly(ctx, pts) {
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
}

// One solid piece: lit fill, optional rim light, boiled tonal outline. k varies the boil per piece.
function piece(ctx, t, p, k, pts, base, { rim = true, outline = true } = {}) {
  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys);
  ctx.fillStyle = litFill(ctx, x0, y0, Math.max(...xs) - x0, Math.max(...ys) - y0, base);
  poly(ctx, pts);
  ctx.fill();
  if (outline) {
    ctx.strokeStyle = lineOf(base);
    boilPath(ctx, pts, t, { amp: 1.5 / p.s, width: stroke.outline / p.s, seed: p.seed * 97 + k, closed: true });
  }
  // After the outline and as wide as it, so the rim lights the silhouette edge itself.
  if (rim) rimLight(ctx, (c) => poly(c, pts), stroke.outline / p.s);
}

// A detail line (UI rows, axes), boiled like the outlines.
function detail(ctx, t, p, k, pts, color) {
  ctx.strokeStyle = color;
  boilPath(ctx, pts, t, { amp: 1 / p.s, width: stroke.detail / p.s, seed: p.seed * 97 + k });
}

function place(ctx, opts, footprint, draw) {
  const p = { x: 0, y: 0, s: 1, rot: 0, seed: 0, ...opts };
  contactShadow(ctx, p.x, p.y, footprint * p.s);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rot);
  ctx.scale(p.s, p.s);
  draw(p);
  ctx.restore();
}

const body = shade(colors.dim, -0.3), deck = shade(colors.dim, -0.15);

export function drawLaptop(ctx, t, opts) {
  place(ctx, opts, 260, (p) => {
    piece(ctx, t, p, 1, rr(-100, -168, 200, 144), body);
    piece(ctx, t, p, 2, rr(-88, -156, 176, 120, radius / 2), colors.bg, { rim: false, outline: false });
    detail(ctx, t, p, 3, [[-70, -132], [40, -132]], colors.dim);
    detail(ctx, t, p, 4, [[-70, -112], [6, -112]], colors.dim);
    detail(ctx, t, p, 5, [[-70, -92], [56, -92]], colors.dim);
    detail(ctx, t, p, 6, [[-70, -64], [-20, -64]], colors.accent);
    piece(ctx, t, p, 7, [[-114, -24], [114, -24], [126, -9], [-126, -9]], deck, { rim: false });
    piece(ctx, t, p, 8, rr(-126, -10, 252, 10, radius / 4), body);
    detail(ctx, t, p, 9, [[-26, -15], [26, -15]], body);
  });
}

export function drawChatBubble(ctx, t, opts) {
  place(ctx, opts, 200, (p) => {
    const [tl, tr, br, bl] = corners(-110, -170, 220, 124, radius);
    piece(ctx, t, p, 1, [...tl, ...tr, ...br, [-20, -46], [-58, -12], [-52, -46], ...bl], colors.accent);
    const ink = shade(colors.accent, -0.3);
    detail(ctx, t, p, 2, [[-76, -128], [64, -128]], ink);
    detail(ctx, t, p, 3, [[-76, -96], [12, -96]], ink);
  });
}

// opts.grow (0..1) raises the bars.
export function drawChartCard(ctx, t, opts) {
  const grow = opts.grow ?? 1;
  place(ctx, opts, 220, (p) => {
    piece(ctx, t, p, 1, rr(-100, -190, 200, 190), body);
    detail(ctx, t, p, 2, [[-76, -164], [-12, -164]], colors.dim);
    [56, 88, 70, 122].forEach((h, i) => {
      const bh = Math.max(1, h * grow);
      piece(ctx, t, p, 3 + i, rr(-72 + i * 38, -26 - bh, 28, bh, radius / 2), i === 3 ? colors.accent : deck, { outline: false });
    });
    detail(ctx, t, p, 9, [[-80, -26], [80, -26]], colors.dim);
  });
}

export function drawFolder(ctx, t, opts) {
  place(ctx, opts, 250, (p) => {
    const back = shade(colors.dim, -0.25);
    piece(ctx, t, p, 1, rr(-110, -168, 90, 40), back, { rim: false });
    piece(ctx, t, p, 2, rr(-110, -150, 220, 150), back, { rim: false });
    piece(ctx, t, p, 3, rr(-92, -176, 176, 120, radius / 2), colors.ink, { rim: false });
    piece(ctx, t, p, 4, rr(-118, -118, 236, 118), deck);
  });
}
