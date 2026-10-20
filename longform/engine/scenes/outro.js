import { win, outCubic } from '../ease.js';
import { font, wrap, txt } from '../draw.js';

export default function outro(ctx, t, dur, d, S) {
  ctx.font = font(S, 130, 800);
  const lines = wrap(ctx, d.title, S.W - 400);
  lines.forEach((l, i) => txt(ctx, l, S.W / 2, S.H * 0.46 + i * 140 + (1 - outCubic(win(t, 0.2 + i * 0.1, 0.9 + i * 0.1))) * 40, { font: font(S, 130, 800), color: S.fg, align: 'center', a: outCubic(win(t, 0.2 + i * 0.1, 0.9 + i * 0.1)) }));
  if (d.sub) txt(ctx, d.sub, S.W / 2, S.H * 0.46 + lines.length * 140 + 30, { font: font(S, 48, 500, true), color: S.accent, align: 'center', a: outCubic(win(t, 0.9, 1.5)) });
}
