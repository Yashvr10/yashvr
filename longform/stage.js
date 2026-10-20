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

function captions(t) {
  if (video.meta.captions === false || scene.captions === false) return;
  const tv = t - slot.lead; // time inside the voice clip
  const line = chunks.find((ch) => tv >= ch[0].s - 0.05 && tv < ch[ch.length - 1].e + 0.15);
  if (!line) return;
  ctx.font = font(S, 56, 700);
  const gap = ctx.measureText(' ').width;
  const widths = line.map((w) => ctx.measureText(w.w).width);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (line.length - 1);
  const y = S.H - 120;
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.roundRect(S.W / 2 - total / 2 - 36, y - 68, total + 72, 98, 24);
  ctx.fill();
  let x = S.W / 2 - total / 2;
  line.forEach((w, i) => {
    ctx.fillStyle = tv >= w.s && tv < w.e ? S.accent : S.fg;
    ctx.textAlign = 'left';
    ctx.fillText(w.w, x, y);
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
