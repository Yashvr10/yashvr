import { win, outCubic, outBack } from '../ease.js';
import { font, wrap, txt } from '../draw.js';

export default function timeline(ctx, t, dur, d, S) {
  const x0 = 320, x1 = S.W - 320, y = S.H * 0.46;
  const n = d.events.length;
  const grow = outCubic(win(t, 0.2, 1.2));
  ctx.fillStyle = S.card;
  ctx.fillRect(x0, y - 3, x1 - x0, 6);
  ctx.fillStyle = S.accent;
  ctx.fillRect(x0, y - 3, (x1 - x0) * grow, 6);
  d.events.forEach((e, i) => {
    const x = x0 + ((x1 - x0) * i) / (n - 1);
    const s = outBack(win(t, 0.8 + i * 0.7, 1.4 + i * 0.7));
    const up = i % 2 === 0;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fillStyle = S.accent;
    ctx.fill();
    ctx.restore();
    const a = outCubic(win(t, 1.0 + i * 0.7, 1.6 + i * 0.7));
    txt(ctx, e.when, x, y + (up ? -190 : 150), { font: font(S, 96, 800), color: S.fg, align: 'center', a });
    ctx.font = font(S, 38, 500);
    wrap(ctx, e.label, 440).forEach((l, k) =>
      txt(ctx, l, x, y + (up ? -190 : 150) + 56 + k * 46, { font: font(S, 38, 500), color: S.muted, align: 'center', a }),
    );
  });
}
