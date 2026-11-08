// Painting toolkit for "The Psychology of a Fearless Man" (p5.js 2 + p5.brush 3, WEBGL).
// Old-master look: dark umber ground, soft tonal washes, irregular cloud masses lit on one edge,
// broad low-contrast "bristle" strokes, figures as back-lit silhouettes with a warm rim.
// Each scene file calls paint(seed, fn). Add #quick to the page URL for a half-size test render.

const W = 1920, H = 1080;
const QUICK = location.hash === '#quick';

function rr(a, b) { return random(a, b); }
function pick(a) { return random(a); }
function mixc(c1, c2, t) { return lerpColor(color(c1), color(c2), t).toString('#rrggbb'); }

function setupBrushes() {
  brush.scaleBrushes(QUICK ? 1.1 : 2.2);
  // flat bristle brush: a short bar of uneven bristles, low opacity so strokes build up like glazes
  brush.add('oil', {
    type: 'custom', weight: 12, scatter: 0.8, opacity: 42, spacing: 0.3, rotate: 'natural', markerTip: false, noise: 0.6,
    pressure: [1.15, 0.6],
    tip: (_m) => { _m.noStroke(); _m.fill(0); for (let i = -42; i <= 42; i += 6) _m.rect(i, -14 + random(-8, 8), 4, 28 + random(-10, 10)); },
  });
  // broad soft paint stroke (the main brush) and a dry-brush texture stroke
  brush.add('flat', { type: 'marker', weight: 14, scatter: 0.5, opacity: 9, spacing: 0.2, pressure: [1, 0.7], markerTip: false, noise: 0.5 });
  brush.add('dry', { type: 'spray', weight: 10, scatter: 3, opacity: 40, spacing: 0.4, grain: 25, pressure: [1, 0.6] });
  // thick, more opaque dab for highlights (foam, lit edges, rim light)
  brush.add('impasto', {
    type: 'custom', weight: 7, scatter: 0.4, opacity: 120, spacing: 0.3, rotate: 'natural', markerTip: false, noise: 0.5,
    pressure: [1, 0.5],
    tip: (_m) => { _m.noStroke(); _m.fill(0); _m.ellipse(0, 0, 90, 44); },
  });
}

// ---------- tone & light ----------
function washRect(x, y, w, h, c, op, tex = 0.35) { brush.noStroke(); brush.fill(c, op); brush.fillBleed(0.12); brush.fillTexture(tex, 0.12, false); brush.rect(x, y, w, h); brush.noFill(); }
function gradient(y0, y1, stops, bands = 12) {
  const bh = (y1 - y0) / bands;
  for (let i = 0; i < bands; i++) {
    const t = i / (bands - 1), seg = t * (stops.length - 1), k = Math.min(stops.length - 2, Math.floor(seg));
    washRect(-80, y0 + bh * i - bh * 0.6, W + 160, bh * 2.2, mixc(stops[k], stops[k + 1], seg - k), 80);
  }
}
// irregular noise-edged blob (clouds, foliage, light pools)
function blobPts(x, y, rx, ry, rough = 0.35, n = 22) {
  const o = rr(0, 100), pts = [];
  for (let i = 0; i < n; i++) { const a = TWO_PI * i / n, k = 1 - rough / 2 + rough * noise(o + Math.cos(a) * 1.3, o + Math.sin(a) * 1.3); pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]); }
  return pts;
}
function blob(x, y, rx, ry, c, op = 90, rough = 0.35, bleed = 0.3, tex = 0.45) { brush.noStroke(); brush.fill(c, op); brush.fillBleed(bleed); brush.fillTexture(tex, 0.2); brush.polygon(blobPts(x, y, rx, ry, rough)); brush.noFill(); }
// Native p5 light: many faint ellipses build a smooth, ring-free glow (drawn immediately, under later brush layers)
function glow(x, y, r, c, strength = 0.5, squash = 0.8) {
  const col = color(c); noStroke();
  for (let i = 60; i >= 1; i--) { const t = i / 60; fill(red(col), green(col), blue(col), 255 * strength * 0.035 * (1 - t * 0.6)); ellipse(x, y, 2 * r * t, 2 * r * t * squash, 48); }
}
// Native smooth vertical gradient
function ngrad(y0, y1, stops, x0 = -40, x1 = W + 40) {
  noStroke();
  for (let i = 0; i < stops.length - 1; i++) {
    const ya = y0 + (y1 - y0) * i / (stops.length - 1), yb = y0 + (y1 - y0) * (i + 1) / (stops.length - 1);
    beginShape(TRIANGLE_STRIP); fill(stops[i]); vertex(x0, ya); vertex(x1, ya); fill(stops[i + 1]); vertex(x0, yb); vertex(x1, yb); endShape();
  }
}
// Native haze band (mist over a horizon)
function haze(y, h, c, a = 90) { const col = color(c); noStroke(); for (let i = 0; i < 30; i++) { const t = i / 30; fill(red(col), green(col), blue(col), a * 0.06 * Math.sin(Math.PI * t)); rect(-40, y - h / 2 + h * t - h / 30, W + 80, h / 15); } }
function vignette(c = '#0e0a06', a = 0.75) { const col = color(c); noStroke(); for (let i = 0; i < 40; i++) { const t = i / 40, al = 255 * a * 0.05 * (1 - t); fill(red(col), green(col), blue(col), al); const m = t * 260; rect(-40, -40, W + 80, 40 + m * 0.6); rect(-40, H - m * 0.6, W + 80, 40 + m * 0.6); rect(-40, -40, 40 + m, H + 80); rect(W - m, -40, 40 + m, H + 80); } }
function vignetteWash(c = '#120d08') {
  for (const [x, y, w, h] of [[-60, -60, 300, H + 120], [W - 240, -60, 300, H + 120], [-60, -60, W + 120, 150], [-60, H - 150, W + 120, 210]]) washRect(x, y, w, h, c, 55, 0.3);
}

// ---------- strokes ----------
// Broad, low-contrast strokes inside a region. region(x,y)->bool, palette: array or (x,y)->colour.
function strokes(n, region, palette, opts = {}) {
  const { len = [60, 150], w = [1.2, 2.3], name = 'flat', angle = () => rr(-12, 12), box = [0, 0, W, H], curve = 0.25 } = opts;
  let placed = 0, tries = 0;
  while (placed < n && tries < n * 30) {
    tries++;
    const x = rr(box[0], box[2]), y = rr(box[1], box[3]);
    if (!region(x, y)) continue;
    brush.set(name, typeof palette === 'function' ? palette(x, y) : pick(palette), rr(w[0], w[1]));
    const a = radians(angle(x, y)), L = rr(len[0], len[1]), b = a + rr(-curve, curve);
    brush.spline([[x, y], [x + Math.cos(a) * L * 0.5, y + Math.sin(a) * L * 0.5], [x + Math.cos(b) * L, y + Math.sin(b) * L]], 0.5);
    placed++;
  }
}
const inBox = (b) => (x, y) => x > b[0] && x < b[2] && y > b[1] && y < b[3];

// ---------- sky ----------
function sky(stops, y1 = 680) { gradient(-60, y1, stops); }
// A cloud mass: shadowed body, lit crown toward the light, then curling strokes
function cloud(x, y, w, h, dark, light, lightDir = [-1, -1], n = 9) {
  glow(x + lightDir[0] * w * 0.1, y + lightDir[1] * h * 0.3, w * 0.35, light, 0.25, 0.35);
  for (let i = 0; i < n; i++) blob(x + rr(-w / 2, w / 2) * 0.8, y + rr(-h / 3, h / 3), rr(w * 0.12, w * 0.26), rr(h * 0.3, h * 0.5), dark, 70, 0.5, 0.35, 0.5);
  for (let i = 0; i < n * 0.7; i++) blob(x + rr(-w / 2, w / 2) * 0.7 + lightDir[0] * w * 0.05, y + lightDir[1] * h * 0.28 + rr(-h / 6, h / 6), rr(w * 0.06, w * 0.15), rr(h * 0.15, h * 0.3), light, 60, 0.55, 0.35, 0.45);
}
function birds(n, box, c = '#efe6d2') {
  for (let i = 0; i < n; i++) { const x = rr(box[0], box[2]), y = rr(box[1], box[3]), s = rr(5, 10); brush.set('HB', c, 0.9); brush.spline([[x - s, y - s * 0.4], [x - s * 0.4, y - s * 0.1], [x, y]], 0.6); brush.spline([[x, y], [x + s * 0.4, y - s * 0.2], [x + s, y - s * 0.5]], 0.6); }
}

// ---------- water and land ----------
function sea(yH, deep, mid, light) {
  gradient(yH, H + 60, [mid, deep, deep], 7);
  // swells: elongated washes, larger toward the viewer
  for (let i = 0; i < 70; i++) { const y = rr(yH + 10, H + 20), k = (y - yH) / (H - yH); blob(rr(-100, W + 100), y, rr(90, 300) * (0.5 + k), rr(6, 22) * (0.4 + k), mixc(mid, deep, rr(0, 1)), 80, 0.4, 0.25, 0.4); }
  // crests: thin lit washes
  for (let i = 0; i < 55; i++) { const y = rr(yH + 14, H), k = (y - yH) / (H - yH); blob(rr(0, W), y, rr(40, 150) * (0.5 + k), rr(2.5, 6) * (0.5 + k), mixc(light, mid, rr(0.15, 0.55)), 120, 0.5, 0.15, 0.3); }
}
function foam(x, y, w, h, c, n = 18) {
  for (let i = 0; i < n; i++) blob(x + rr(-w / 2, w / 2), y + rr(-h / 2, h / 2), rr(w * 0.06, w * 0.18), rr(h * 0.08, h * 0.22), mixc(c, '#9aa59d', rr(0, 0.45)), 120, 0.7, 0.35, 0.3);
  glow(x, y, w * 0.4, c, 0.18, h / w);
}
function poly(pts, c, op = 220, tex = 0.55, bleed = 0.08) { brush.noStroke(); brush.fill(c, op); brush.fillBleed(bleed); brush.fillTexture(tex, 0.3); brush.polygon(pts); brush.noFill(); }
function inPoly(x, y, pts) { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; }
function bbox(pts) { const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
function rock(pts, dark, light, n = 160, lightFrom = -1) {
  poly(pts, dark, 240);
  const b = bbox(pts), cx = (b[0] + b[2]) / 2, bw = b[2] - b[0], bh = b[3] - b[1];
  // lit facets toward the light, cool shadows away from it
  for (let i = 0; i < 22; i++) { let px, py, t = 0; do { px = cx + lightFrom * rr(0, bw * 0.5); py = rr(b[1], b[3]); t++; } while (!inPoly(px, py, pts) && t < 40); blob(px, py, rr(bw * 0.02, bw * 0.07), rr(bh * 0.03, bh * 0.08), mixc(light, dark, rr(0.35, 0.7)), 80, 0.9, 0.3, 0.7); }
  for (let i = 0; i < 8; i++) { let px, py, t = 0; do { px = cx - lightFrom * rr(0, bw * 0.5); py = rr(b[1], b[3]); t++; } while (!inPoly(px, py, pts) && t < 40); blob(px, py, rr(bw * 0.05, bw * 0.12), rr(bh * 0.05, bh * 0.1), mixc(dark, '#000000', 0.3), 90, 0.6, 0.15, 0.6); }
}
function land(pts, dark, light, n = 400, ang = [-8, 8]) {
  poly(pts, dark, 235); const b = bbox(pts);
  for (let i = 0; i < Math.round(n / 10); i++) { let px, py, t = 0; do { px = rr(b[0], b[2]); py = rr(b[1], b[3]); t++; } while (!inPoly(px, py, pts) && t < 40); blob(px, py, rr(60, 220), rr(8, 26), mixc(dark, light, rr(0, 0.4)), 80, 0.5, 0.25, 0.5); }
}

// ---------- trees ----------
function tree(x, yBase, h, trunk, leafDark, leafLight, kind = 'oak', lightDir = -1) {
  poly([[x - h * 0.03, yBase], [x - h * 0.014, yBase - h * 0.62], [x + h * 0.012, yBase - h * 0.62], [x + h * 0.035, yBase]], trunk, 240);
  const n = kind === 'pine' ? 9 : 12;
  for (let i = 0; i < n; i++) {
    const t = i / n, cy = yBase - h * (0.38 + 0.6 * t), sp = kind === 'pine' ? h * 0.2 * (1 - t * 0.75) : h * 0.26 * (1 - Math.abs(t - 0.5));
    const cx = x + rr(-sp, sp);
    blob(cx, cy, rr(h * 0.08, h * 0.15), rr(h * 0.05, h * 0.09), leafDark, 140, 0.6, 0.3, 0.6);
    blob(cx + lightDir * h * 0.03, cy - h * 0.025, rr(h * 0.04, h * 0.08), rr(h * 0.03, h * 0.05), leafLight, 90, 0.6, 0.3, 0.6);
  }
}

// ---------- figures ----------
// Back-lit robed figure. (x, y) = feet, h = height. pose: stand | stride | sit | kneel | lean | point
function figure(x, y, h, o = {}) {
  const { robe = '#1d1610', cloak = null, skin = '#b88a60', rim = '#efcf92', side = 1, pose = 'stand', staff = false } = o;
  const u = h / 7.5, s = side;
  let body;
  if (pose === 'sit') body = [[x - 1.2 * u, y], [x - 1.1 * u, y - 2.2 * u], [x - 0.8 * u * s, y - 4.6 * u], [x + 0.6 * u * s, y - 4.8 * u], [x + 1.0 * u * s, y - 2.6 * u], [x + 2.4 * u * s, y - 2.2 * u], [x + 2.6 * u * s, y], [x + 0.6 * u * s, y + 0.15 * u]];
  else if (pose === 'kneel') body = [[x - 1.1 * u, y], [x - 0.9 * u, y - 3.8 * u], [x - 0.5 * u, y - 5.2 * u], [x + 0.7 * u, y - 5.0 * u], [x + 1.1 * u, y - 3 * u], [x + 2.4 * u * s, y - 1.1 * u], [x + 2.5 * u * s, y], [x, y + 0.15 * u]];
  else if (pose === 'lean') body = [[x - 0.7 * u, y], [x - 0.9 * u, y - 3 * u], [x - 0.2 * u * s, y - 6.1 * u], [x + 0.9 * u * s, y - 6.3 * u], [x + 1.3 * u * s, y - 4 * u], [x + 0.9 * u, y - 1.5 * u], [x + 0.8 * u, y]];
  else { const st = pose === 'stride' ? 1.0 : 0.38; body = [[x - st * u - 0.25 * u, y], [x - 0.75 * u, y - 3.3 * u], [x - 0.95 * u, y - 5.9 * u], [x - 0.35 * u, y - 6.4 * u], [x + 0.35 * u, y - 6.4 * u], [x + 0.95 * u, y - 5.9 * u], [x + 0.75 * u, y - 3.3 * u], [x + st * u + 0.25 * u, y]]; }
  const b = bbox(body), top = b[1], neckX = (pose === 'lean' || pose === 'sit') ? x + 0.2 * u * s : x;
  if (cloak) poly([[neckX - 0.9 * u * s, top + 0.2 * u], [neckX + 1.0 * u * s, top + 0.25 * u], [neckX + 2.1 * u * s, top + 3.8 * u], [neckX + 1.1 * u * s, top + 5.6 * u], [neckX - 0.4 * u * s, top + 4.2 * u]], cloak, 225, 0.5, 0.15);
  poly(body, robe, 245, 0.4);
  if (pose === 'point') { brush.set('impasto', robe, u * 0.045); brush.line(x + 0.6 * u * s, top + 1.1 * u, x + 3.0 * u * s, top + 0.2 * u); }
  if (staff) { brush.set('oil', '#2a1d12', u * 0.03); brush.line(x + 1.3 * u * s, y, x + 1.6 * u * s, top - 1.2 * u); }
  // head
  blob(neckX, top - 0.42 * u, 0.42 * u, 0.5 * u, skin, 235, 0.15, 0.05, 0.3);
  blob(neckX - 0.12 * u * s, top - 0.62 * u, 0.4 * u, 0.32 * u, '#1a120c', 220, 0.3, 0.05, 0.3);
  // warm light on the lit side: a lighter, narrower copy of the body shifted toward the light
  const lit = body.map(([px, py]) => [x + (px - x) * 0.55 + s * 0.45 * u, py + 0.15 * u]);
  poly(lit, mixc(robe, rim, 0.28), 110, 0.5, 0.25);
  blob(neckX + 0.15 * u * s, top - 0.45 * u, 0.22 * u, 0.32 * u, mixc(skin, rim, 0.4), 140, 0.2, 0.1, 0.3);
}
function crowd(n, x0, x1, y, hMin, hMax, palette, rim = '#e6c78c') {
  for (let i = 0; i < n; i++) figure(rr(x0, x1), y + rr(-6, 6), rr(hMin, hMax), { robe: pick(palette), cloak: random() < 0.4 ? pick(palette) : null, rim, side: pick([-1, 1]), pose: pick(['stand', 'stand', 'lean', 'point']) });
}

// ---------- architecture ----------
function column(x, yTop, yBot, w, c, light) {
  poly([[x - w / 2, yBot], [x - w / 2, yTop], [x + w / 2, yTop], [x + w / 2, yBot]], c, 238, 0.35);
  strokes(Math.round((yBot - yTop) / 9), inBox([x - w / 2, yTop, x + w / 2, yBot]), (px) => (px < x ? mixc(light, c, rr(0, 0.3)) : mixc(c, light, rr(0, 0.2))), { len: [30, 80], w: [1, 2], angle: () => 90 + rr(-3, 3), curve: 0.05, box: [x - w / 2, yTop, x + w / 2, yBot] });
}
function archway(cx, yBase, w, h, wall, light, opening) {
  const r = w / 2, inner = [];
  for (let a = 180; a <= 360; a += 6) inner.push([cx + r * Math.cos(radians(a)), yBase - h + r + r * Math.sin(radians(a))]);
  const open = [[cx - r, yBase], ...inner, [cx + r, yBase]];
  poly(open, opening, 235, 0.3, 0.2);
  brush.set('impasto', light, 1.1); for (let i = 0; i < inner.length - 1; i++) brush.line(inner[i][0], inner[i][1] - 8, inner[i + 1][0], inner[i + 1][1] - 8);
}

// ---------- page ----------
// paint(seed, [layer1, layer2, ...]): each layer runs in its own frame, so native p5 drawing in a later
// layer lands on top of the brush strokes of earlier layers (p5.brush composites at the end of each frame).
let __layers = [], __seed = 1;
function paint(seed, layers) { __seed = seed; __layers = Array.isArray(layers) ? layers : [layers]; }
function setup() {
  createCanvas(QUICK ? W / 2 : W, QUICK ? H / 2 : H, WEBGL); pixelDensity(1); setAttributes('preserveDrawingBuffer', true);
  randomSeed(__seed); noiseSeed(__seed); background('#1e1710'); setupBrushes(); frameRate(4);
}
function draw() {
  const i = frameCount - 1;
  if (i >= __layers.length) { noLoop(); window.DONE = true; return; }
  push(); translate(-width / 2, -height / 2); if (QUICK) scale(0.5);
  randomSeed(__seed * 100 + i); noiseSeed(__seed * 100 + i);
  __layers[i](); pop();
}
