// FROZEN: read-only from phase 7 on. Need something it lacks? Write it in your scene file and report it (NOTES.md).
// Deterministic particles. Nothing is stepped or stored: each particle's state is a closed-form
// function of its index i and the time, with attributes from hash(i, k). The *State functions
// return what the drawers draw, so a test can check alphas without rendering.
// Every drawer takes opts.cam = { dx, dy, z }: a pan in px and a zoom (0.05 = 5%) about the
// centre, both at depth 1. Particles scale them by their own depth, so near ones parallax more.
import { clamp01, lerp, outBack } from './ease.js';
import { hash } from './rng.js';
import { layer } from './layer.js';
import { program, setUniforms, linearRGB } from './gl.js';
import { W, H, SS, colors } from '../tokens.js';

const TAU = Math.PI * 2;
const smooth = (a, b, x) => {
  const u = clamp01((x - a) / (b - a));
  return u * u * (3 - 2 * u);
};
// 0 at birth (u = 0) and death (u = 1), 1 in between.
const envelope = (u, edge = 0.2) => smooth(0, edge, u) * (1 - smooth(1 - edge, 1, u));
// Sparks and confetti fade in over RAMP s: linear, so at 30 fps no frame adds more than 0.19.
const RAMP = 0.18;
// density (0..1) keeps that share of particles: each has a fixed rank, and one ranked above the
// density fades out over a band of 0.25, so a smoothly changing density never pops a particle.
const kept = (i, density = 1) => clamp01((density - hash(i, 977)) / 0.25 + 1);

export function project(cam = {}, x, y, depth = 1) {
  const s = 1 + (cam.z ?? 0) * depth;
  return [W / 2 + (x - W / 2) * s + (cam.dx ?? 0) * depth, H / 2 + (y - H / 2) * s + (cam.dy ?? 0) * depth, s];
}

// 1. Motes: dust rising in depth layers (0 = far). Each loops on its own lifetime and respawns
// somewhere new every cycle, at alpha 0.
const MOTES = { n: 600, layers: 3, color: colors.ink, drift: 6, cam: {}, density: 1, op: 'source-over' };
export function moteState(i, t, opts) {
  const o = { ...MOTES, ...opts };
  const L = i % o.layers, depth = (L + 1) / o.layers;
  const life = lerp(4, 9, hash(i, 1)), tt = t / life + hash(i, 2), c = Math.floor(tt), u = tt - c;
  const age = u * life, k = 100 + 3 * c, speed = lerp(10, 36, depth) * lerp(0.7, 1.3, hash(i, 3));
  return {
    depth, layer: L,
    x: hash(i, k) * W + o.drift * depth * age + 10 * depth * Math.sin(0.5 * t + TAU * hash(i, 4)),
    y: hash(i, k + 1) * (H + speed * life) - speed * age,
    r: lerp(0.8, 2.8, depth) * lerp(0.6, 1.4, hash(i, 5)),
    a: lerp(0.1, 0.45, depth) * lerp(0.5, 1, hash(i, 6)) * envelope(u) * kept(i, o.density),
  };
}

// Painted with o.op ('lighter' adds, for dark fields). The far layer is drawn on its own and blurred as one image.
export function motes(ctx, t, opts = {}) {
  const o = { ...MOTES, ...opts }, far = layer(3, ctx);
  for (const c of [far, ctx]) {
    c.save();
    c.globalCompositeOperation = o.op;
    c.fillStyle = o.color;
  }
  const dot = (c, m) => {
    const [x, y, s] = project(o.cam, m.x, m.y, m.depth);
    c.globalAlpha = m.a;
    c.beginPath();
    c.arc(x, y, m.r * s, 0, TAU);
    c.fill();
  };
  const near = [];
  for (let i = 0; i < o.n; i++) {
    const m = moteState(i, t, o);
    if (m.a > 0.002) (m.layer === 0 ? dot(far, m) : near.push(m));
  }
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.filter = `blur(${2.5 * SS}px)`;
  ctx.drawImage(far.canvas, 0, 0);
  ctx.restore();
  for (const m of near) dot(ctx, m);
  ctx.restore();
  far.restore();
}

// 2. Burst: ballistic sparks. seed separates bursts that share indices.
// op: the blend. 'source-over' paints, which reads on light fields; 'lighter' adds (glows on navy).
const BURST = { n: 220, speed: 620, gravity: 900, colors: [colors.accent, colors.ink], life: [0.8, 1.4], width: 2.4, seed: 0, depth: 1, cam: {}, op: 'source-over' };
export function burstState(i, age, opts) {
  const o = { ...BURST, ...opts }, k = 16 * o.seed;
  const life = lerp(o.life[0], o.life[1], hash(i, k + 1));
  if (age < 0 || age >= life) return null;
  const ang = TAU * hash(i, k + 2), sp = o.speed * Math.sqrt(lerp(0.05, 1, hash(i, k + 3)));
  const vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp;
  return {
    pos: (a) => [o.x + vx * a, o.y + vy * a + 0.5 * o.gravity * a * a],
    a: Math.min(1, age / RAMP) * (1 - age / life) ** 1.5,
    color: o.colors[Math.floor(hash(i, k + 4) * o.colors.length)],
    w: o.width * lerp(0.5, 1.2, hash(i, k + 5)),
  };
}

// Each spark is a streak from where it was 0.03 s ago to where it is: cheap motion blur.
export function burst(ctx, t, opts) {
  const o = { ...BURST, ...opts }, age = t - o.t0;
  if (age < 0) return;
  ctx.save();
  ctx.globalCompositeOperation = o.op;
  ctx.lineCap = 'round';
  for (let i = 0; i < o.n; i++) {
    const p = burstState(i, age, o);
    if (!p) continue;
    const [x0, y0, s] = project(o.cam, ...p.pos(Math.max(0, age - 0.03)), o.depth);
    const [x1, y1] = project(o.cam, ...p.pos(age), o.depth);
    ctx.globalAlpha = p.a;
    ctx.strokeStyle = p.color;
    ctx.lineWidth = p.w * s;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1 + 0.01, y1);
    ctx.stroke();
  }
  ctx.restore();
}

// 3. Confetti: linear drag (terminal velocity gravity / drag) plus flutter, spin and a flip
// on scaleY. Exact solution: x = x0 + v·e, y = y0 + vy·e + g·(age − e) / k, e = (1 − e^(−k·age)) / k.
const CONFETTI = {
  n: 160, colors: [colors.accent, colors.ink, colors.dim], speed: [500, 1100], spread: 2.2, drag: 2.4, gravity: 420,
  life: [2.4, 3.2], size: 14, seed: 0, depth: 1, cam: {},
};
export function confettiState(i, age, opts) {
  const o = { ...CONFETTI, ...opts }, k = 16 * o.seed + 7;
  const life = lerp(o.life[0], o.life[1], hash(i, k + 1));
  if (age < 0 || age >= life) return null;
  const ang = -Math.PI / 2 + (hash(i, k + 2) - 0.5) * o.spread, sp = lerp(o.speed[0], o.speed[1], hash(i, k + 3));
  const e = (1 - Math.exp(-o.drag * age)) / o.drag, w = o.size * lerp(0.6, 1, hash(i, k + 4));
  return {
    x: o.x + Math.cos(ang) * sp * e + 18 * Math.sin(age * lerp(2, 4, hash(i, k + 5)) + TAU * hash(i, k + 6)),
    y: o.y + Math.sin(ang) * sp * e + (o.gravity * (age - e)) / o.drag,
    rot: TAU * hash(i, k + 7) + age * lerp(-6, 6, hash(i, k + 8)),
    flip: Math.cos(age * lerp(6, 14, hash(i, k + 9)) + TAU * hash(i, k + 10)),
    w, h: w * 1.5,
    color: o.colors[Math.floor(hash(i, k + 11) * o.colors.length)],
    a: Math.min(1, age / RAMP) * (1 - smooth(life - 0.5, life, age)),
  };
}

export function confetti(ctx, t, opts) {
  const o = { ...CONFETTI, ...opts }, age = t - o.t0;
  if (age < 0) return;
  for (let i = 0; i < o.n; i++) {
    const p = confettiState(i, age, o);
    if (!p) continue;
    const [x, y, s] = project(o.cam, p.x, p.y, o.depth);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(p.rot);
    ctx.scale(s, s * p.flip);
    ctx.globalAlpha = p.a;
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    // Darker as it turns edge-on.
    ctx.globalAlpha = p.a * 0.45 * (1 - Math.abs(p.flip));
    ctx.fillStyle = '#000';
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }
}

// 5. A tiny burst at each glyph as it locks. glyphs from glyphsOf() and lock times from
// scrambleLocks() in engine/type.js, plus the scramble's start t0 and font size.
export const glyphBursts = (glyphs, locks, { t0 = 0, size = 32, ...opts } = {}) => glyphs
  .filter((g) => g.ch !== ' ')
  .map((g) => ({
    n: 6, speed: 220, gravity: 500, life: [0.35, 0.55], width: 1.6, ...opts,
    t0: t0 + locks[g.i], x: g.x + g.w / 2, y: g.y - size * 0.36, seed: 1000 + g.i,
  }));
export function sparksFromGlyphs(ctx, t, glyphs, lockTimes, opts = {}) {
  for (const b of glyphBursts(glyphs, lockTimes, opts)) burst(ctx, t, b);
}

// 4. GPU point sprites: position, size and alpha computed in the vertex shader from
// gl_VertexID and uTime. Draws additively into whatever framebuffer is bound.
const GL_VERT = `#version 300 es
uniform float uTime, uSize, uAlpha, uDensity;
uniform vec2 uRes;
uniform vec3 uCam; // dx, dy, z
out float vA;
uint pcg(uint v) {
  uint s = v * 747796405u + 2891336453u;
  uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}
float h(uint i, uint k) { return float(pcg(i ^ pcg(k))) / 4294967295.0; }
void main() {
  uint i = uint(gl_VertexID);
  float depth = 0.15 + 0.85 * h(i, 1u);
  float life = mix(4.0, 10.0, h(i, 2u));
  float tt = uTime / life + h(i, 3u), c = floor(tt), u = tt - c;
  uint k = 100u + 3u * uint(c); // new spawn point every cycle, at alpha 0
  float speed = mix(6.0, 30.0, depth);
  vec2 p = vec2(h(i, k), h(i, k + 1u)) * uRes;
  p += vec2(8.0 * sin(0.4 * uTime + 6.2832 * h(i, 4u)), -speed * u * life);
  float s = 1.0 + uCam.z * depth;
  p = 0.5 * uRes + (p - 0.5 * uRes) * s + uCam.xy * depth;
  gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0);
  gl_PointSize = max(1.0, uSize * mix(0.6, 2.2, depth) * s);
  vA = uAlpha * mix(0.15, 1.0, depth) * smoothstep(0.0, 0.2, u) * (1.0 - smoothstep(0.8, 1.0, u));
  vA *= clamp((uDensity - h(i, 977u)) / 0.25 + 1.0, 0.0, 1.0); // as kept() in JS
}`;
const GL_FRAG = `#version 300 es
precision highp float;
in float vA;
out vec4 o;
uniform vec3 uColor;
void main() {
  float d = length(gl_PointCoord - 0.5) * 2.0, a = vA * pow(max(0.0, 1.0 - d), 2.0);
  o = vec4(uColor * a, a);
}`;
const glProgs = new WeakMap(); // compiled once per context
export function glParticles(gl, t, opts = {}) {
  const o = { n: 40000, size: 3, alpha: 0.35, color: colors.ink, cam: {}, density: 1, ...opts };
  if (!glProgs.has(gl)) glProgs.set(gl, program(gl, GL_FRAG, 'glParticles', GL_VERT));
  setUniforms(gl, glProgs.get(gl), {
    uTime: t, uSize: o.size * SS, uAlpha: o.alpha, uDensity: o.density, uRes: [W, H], uColor: linearRGB(o.color),
    uCam: [o.cam.dx ?? 0, o.cam.dy ?? 0, o.cam.z ?? 0],
  });
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.drawArrays(gl.POINTS, 0, o.n);
  gl.disable(gl.BLEND);
}

// 5. Assemble: pieces fly in from scattered starts and land on target points with an overshoot,
// each after its own hashed delay (up to opts.spread s). Pair with targetsFromText for a shape.
// opts: t0 (s), dur (each flight, s), spread (s), dist (start distance, px), turn (start rotation,
// rad), draw(ctx, state, i) (default: a small ink square). All landed by assembleEnd(opts).
const ASSEMBLE = { t0: 0, dur: 0.5, spread: 0.4, dist: 900, turn: 1.2, overshoot: 1.4 };
export const assembleEnd = (opts = {}) => { const o = { ...ASSEMBLE, ...opts }; return o.t0 + o.spread + o.dur; };
export function assembleState(i, t, [tx, ty], opts = {}) {
  const o = { ...ASSEMBLE, ...opts }, start = o.t0 + o.spread * hash(i, 11);
  const u = clamp01((t - start) / o.dur), e = u >= 1 ? 1 : outBack(u, o.overshoot), ang = TAU * hash(i, 12);
  const d = o.dist * lerp(0.6, 1, hash(i, 13));
  return {
    x: lerp(tx + Math.cos(ang) * d, tx, e), y: lerp(ty + Math.sin(ang) * d, ty, e),
    r: lerp((hash(i, 14) * 2 - 1) * o.turn, 0, e), s: lerp(0.6, 1, Math.min(1, e)),
    a: clamp01((t - start) / RAMP), u,
  };
}
export function assemble(ctx, t, targets, opts = {}) {
  const draw = opts.draw ?? ((c, p) => {
    c.save();
    c.translate(p.x, p.y);
    c.rotate(p.r);
    c.globalAlpha = p.a;
    c.fillStyle = colors.ink;
    c.fillRect(-6 * p.s, -6 * p.s, 12 * p.s, 12 * p.s);
    c.restore();
  });
  targets.forEach((tg, i) => {
    const p = assembleState(i, t, tg, opts);
    if (p.a > 0) draw(ctx, p, i);
  });
}

// Target points in the shape of text: drawn once at load time (not inside renderFrame) and
// sampled on a `step` px grid wherever the glyphs are solid. Centred on (x, y).
export function targetsFromText(text, font, { step = 24, x = W / 2, y = H / 2 } = {}) {
  const probe = new OffscreenCanvas(1, 1).getContext('2d');
  probe.font = font;
  const m = probe.measureText(text), w = Math.ceil(m.width) + 2 * step;
  const asc = Math.ceil(m.actualBoundingBoxAscent), h = asc + Math.ceil(m.actualBoundingBoxDescent) + 2 * step;
  const c = new OffscreenCanvas(w, h).getContext('2d', { willReadFrequently: true });
  c.font = font;
  c.fillText(text, step, step + asc);
  const px = c.getImageData(0, 0, w, h).data, out = [];
  for (let j = step / 2; j < h; j += step) {
    for (let i = step / 2; i < w; i += step) {
      if (px[(Math.floor(j) * w + Math.floor(i)) * 4 + 3] > 128) out.push([x - w / 2 + i, y - h / 2 + j]);
    }
  }
  return out;
}
