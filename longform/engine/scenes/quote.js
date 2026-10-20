import { win, outCubic } from '../ease.js';
import { font, fit, wrap, txt } from '../draw.js';

// A quotation and who said it. The lines arrive across the narration, the size is
// measured so the longest word fits the width and the whole block fits above the
// caption band, and the attribution lands after the last line.
export default function quote(ctx, t, dur, d, S) {
  const x = 260, maxW = S.W - x - 160, top = 210, bottom = 840, foot = 150; // foot: room for attribution + source
  const longest = d.text.split(/\s+/).reduce((a, b) => (b.length > a.length ? b : a));
  let px = fit(ctx, S, longest, 600, maxW, 92);
  ctx.font = font(S, px, 600);
  let lines = wrap(ctx, d.text, maxW);
  while (px > 40 && lines.length * px * 1.25 + foot > bottom - top) {
    px -= 4;
    ctx.font = font(S, px, 600);
    lines = wrap(ctx, d.text, maxW);
  }
  const lh = px * 1.25, n = lines.length;
  const y0 = top + (bottom - top - (n * lh + foot)) / 2 + px; // first baseline, block centred
  const span = Math.max(1.5, S.voice.end - S.voice.start - 1.2);
  const at = (i) => S.voice.start + 0.2 + (span * i) / n;

  if (d.kicker) txt(ctx, d.kicker.toUpperCase(), 160, y0 - px - 70, { font: font(S, 30, 600, true), color: S.accent, a: outCubic(win(t, 0.1, 0.6)), spacing: 6 });
  // The opening mark ends 18 px before the text, so it never touches the first letter.
  txt(ctx, '“', x - 18, y0 + px * 0.5, { font: font(S, px * 1.6, 800), color: S.accent, align: 'right', a: outCubic(win(t, 0.2, 0.7)) });
  lines.forEach((l, i) => {
    const p = outCubic(win(t, at(i), at(i) + 0.6));
    txt(ctx, l, x, y0 + i * lh + (1 - p) * 24, { font: font(S, px, 600), color: S.fg, a: p });
  });
  const a = outCubic(win(t, at(n - 1) + 0.5, at(n - 1) + 1.1));
  const ay = y0 + (n - 1) * lh + 96;
  txt(ctx, `— ${d.by}`, x, ay, { font: font(S, 40, 700), color: S.accent, a });
  if (d.source) txt(ctx, d.source, x, ay + 50, { font: font(S, 30, 500, true), color: S.muted, a });
}
