import { win, outCubic } from '../ease.js';
import { font, wrap, txt } from '../draw.js';

export default function list(ctx, t, dur, d, S) {
  const n = d.items.length;
  // Items arrive across the narration, not on a fixed clock: stretch the
  // reveal over the span the voice is actually speaking.
  const span = Math.max(1.5, S.voice.end - S.voice.start - 1.2);
  const top = S.H * 0.5 - (n * 170) / 2 + 40;
  txt(ctx, d.title, 160, top - 70, { font: font(S, 68, 800), color: S.fg, a: outCubic(win(t, 0.1, 0.6)) });
  d.items.forEach((it, i) => {
    const at = S.voice.start + 0.2 + (span * i) / n;
    const p = outCubic(win(t, at, at + 0.6));
    const active = t >= at && (i === n - 1 || t < S.voice.start + 0.2 + (span * (i + 1)) / n);
    const y = top + i * 170;
    ctx.beginPath();
    ctx.arc(190, y + 38, 16, 0, Math.PI * 2);
    ctx.fillStyle = active ? S.accent : S.card;
    ctx.globalAlpha = p;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.font = font(S, 54, 600);
    wrap(ctx, it, S.W - 520).forEach((l, k) =>
      txt(ctx, l, 250, y + 56 + k * 62 + (1 - p) * 24, { font: font(S, 54, 600), color: S.fg, a: p * (active || t < at ? 1 : 0.55) }),
    );
  });
}
