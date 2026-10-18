// engine/ease.js: the curves, plotted 0..1 over 0..1 (the dot is each at u = 0.5).
import { outCubic, inOutCubic, inOutQuint, outExpo, outBack, spring } from '../engine/ease.js';
import { L } from '../engine/layout.js';
import { colors, stroke, motion } from '../tokens.js';
import { frame, label } from './_kit.js';

export const dur = 1, T = 0.5, captions = [];
const CURVES = [
  ['outExpo (entrances)', outExpo], ['outBack 1.4 (pops)', (u) => outBack(u, motion.overshoot)], ['outCubic (exits)', outCubic],
  ['inOutCubic (camera)', inOutCubic], ['inOutQuint (whips)', inOutQuint], ['spring k 120, z 0.45', (u) => spring(u, 120, 0.45)],
];

export function draw(ctx) {
  frame(ctx, 'engine/ease.js');
  const w = L.width / 2 - 40, h = 220;
  CURVES.forEach(([name, f], k) => {
    const x = L.left + (k % 2) * (w + 80), y = L.top + 140 + Math.floor(k / 2) * (h + 140);
    ctx.strokeStyle = colors.dim;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = stroke.outline;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) ctx.lineTo(x + (w * i) / 60, y + h - h * f(i / 60));
    ctx.stroke();
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(x + w / 2, y + h - h * f(0.5), 12, 0, Math.PI * 2);
    ctx.fill();
    label(ctx, name, x, y + h + 48);
  });
}
