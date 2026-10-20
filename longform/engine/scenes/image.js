import { win, outCubic, lerp } from '../ease.js';
import { font, wrap, txt } from '../draw.js';

// Your own photo or screenshot, slowly pushed in (the "Ken Burns" move).
// stage.js loads data.src before the first frame, so renderFrame stays synchronous.
export default function image(ctx, t, dur, d, S) {
  const img = S.images[d.src];
  const zoom = lerp(1.0, 1.12, t / dur); // closed form in t: same frame every render
  const scale = Math.max(S.W / img.width, S.H / img.height) * zoom;
  const w = img.width * scale, h = img.height * scale;
  ctx.drawImage(img, (S.W - w) / 2 + lerp(0, -40, t / dur), (S.H - h) / 2, w, h);
  // a dark gradient so text stays readable on any photo
  const g = ctx.createLinearGradient(0, S.H * 0.45, 0, S.H);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.78)');
  ctx.fillStyle = g;
  ctx.fillRect(0, S.H * 0.45, S.W, S.H * 0.55);
  if (d.label) {
    ctx.font = font(S, 64, 800);
    wrap(ctx, d.label, S.W - 400).forEach((l, i) =>
      txt(ctx, l, 160, S.H - 300 + i * 76, { font: font(S, 64, 800), color: S.fg, a: outCubic(win(t, 0.4 + i * 0.1, 1.0 + i * 0.1)) }),
    );
  }
  if (d.credit) txt(ctx, d.credit, S.W - 160, 80, { font: font(S, 28, 500, true), color: S.muted, align: 'right', a: 0.8 });
}
