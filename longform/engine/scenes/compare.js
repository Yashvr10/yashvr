import { win, outExpo, outCubic } from '../ease.js';
import { font, fit, wrap, txt, box, fmt } from '../draw.js';

export default function compare(ctx, t, dur, d, S) {
  const w = 740, h = 560, y = S.H * 0.5 - h / 2 - 20;
  [d.left, d.right].forEach((side, i) => {
    const x = i === 0 ? 160 : S.W - 160 - w;
    const p = outCubic(win(t, 0.2 + i * 0.5, 0.9 + i * 0.5));
    box(ctx, x, y + (1 - p) * 40, w, h, 32, S.card, i === 1 ? S.accent : 'rgba(255,255,255,.12)', p);
    txt(ctx, side.label.toUpperCase(), x + 56, y + 90 + (1 - p) * 40, { font: font(S, 32, 600, true), color: i === 1 ? S.accent : S.muted, a: p, spacing: 5 });
    const v = outExpo(win(t, 0.8 + i * 0.5, 2.2 + i * 0.5));
    const big = fmt(side.value * v);
    const px = fit(ctx, S, fmt(side.value), 800, w - 112, 150); // size from the FINAL number, so it never jumps while counting
    txt(ctx, big, x + 56, y + 280 + (1 - p) * 40, { font: font(S, px, 800), color: S.fg, a: p });
    txt(ctx, side.unit, x + 56, y + 350 + (1 - p) * 40, { font: font(S, 40, 600, true), color: S.accent, a: p });
    ctx.font = font(S, 38, 500);
    wrap(ctx, side.note, w - 112).forEach((l, k) => txt(ctx, l, x + 56, y + 430 + k * 48 + (1 - p) * 40, { font: font(S, 38, 500), color: S.muted, a: p }));
  });
  txt(ctx, 'vs', S.W / 2, y - 36, { font: font(S, 56, 700, true), color: S.muted, align: 'center', a: outCubic(win(t, 0.6, 1.0)) });
}
