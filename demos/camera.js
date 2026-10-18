// engine/camera.js: one camera (push 1.04, pan 60 px right, 30 down) seen by three layers at
// their depths. Outlines show each layer at IDENTITY; far moves least, foreground most.
import { withCamera, layerScale, Z } from '../engine/camera.js';
import { L } from '../engine/layout.js';
import { colors, stroke } from '../tokens.js';
import { frame, label } from './_kit.js';

export const dur = 1, T = 0.5, captions = [];
const CAM = { s: 1.04, x: 60, y: 30, r: 0 };
const LAYERS = [['far 0.4', Z.far, colors.dim, 0], ['subject 1', Z.subject, colors.ink, 1], ['fore 1.3', Z.fore, colors.coral, 2]];

export function draw(ctx) {
  frame(ctx, 'engine/camera.js');
  LAYERS.forEach(([name, z, color, k]) => {
    const x = L.col(k, 3) - 110, y = L.cy() - 220 + k * 160;
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.strokeRect(x, y, 220, 160);
    ctx.setLineDash([]);
    withCamera(ctx, layerScale(CAM, z), (c) => {
      c.fillStyle = color;
      c.globalAlpha = 0.85;
      c.fillRect(x, y, 220, 160);
      c.globalAlpha = 1;
    });
    label(ctx, name, x, y + 230);
  });
  ctx.strokeStyle = colors.ink;
  ctx.lineWidth = stroke.detail;
  label(ctx, 'withCamera(ctx, layerScale(cam, z), draw)', L.left, L.bottom);
}
