import { win, outCubic } from '../ease.js';
import { font, wrap, txt } from '../draw.js';

export default function title(ctx, t, dur, d, S) {
  const x = 160;
  ctx.font = font(S, 150, 800);
  const lines = wrap(ctx, d.title, S.W - 320);
  const top = S.H * 0.5 - (lines.length * 160) / 2;
  if (d.kicker) {
    const a = outCubic(win(t, 0.1, 0.6));
    txt(ctx, d.kicker.toUpperCase(), x, top - 56, { font: font(S, 30, 600, true), color: S.accent, a, spacing: 6 });
  }
  lines.forEach((l, i) => {
    const p = outCubic(win(t, 0.25 + i * 0.12, 0.95 + i * 0.12));
    txt(ctx, l, x, top + 130 + i * 160 + (1 - p) * 50, { font: font(S, 150, 800), color: S.fg, a: p });
  });
  const bar = outCubic(win(t, 0.9, 1.6));
  ctx.fillStyle = S.accent;
  ctx.fillRect(x, top + lines.length * 160 + 20, 220 * bar, 8);
}
