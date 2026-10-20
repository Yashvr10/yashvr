import { win, outExpo, outCubic } from '../ease.js';
import { font, fit, wrap, txt, fmt } from '../draw.js';

export default function stat(ctx, t, dur, d, S) {
  const cx = S.W / 2;
  const p = outExpo(win(t, 0.3, 1.8));
  const px = fit(ctx, S, fmt(d.value), 800, S.W - 320, 250);
  // The unit sits under how far the FINAL number reaches below its baseline (commas
  // hang down at big sizes), so it never overlaps and never moves while counting.
  const drop = ctx.measureText(fmt(d.value)).actualBoundingBoxDescent;
  const uy = S.H * 0.48 + Math.max(90, drop + 72);
  txt(ctx, fmt(d.value * p), cx, S.H * 0.48, { font: font(S, px, 800), color: S.fg, align: 'center', a: outCubic(win(t, 0.2, 0.6)) });
  txt(ctx, d.unit, cx, uy, { font: font(S, 56, 600, true), color: S.accent, align: 'center', a: outCubic(win(t, 1.0, 1.6)) });
  ctx.font = font(S, 46, 500);
  wrap(ctx, d.label, 1300).forEach((l, i) =>
    txt(ctx, l, cx, uy + 100 + i * 62, { font: font(S, 46, 500), color: S.muted, align: 'center', a: outCubic(win(t, 1.4 + i * 0.1, 2.1 + i * 0.1)) }),
  );
}
