export const font = (S, px, weight = 700, mono = false) => `${weight} ${px}px ${mono ? S.mono : S.sans}`;

/** Word-wrap `text` into lines no wider than maxW at the ctx's current font. */
export function wrap(ctx, text, maxW) {
  const lines = [];
  let line = '';
  for (const w of String(text).split(/\s+/)) {
    const next = line ? `${line} ${w}` : w;
    if (line && ctx.measureText(next).width > maxW) {
      lines.push(line);
      line = w;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

/** One call = one piece of text. `o` = { font, color, a, align, base, spacing }. */
export function txt(ctx, s, x, y, o) {
  ctx.save();
  ctx.globalAlpha = o.a ?? 1;
  ctx.font = o.font;
  ctx.fillStyle = o.color;
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = o.base || 'alphabetic';
  if (o.spacing) ctx.letterSpacing = `${o.spacing}px`;
  ctx.fillText(s, x, y);
  ctx.restore();
}

export function box(ctx, x, y, w, h, r, fill, stroke, a = 1) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 2; ctx.stroke(); }
  ctx.restore();
}

/** Largest font size (<= start) at which `text` still fits in maxW. Numbers from a
 *  script are never the length you designed for, so never hard-code their size. */
export function fit(ctx, S, text, weight, maxW, start) {
  let px = start;
  ctx.font = font(S, px, weight);
  while (px > 24 && ctx.measureText(text).width > maxW) {
    px -= 4;
    ctx.font = font(S, px, weight);
  }
  return px;
}

export const fmt = (n) => Math.round(n).toLocaleString('en-US');
