import { win, lerp, outExpo, spring } from '../engine/ease.js';
import { hash } from '../engine/rng.js';
import { fixedSim } from '../engine/sim.js';
import { BG, FG, ACCENT, SANS } from '../tokens.js';

export const DURATION = 6;
export const FONTS = [`120px ${SANS}`, `32px ${SANS}`];
export const load = async () => {}; // decode images / compile shaders here

const W = 1920, H = 1080, N = 24, R = 14, FLOOR = 900;

// Balls fall from seeded heights and bounce off the floor and walls.
const balls = fixedSim(
  () => Array.from({ length: N }, (_, i) => ({
    x: 200 + hash(i, 1) * 1520, y: -100 - hash(i, 2) * 600, vx: (hash(i, 3) - 0.5) * 400, vy: 0,
  })),
  (bs, dt) => {
    for (const b of bs) {
      b.vy += 2400 * dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.y > FLOOR - R) { b.y = FLOOR - R; b.vy *= -0.6; }
      if (b.x < R || b.x > W - R) { b.x = Math.min(W - R, Math.max(R, b.x)); b.vx *= -1; }
    }
    return bs;
  },
);

export function draw(ctx, t) {
  ctx.reset();
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);

  const a = outExpo(win(t, 0.2, 1.2));
  ctx.globalAlpha = a;
  ctx.fillStyle = FG;
  ctx.font = FONTS[0];
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('PIPELINE OK', W / 2, lerp(600, 480, a));
  ctx.globalAlpha = 1;

  const s = spring(t - 1, 120, 0.35);
  ctx.fillStyle = ACCENT;
  ctx.fillRect(W / 2 - 300 * s, 560, 600 * s, 6);

  ctx.fillStyle = FG;
  for (const b of balls(t)) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, R, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.font = FONTS[1];
  ctx.textAlign = 'left';
  ctx.fillText(`t = ${t.toFixed(2)}s`, 60, H - 60);
}
