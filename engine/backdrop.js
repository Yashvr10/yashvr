import { hash } from './rng.js';
import { W, H, FPS, colors } from '../tokens.js';

// Grain tile, built once at load from the stateless hash.
let grain;
export async function loadBackdrop() {
  const c = new OffscreenCanvas(256, 256), g = c.getContext('2d'), img = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = hash(i, 7) * 255;
    img.data.set([v, v, v, 255], i * 4);
  }
  g.putImageData(img, 0, 0);
  grain = c;
}

// Background colour, slow drifting light, vignette and grain. Pass global time so the light
// carries on across scene cuts.
export function backdrop(ctx, t) {
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, W, H);

  // Slow drifting light, warm from the accent.
  const x = W * 0.5 + 260 * Math.sin(t * 0.35), y = H * 0.42 + 90 * Math.cos(t * 0.27);
  const light = ctx.createRadialGradient(x, y, 0, x, y, 1100);
  light.addColorStop(0, 'rgba(255,106,61,0.13)');
  light.addColorStop(0.5, 'rgba(255,106,61,0.04)');
  light.addColorStop(1, 'rgba(255,106,61,0)');
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, W, H);

  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);

  // Grain: tile offset jumps each frame, chosen by hash of the frame index.
  const f = Math.round(t * FPS);
  ctx.save();
  ctx.globalAlpha = 0.03;
  ctx.fillStyle = ctx.createPattern(grain, 'repeat');
  ctx.translate(-hash(f, 11) * 256, -hash(f, 12) * 256);
  ctx.fillRect(0, 0, W + 256, H + 256);
  ctx.restore();
}
