// Scene by scene: each scene becomes its own small MP4. A scene whose inputs
// have not changed is never rendered twice.
//   node render.mjs                full quality
//   node render.mjs --draft        quarter-size, half the frames, ~8x faster
//   node render.mjs --only s003    just that scene
//   node render.mjs --stills       one still per scene + a contact sheet
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import puppeteer from 'puppeteer';
import { B, ROOT, ffmpeg, flags, readJSON, sceneKey, video } from './lib.mjs';

const f = flags();
const v = video();
const tl = readJSON(B('timeline.json'));
const draft = !!f.draft;
const mode = draft ? 'draft' : 'final';
const SCALE = draft ? 0.5 : 1;
const STEP = draft ? 2 : 1; // draft renders every 2nd frame
const WORKERS = Number(f.workers || 3);
const ids = f.only ? String(f.only).split(',') : v.scenes.map((s) => s.id);
const outDir = B(draft ? 'scenes-draft' : 'scenes');
fs.mkdirSync(outDir, { recursive: true });

export const sceneFile = (id) => {
  const scene = v.scenes.find((s) => s.id === id);
  return path.join(outDir, `${id}.${sceneKey(v, scene, tl.scenes[id], mode)}.mp4`);
};

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || undefined,
  args: ['--force-device-scale-factor=1', '--ignore-gpu-blocklist', ...(process.platform === 'darwin' ? ['--use-angle=metal'] : [])],
});

async function open(id) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => { console.error('PAGE ERROR', id, e.message); process.exit(1); });
  await page.goto(`${base}/stage.html?scene=${id}&scale=${SCALE}&render=1`, { waitUntil: 'load' });
  await page.waitForFunction('window.READY === true', { timeout: 60000 });
  return page;
}

const grab = (page, t, type, q) =>
  page.evaluate(async (t, type, q) => {
    window.renderFrame(t);
    return document.getElementById('c').toDataURL(type, q).split(',')[1];
  }, t, type, q);

async function renderScene(id) {
  const out = sceneFile(id);
  if (fs.existsSync(out)) return { id, cached: true };
  for (const old of fs.readdirSync(outDir)) if (old.startsWith(`${id}.`) && old.endsWith('.mp4')) fs.unlinkSync(path.join(outDir, old));

  const slot = tl.scenes[id];
  const n = Math.ceil(slot.frames / STEP);
  const page = await open(id);
  const t0 = Date.now();
  const ff = spawn('ffmpeg', [
    '-y', '-hide_banner', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(v.meta.fps / STEP), '-c:v', draft ? 'mjpeg' : 'png', '-i', '-',
    '-vf', `fps=${v.meta.fps}`, '-frames:v', String(slot.frames),
    '-c:v', 'libx264', '-preset', draft ? 'ultrafast' : 'medium', '-crf', draft ? '30' : '18',
    '-pix_fmt', 'yuv420p', '-an', `${out}.tmp.mp4`,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', (c) => (c ? rej(new Error(`ffmpeg exited ${c}`)) : res())));
  for (let i = 0; i < n; i++) {
    const b64 = await grab(page, (i * STEP) / v.meta.fps, draft ? 'image/jpeg' : 'image/png', 0.85);
    if (!ff.stdin.write(Buffer.from(b64, 'base64'))) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await done;
  fs.renameSync(`${out}.tmp.mp4`, out); // a half-written scene never looks finished
  await page.close();
  const secs = (Date.now() - t0) / 1000;
  console.log(`scene ${id}  ${slot.frames} frames  ${secs.toFixed(1)}s  ${(n / secs).toFixed(0)} fps`);
  return { id, frames: slot.frames, secs };
}

async function stills() {
  const dir = B('stills');
  fs.mkdirSync(dir, { recursive: true });
  for (const [i, id] of ids.entries()) {
    const slot = tl.scenes[id];
    const page = await open(id);
    const t = Math.min(slot.dur - 0.4, slot.lead + slot.voiceDur * 0.85);
    fs.writeFileSync(path.join(dir, `${String(i + 1).padStart(2, '0')}.jpg`), Buffer.from(await grab(page, t, 'image/jpeg', 0.9), 'base64'));
    await page.close();
  }
  ffmpeg('-framerate', '1', '-i', path.join(dir, '%02d.jpg'), '-vf', 'tile=3x3:padding=10:color=black,scale=1920:-1', '-frames:v', '1', B('contact-sheet.jpg'));
  console.log('stills + build/contact-sheet.jpg');
}

if (f.stills) await stills();
else {
  const queue = [...ids];
  const t0 = Date.now();
  const results = [];
  await Promise.all(
    Array.from({ length: WORKERS }, async () => {
      while (queue.length) results.push(await renderScene(queue.shift()));
    }),
  );
  const fresh = results.filter((r) => !r.cached);
  const frames = fresh.reduce((a, r) => a + r.frames, 0);
  console.log(`render (${mode}): ${fresh.length} rendered, ${results.length - fresh.length} cached, ${frames} frames in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}
await browser.close();
server.close();
