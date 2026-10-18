import { W, H } from '../tokens.js';

// Full-frame scratch layers, cleared before every use, so nothing carries between calls.
// Owners: 0 and 1 for engine/type.js, 2 for engine/draw.js.
const scratch = [0, 1, 2].map(() => new OffscreenCanvas(W, H).getContext('2d'));

// Returns layer k cleared, with ctx's current transform.
export function layer(k, ctx) {
  const s = scratch[k];
  s.reset();
  s.setTransform(ctx.getTransform());
  return s;
}

// Composites a layer onto ctx in device pixels.
export function blit(ctx, src, alpha, dx = 0, dy = 0) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = alpha;
  ctx.drawImage(src.canvas, dx, dy);
  ctx.restore();
}
