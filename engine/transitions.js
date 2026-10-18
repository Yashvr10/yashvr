// Transitions between two scenes. Each is fn(ctx, t, drawA, drawB, t0, dur, opts): t is global
// time, the window is [t0, t0 + dur], and drawA(c) / drawB(c) draw each scene at its own local
// time for this t. fn.dur is the default length; fn.anchor is where the cut sits in the window
// (0.5 = middle, 0 = the window starts on the cut). Transitions draw at layout identity (unit()); scenes apply
// their own cameras. A transition may set POST values (ca, radial) for its frames.
import { win, lerp, inOutQuint } from './ease.js';
import { hash } from './rng.js';
import { layer, unit } from './layer.js';
import { L } from './layout.js';
import { W, H, SS, FPS, colors, stroke } from '../tokens.js';

// Draws a scene into scratch layer k at identity and returns that layer.
function render(k, ctx, draw) {
  const l = layer(k, ctx);
  unit(l);
  draw(l);
  return l;
}
function put(ctx, src, { x = 0, y = 0, s = 1, alpha = 1, op = 'source-over' } = {}) {
  ctx.save();
  unit(ctx);
  ctx.globalAlpha = alpha;
  ctx.globalCompositeOperation = op;
  ctx.translate(W / 2 + x, H / 2 + y);
  ctx.scale(s, s);
  ctx.drawImage(src.canvas, -W / 2, -H / 2, W, H);
  ctx.restore();
}
const post = () => globalThis.POST;

// Motion blur along x (or y, when vertical) over `spread` px of travel (the distance the content
// moved since the previous frame, sampled backwards along it). An 8-tap box run twice, so 64
// samples in all and no visible ghost copies even at whip speeds. tmp1 and tmp2 are scratch
// layers other than src's.
function smear(ctx, src, spread, tmp1, tmp2, vertical = false) {
  if (Math.abs(spread) < 0.5) return put(ctx, src);
  const taps = (dst, from, span) => {
    for (let k = 0; k < 8; k++) put(dst, from, { [vertical ? 'y' : 'x']: (span * k) / 7, alpha: 1 / 8, op: 'lighter' });
  };
  const mid = layer(tmp1, ctx);
  unit(mid);
  taps(mid, src, spread / 8);
  const out = layer(tmp2, ctx);
  unit(out);
  taps(out, mid, (spread * 7) / 8);
  put(ctx, out);
}

// A slides out left as B slides in from the right, inOutQuint, motion-blurred along x. In a
// stacked (9:16) layout it whips vertically: A slides out the top as B comes up from below.
export function whip(ctx, t, drawA, drawB, t0, dur = whip.dur) {
  const v = L.stack, span = v ? H : W, axis = v ? 'y' : 'x';
  const travel = (tt) => span * inOutQuint(win(tt, t0, t0 + dur));
  const d = travel(t), moved = d - travel(t - 1 / FPS);
  const a = render(4, ctx, drawA), b = render(5, ctx, drawB);
  const frame = layer(6, ctx);
  unit(frame);
  put(frame, a, { [axis]: -d });
  put(frame, b, { [axis]: span - d });
  // Content moves left (up) by `moved`, so its trail lies to the right (below). A's layer is free again.
  smear(ctx, frame, moved, 7, 4, v);
}
whip.dur = 0.2;
whip.anchor = 0.5;

// A zooms 1 → 3 and fades out while B zooms 0.6 → 1 and fades in; they cross in the middle
// third so they are never both near full opacity. With the GL post chain present it also
// sets POST.radial from the zoom speed; otherwise it fakes the radial blur with scaled taps.
export function zoomThrough(ctx, t, drawA, drawB, t0, dur = zoomThrough.dur) {
  const e = (tt) => inOutQuint(win(tt, t0, t0 + dur)), u = win(t, t0, t0 + dur);
  const sA = lerp(1, 3, e(t)), sB = lerp(0.6, 1, e(t));
  const speed = Math.abs(Math.log(sA / lerp(1, 3, e(t - 1 / FPS))));
  const mix = win(u, 1 / 3, 2 / 3);
  const a = render(4, ctx, drawA), b = render(5, ctx, drawB);
  const P = post();
  if (P && 'radial' in P) {
    P.radial = Math.min(0.2, speed * 0.5);
    put(ctx, a, { s: sA, alpha: 1 - mix });
    put(ctx, b, { s: sB, alpha: mix });
  } else {
    for (let k = 0; k < 4; k++) {
      const f = 1 - (speed * 0.5 * k) / 4;
      put(ctx, a, { s: sA * f, alpha: (1 - mix) / 4, op: 'lighter' });
      put(ctx, b, { s: sB * f, alpha: mix / 4, op: 'lighter' });
    }
  }
}
zoomThrough.dur = 0.25;
zoomThrough.anchor = 0.5;

// Four frames of hashed horizontal bands, offset up to ±40 px and seeded by the frame index;
// even bands show A, odd bands B. Pushes chromatic aberration to 6 px meanwhile.
export function glitch(ctx, t, drawA, drawB) {
  const f = Math.round(t * FPS), a = render(4, ctx, drawA), b = render(5, ctx, drawB);
  if (post()) post().ca = 6;
  ctx.save();
  unit(ctx);
  for (let j = 0, y = 0; y < H; j++) {
    const h = Math.round(12 + 70 * hash(j, 31 * f)), dx = Math.round((hash(j, 31 * f + 1) * 2 - 1) * 40);
    ctx.drawImage((j % 2 ? b : a).canvas, 0, y * SS, W * SS, h * SS, dx, y, W, h);
    y += h;
  }
  ctx.restore();
}
glitch.dur = 4 / FPS;
glitch.anchor = 0.5;

// Through a colour: A fades to it over the first half, B fades up from it over the second.
export function dip(ctx, t, drawA, drawB, t0, dur = dip.dur, { color = '#000' } = {}) {
  const u = win(t, t0, t0 + dur);
  (u < 0.5 ? drawA : drawB)(ctx);
  ctx.save();
  unit(ctx);
  ctx.globalAlpha = u < 0.5 ? u * 2 : (1 - u) * 2;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
dip.dur = 0.3;
dip.anchor = 0.5;

// A hard cut bridged by a shape: opts.from (on A, at the cut) and opts.to (on B) are
// { x, y, w, h, r } in screen px, centred. An accent outline morphs from one to the other
// across the window, fading in and out at its ends.
export function matchCut(ctx, t, drawA, drawB, t0, dur = matchCut.dur, { from, to, color = colors.accent } = {}) {
  const u = win(t, t0, t0 + dur), e = inOutQuint(u);
  (u < 0.5 ? drawA : drawB)(ctx);
  const s = Object.fromEntries(['x', 'y', 'w', 'h', 'r'].map((k) => [k, lerp(from[k], to[k], e)]));
  ctx.save();
  unit(ctx);
  ctx.globalAlpha = Math.min(1, u / 0.2, (1 - u) / 0.2);
  ctx.strokeStyle = color;
  ctx.lineWidth = stroke.outline;
  ctx.beginPath();
  ctx.roundRect(s.x - s.w / 2, s.y - s.h / 2, s.w, s.h, s.r);
  ctx.stroke();
  ctx.restore();
}
matchCut.dur = 0.4;
matchCut.anchor = 0.5;

// A cut with 1–2 frames of accent at 60% over B, starting on the cut frame.
export function flash(ctx, t, drawA, drawB, t0, dur = flash.dur, { color = colors.accent, alpha = 0.6 } = {}) {
  drawB(ctx);
  ctx.save();
  unit(ctx);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
flash.dur = 2 / FPS;
flash.anchor = 0;
