// Renders ONE scene as a pure function of time: stage.html?scene=s003&render
import { SCENES } from './engine/scenes/index.js';
import { win, clamp01 } from './engine/ease.js';
import { font } from './engine/draw.js';

const q = new URLSearchParams(location.search);
const [video, timeline] = await Promise.all([
  fetch('video.json').then((r) => r.json()),
  fetch('build/timeline.json').then((r) => r.json()),
]);
const scene = video.scenes.find((s) => s.id === q.get('scene'));
const slot = timeline.scenes[scene.id];
const k = Number(q.get('scale') || 1); // draft renders draw at half size
// Photos and screenshots load BEFORE the first frame: a synchronous draw can
// never wait on a network or disk read, and READY means "everything is here".
const images = {};
if (scene.type === 'image') {
  const img = new Image();
  img.src = scene.data.src;
  await img.decode();
  images[scene.data.src] = img;
}
const S = {
  ...video.style,
  images,
  W: video.meta.width,
  H: video.meta.height,
  voice: { start: slot.lead, end: slot.lead + slot.voiceDur },
};
const c = document.getElementById('c');
c.width = Math.round(S.W * k);
c.height = Math.round(S.H * k);
const ctx = c.getContext('2d');

/** Group words into short caption lines (<= 7 words and <= 38 characters). */
function chunk(words) {
  const out = [];
  let cur = [];
  for (const w of words) {
    const len = cur.reduce((n, x) => n + x.w.length + 1, 0) + w.w.length;
    if (cur.length && (cur.length >= 7 || len > 38)) {
      out.push(cur);
      cur = [];
    }
    cur.push(w);
  }
  if (cur.length) out.push(cur);
  return out;
}
const chunks = chunk(slot.words);

// meta.captionStyle: "pill" (default), "karaoke" (words fill left to right as they
// are spoken) or "outline" (no pill, 3 px dark outline, larger text). Same line
// timing for all three; only the look changes. Baseline stays at H - 120.
function captions(t) {
  if (video.meta.captions === false || scene.captions === false) return;
  const tv = t - slot.lead; // time inside the voice clip
  const line = chunks.find((ch) => tv >= ch[0].s - 0.05 && tv < ch[ch.length - 1].e + 0.15);
  if (!line) return;
  const style = video.meta.captionStyle || 'pill';
  const y = S.H - 120;
  // Karaoke and outline shrink a long line to stay inside the 160 px side margins.
  let px = style === 'outline' ? 68 : 56;
  ctx.font = font(S, px, 700);
  let gap = ctx.measureText(' ').width;
  let widths = line.map((w) => ctx.measureText(w.w).width);
  let total = widths.reduce((a, b) => a + b, 0) + gap * (line.length - 1);
  if (style !== 'pill' && total > S.W - 320) {
    px = Math.floor((px * (S.W - 320)) / total);
    ctx.font = font(S, px, 700);
    gap = ctx.measureText(' ').width;
    widths = line.map((w) => ctx.measureText(w.w).width);
    total = widths.reduce((a, b) => a + b, 0) + gap * (line.length - 1);
  }
  if (style !== 'outline') {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.roundRect(S.W / 2 - total / 2 - 36, y - 68, total + 72, 98, 24);
    ctx.fill();
  }
  ctx.textAlign = 'left';
  ctx.lineJoin = 'round';
  let x = S.W / 2 - total / 2;
  line.forEach((w, i) => {
    if (style === 'karaoke') {
      // Unspoken text is dim; a clip sweeps the bright fill across each word as it is said.
      const fill = clamp01((tv - w.s) / Math.max(0.05, w.e - w.s));
      ctx.fillStyle = 'rgba(244,241,234,0.38)';
      ctx.fillText(w.w, x, y);
      if (fill > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - 4, y - px * 1.2, (widths[i] + 8) * fill, px * 1.6);
        ctx.clip();
        ctx.fillStyle = tv < w.e ? S.accent : S.fg;
        ctx.fillText(w.w, x, y);
        ctx.restore();
      }
    } else {
      if (style === 'outline') {
        ctx.lineWidth = 6; // centred on the glyph edge: 3 px shows outside the fill
        ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.strokeText(w.w, x, y);
      }
      ctx.fillStyle = tv >= w.s && tv < w.e ? S.accent : S.fg;
      ctx.fillText(w.w, x, y);
    }
    x += widths[i] + gap;
  });
}

function renderFrame(t) {
  ctx.setTransform(k, 0, 0, k, 0, 0);
  ctx.fillStyle = S.bg;
  ctx.fillRect(0, 0, S.W, S.H);
  // slow light drift: a pure function of t, so every frame is reproducible
  const g = ctx.createRadialGradient(S.W * (0.7 + 0.05 * Math.sin(t * 0.4)), S.H * 0.25, 0, S.W * 0.7, S.H * 0.25, S.W * 0.7);
  g.addColorStop(0, 'rgba(217,119,87,0.16)');
  g.addColorStop(1, 'rgba(217,119,87,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S.W, S.H);

  SCENES[scene.type](ctx, t, slot.dur, scene.data, S);
  captions(t);

  // dip through the background colour at both ends of every scene
  const veil = Math.max(1 - win(t, 0, 0.2), win(t, slot.dur - 0.2, slot.dur));
  if (veil > 0) {
    ctx.globalAlpha = clamp01(veil);
    ctx.fillStyle = S.bg;
    ctx.fillRect(0, 0, S.W, S.H);
    ctx.globalAlpha = 1;
  }
}

window.renderFrame = renderFrame;
window.FPS = video.meta.fps;
window.DURATION = slot.dur;
window.VOICE_END = S.voice.end;
await document.fonts.ready;
window.READY = true;
