import { win, outCubic } from '../ease.js';
import { font, txt, box, fmt } from '../draw.js';

export default function bars(ctx, t, dur, d, S) {
  const x0 = 380, maxW = S.W - x0 - 340, rowH = 118;
  const max = Math.max(...d.items.map((i) => i.value));
  const top = S.H * 0.5 - (d.items.length * rowH) / 2 + 30;
  txt(ctx, d.title, 160, top - 80, { font: font(S, 64, 800), color: S.fg, a: outCubic(win(t, 0.1, 0.6)) });
  d.items.forEach((it, i) => {
    const p = outCubic(win(t, 0.5 + i * 0.35, 1.5 + i * 0.35));
    const y = top + i * rowH;
    txt(ctx, it.label, x0 - 30, y + 62, { font: font(S, 44, 600), color: S.fg, align: 'right', a: p });
    box(ctx, x0, y + 18, maxW, 56, 14, S.card, null, p);
    box(ctx, x0, y + 18, Math.max(24, (maxW * it.value * p) / max), 56, 14, i === d.highlight ? S.accent : S.fg, null, p);
    txt(ctx, `${it.display ?? fmt(it.value)}${d.unit ? ' ' + d.unit : ''}`, x0 + maxW + 30, y + 62, { font: font(S, 40, 600, true), color: S.muted, a: p });
  });
}
