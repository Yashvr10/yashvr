import { win, outCubic } from '../ease.js';
import { font, txt, box } from '../draw.js';

export default function flow(ctx, t, dur, d, S) {
  const n = d.nodes.length, gap = 120, w = (S.W - 320 - gap * (n - 1)) / n, h = 300, y = S.H * 0.5 - h / 2 - 30;
  d.nodes.forEach((nd, i) => {
    const p = outCubic(win(t, 0.3 + i * 0.7, 1.0 + i * 0.7));
    const x = 160 + i * (w + gap);
    box(ctx, x, y + (1 - p) * 40, w, h, 28, S.card, nd.accent ? S.accent : 'rgba(255,255,255,.12)', p);
    txt(ctx, nd.label, x + w / 2, y + h / 2 + 10 + (1 - p) * 40, { font: font(S, 62, 800), color: S.fg, align: 'center', a: p });
    if (nd.sub) txt(ctx, nd.sub, x + w / 2, y + h / 2 + 76 + (1 - p) * 40, { font: font(S, 34, 500, true), color: S.muted, align: 'center', a: p });
    if (i < n - 1) {
      const a = outCubic(win(t, 0.8 + i * 0.7, 1.4 + i * 0.7));
      const ax = x + w + 18, ay = y + h / 2;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = S.accent;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax + (gap - 36) * a, ay);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ax + (gap - 36) * a + 4, ay);
      ctx.lineTo(ax + (gap - 36) * a - 16, ay - 14);
      ctx.lineTo(ax + (gap - 36) * a - 16, ay + 14);
      ctx.closePath();
      ctx.fillStyle = S.accent;
      ctx.fill();
      ctx.restore();
    }
  });
  if (d.caption) txt(ctx, d.caption, S.W / 2, y + h + 130, { font: font(S, 44, 500), color: S.muted, align: 'center', a: outCubic(win(t, 2.0, 2.6)) });
}
