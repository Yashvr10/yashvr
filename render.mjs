// Production render harness for the renderFrame(t) project. Node 20+, ESM, puppeteer.
//
//   node render.mjs video [from] [to]        frames from..to-1 → frames/f%05d.png (resumable)
//   node render.mjs stills 0.5,2,4.25        → qa/still_<t>.png
//   node render.mjs preview --every 3        every 3rd frame as JPEG 0.9 → frames_preview/,
//                                            then out/preview.mp4 at 10 fps
//   node render.mjs pipe out/draft.mp4 [from] [to]   PNGs straight into ffmpeg
//   node render.mjs info                     prints { FPS, DURATION, frames, width, height } as JSON
//
// Options: --batch N (relaunch the browser every N frames, default 60), --workers N (split a
// video range across N child processes), --every N (preview stride), --out DIR (frame folder
// for video, default frames), --ss N (supersample: frames are 1920N × 1080N), --solo <scene id>
// (that scene alone, from 0). CHROME_PATH picks the browser binary.
//
// Frames are captured with canvas.toDataURL after `await window.renderFrame(i / FPS)`, so the
// resolution is the canvas's. Any page error or console error exits non-zero. A watchdog kills
// the browser and retries a frame that takes more than 8× the running median.
import http from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, readFile, readdir, rename, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = dirname(fileURLToPath(import.meta.url));
const SELF = fileURLToPath(import.meta.url);

// ---------- arguments ----------
const argv = process.argv.slice(2);
const flags = {}, pos = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) flags[argv[i].slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
  else pos.push(argv[i]);
}
const mode = pos.shift();
const BATCH = Number(flags.batch ?? 60), WORKERS = Number(flags.workers ?? 1), EVERY = Number(flags.every ?? 3);
const OUT = resolve(ROOT, flags.out ?? 'frames');
const SS = Number(flags.ss ?? 1);
const QUERY = `render&ss=${SS}${flags.solo ? `&solo=${encodeURIComponent(flags.solo)}` : ''}`;
const TAG = flags.worker ? `[w${flags.worker}] ` : '';
const log = (...a) => console.log(TAG + a.join(' '));
const warn = (...a) => console.warn(`${TAG}WARN ${a.join(' ')}`);

class Fatal extends Error {}
function die(msg) {
  console.error(`${TAG}ERROR ${msg}`);
  process.exit(1);
}

// ---------- static server on a free port ----------
const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.otf': 'font/otf', '.frag': 'text/plain', '.vert': 'text/plain', '.svg': 'image/svg+xml',
};
async function startServer() {
  const server = http.createServer(async (req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (url === '/favicon.ico') return res.writeHead(204).end();
    let path = normalize(join(ROOT, url));
    if (!path.startsWith(ROOT)) return res.writeHead(403).end('forbidden');
    if (url.endsWith('/')) path = join(path, 'index.html');
    try {
      const body = await readFile(path);
      res.writeHead(200, { 'Content-Type': TYPES[extname(path)] ?? 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('not found');
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return { server, port: server.address().port };
}

// ---------- browser ----------
const launchArgs = [
  '--force-device-scale-factor=1', '--ignore-gpu-blocklist',
  ...(process.platform === 'darwin' ? ['--use-angle=metal'] : []),
  ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []), // Chrome refuses to sandbox as root
];

// A browser plus one page at ?render, READY and wired so any page or console error rejects `failed`.
async function openSession(port) {
  const browser = await puppeteer.launch({ headless: true, executablePath: process.env.CHROME_PATH || undefined, args: launchArgs });
  const page = await browser.newPage();
  let reject;
  const failed = new Promise((_, r) => { reject = r; });
  failed.catch(() => {});
  page.on('pageerror', (e) => reject(new Fatal(`page error: ${e.message}`)));
  page.on('console', (m) => { if (m.type() === 'error') reject(new Fatal(`console error: ${m.text()}`)); });
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}/index.html?${QUERY}`);
  await Promise.race([page.waitForFunction('window.READY === true', { timeout: 180000 }), failed]);
  const info = await page.evaluate(() => ({ FPS: window.FPS, DURATION: window.DURATION, SS: window.SS }));
  if (info.SS !== SS) throw new Fatal(`page ran at ss=${info.SS}, asked for ${SS}`);
  return { browser, page, failed, ...info };
}
const closeSession = async (s) => { try { await s?.browser.close(); } catch { s?.browser.process()?.kill('SIGKILL'); } };

async function capture(s, t, type = 'image/png', quality) {
  const url = await Promise.race([
    s.page.evaluate(async (t, type, quality) => {
      await window.renderFrame(t);
      return document.getElementById('c').toDataURL(type, quality);
    }, t, type, quality),
    s.failed,
  ]);
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
}

// ---------- the render loop: batches, watchdog, size check ----------
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s[s.length >> 1]; };

// Renders frame indices `list` and hands each buffer to sink(i, buf). Relaunches the browser
// every BATCH frames; retries a frame (up to 2 times) whose capture exceeds 8× the running median.
async function renderFrames(port, list, sink, { type = 'image/png', quality, onBatch } = {}) {
  let s = null, done = 0, sizes = [];
  const times = [], t0 = Date.now();
  for (let k = 0; k < list.length; k++) {
    if (!s || (k > 0 && k % BATCH === 0)) {
      if (s) { await closeSession(s); onBatch?.(sizes); sizes = []; }
      s = await openSession(port);
    }
    const i = list[k];
    for (let attempt = 0; ; attempt++) {
      const limit = times.length >= 5 ? Math.max(8 * median(times.slice(-100)), 2000) : 180000;
      const start = Date.now();
      let timer;
      try {
        const buf = await Promise.race([
          capture(s, i / s.FPS, type, quality),
          new Promise((_, r) => { timer = setTimeout(() => r(new Error('watchdog')), limit); }),
        ]);
        clearTimeout(timer);
        times.push(Date.now() - start);
        sizes.push([i, buf.length]);
        await sink(i, buf);
        break;
      } catch (e) {
        clearTimeout(timer);
        if (e instanceof Fatal) { await closeSession(s); throw e; }
        if (attempt >= 2) { await closeSession(s); throw new Fatal(`frame ${i} failed 3 times: ${e.message}`); }
        warn(`frame ${i}: ${e.message === 'watchdog' ? `over ${(limit / 1000).toFixed(1)} s (8× median)` : e.message}; restarting the browser and retrying`);
        await closeSession(s);
        s = await openSession(port);
      }
    }
    done++;
    if (done % 30 === 0 || k === list.length - 1) {
      log(`frame ${i} (${done}/${list.length}) ${(done / ((Date.now() - t0) / 1000)).toFixed(2)} fps`);
    }
  }
  if (s) { await closeSession(s); onBatch?.(sizes); }
}

// Warn about 5+ consecutive frames with identical byte sizes (a likely frozen frame).
function checkSizes(sizes) {
  for (let a = 0; a < sizes.length;) {
    let b = a;
    while (b + 1 < sizes.length && sizes[b + 1][1] === sizes[a][1]) b++;
    if (b - a + 1 >= 5) warn(`frames ${sizes[a][0]}–${sizes[b][0]}: ${b - a + 1} consecutive frames of identical size (${sizes[a][1]} bytes)`);
    a = b + 1;
  }
}

const exists = async (p) => { try { return (await stat(p)).size > 0; } catch { return false; } };
const pad = (i) => String(i).padStart(5, '0');
const frameFile = (i) => join(OUT, `f${pad(i)}.png`);
async function writeAtomic(path, buf) {
  await writeFile(`${path}.tmp`, buf);
  await rename(`${path}.tmp`, path);
}
async function missing(from, to) {
  const have = new Set((await readdir(OUT).catch(() => [])).filter((f) => /^f\d{5}\.png$/.test(f)).map((f) => Number(f.slice(1, 6))));
  const gaps = [];
  for (let i = from; i < to; i++) if (!have.has(i)) gaps.push(i);
  return gaps;
}
async function totalFrames(port) {
  const s = await openSession(port);
  const n = Math.round(s.DURATION * s.FPS);
  await closeSession(s);
  return n;
}
const ffmpeg = (args) => spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { stdio: ['pipe', 'inherit', 'inherit'] });

// ---------- modes ----------
async function video(port) {
  const total = await totalFrames(port);
  const from = Number(pos[0] ?? 0), to = Math.min(Number(pos[1] ?? total), total);
  await mkdir(OUT, { recursive: true });

  if (WORKERS > 1 && !flags.worker) {
    // Contiguous chunks, one child process each; every child runs its own server and browser.
    const n = to - from, size = Math.ceil(n / WORKERS), kids = [];
    for (let w = 0; w < WORKERS && from + w * size < to; w++) {
      const a = from + w * size, b = Math.min(to, a + size);
      const args = [SELF, 'video', a, b, '--batch', BATCH, '--out', OUT, '--ss', SS, '--worker', w + 1, ...(flags.solo ? ['--solo', flags.solo] : [])].map(String);
      kids.push(new Promise((ok) => spawn(process.execPath, args, { stdio: 'inherit' }).on('exit', ok)));
    }
    const codes = await Promise.all(kids);
    if (codes.some((c) => c !== 0)) die(`worker exit codes: ${codes.join(', ')}`);
  } else {
    const todo = [];
    for (let i = from; i < to; i++) if (!(await exists(frameFile(i)))) todo.push(i);
    log(`video: frames ${from}–${to - 1}, ${to - from - todo.length} already on disk, ${todo.length} to render`);
    await renderFrames(port, todo, (i, buf) => writeAtomic(frameFile(i), buf), { onBatch: checkSizes });
  }
  if (!flags.worker) {
    const gaps = await missing(from, to);
    if (gaps.length) die(`missing frames: ${gaps.join(', ')}`);
    log(`video: frames ${from}–${to - 1} complete in ${OUT}, no gaps`);
  }
}

async function stills(port) {
  const ts = (pos[0] ?? '').split(',').filter(Boolean);
  if (!ts.length) die('stills needs times, e.g. stills 0.5,2,4.25');
  await mkdir(join(ROOT, 'qa'), { recursive: true });
  const s = await openSession(port);
  try {
    for (const t of ts) {
      const name = `still_${t}${SS > 1 ? `_ss${SS}` : ''}.png`;
      await writeAtomic(join(ROOT, 'qa', name), await capture(s, Number(t)));
      log(`qa/${name}`);
    }
  } finally { await closeSession(s); }
}

async function preview(port) {
  const total = await totalFrames(port), dir = join(ROOT, 'frames_preview');
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  const list = [];
  for (let i = 0; i < total; i += EVERY) list.push(i);
  log(`preview: ${list.length} frames (every ${EVERY}) as JPEG 0.9`);
  await renderFrames(port, list, (i, buf) => writeAtomic(join(dir, `p${pad(i / EVERY)}.jpg`), buf), {
    type: 'image/jpeg', quality: 0.9, onBatch: checkSizes,
  });
  await mkdir(join(ROOT, 'out'), { recursive: true });
  const ff = ffmpeg(['-y', '-framerate', '10', '-i', join(dir, 'p%05d.jpg'), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', join(ROOT, 'out', 'preview.mp4')]);
  ff.stdin.end();
  const [code] = await once(ff, 'exit');
  if (code !== 0) die(`ffmpeg exited ${code}`);
  log('out/preview.mp4');
}

async function pipe(port) {
  const out = resolve(ROOT, pos[0] ?? 'out/draft.mp4');
  const s0 = await openSession(port);
  const { FPS, DURATION } = s0;
  await closeSession(s0);
  const total = Math.round(DURATION * FPS), from = Number(pos[1] ?? 0), to = Math.min(Number(pos[2] ?? total), total);
  await mkdir(dirname(out), { recursive: true });
  const ff = ffmpeg(['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-movflags', '+faststart', out]);
  let ffDone = false;
  const exited = once(ff, 'exit').then(([code]) => { ffDone = true; return code; });
  ff.stdin.on('error', (e) => die(`ffmpeg stdin: ${e.message}`));
  const list = [];
  for (let i = from; i < to; i++) list.push(i);
  log(`pipe: frames ${from}–${to - 1} → ${out}`);
  await renderFrames(port, list, async (i, buf) => {
    if (ffDone) throw new Fatal('ffmpeg exited early');
    // Backpressure: when the pipe's buffer is full, wait for 'drain' before the next frame.
    if (!ff.stdin.write(buf)) await once(ff.stdin, 'drain');
  }, { onBatch: checkSizes });
  ff.stdin.end();
  const code = await exited;
  if (code !== 0) die(`ffmpeg exited ${code}`);
  log(`${out} written`);
}

// ---------- main ----------
// Prints what encode.sh and verify.mjs need, read from the page rather than assumed.
async function info(port) {
  const s = await openSession(port);
  try {
    const [width, height] = await s.page.evaluate(() => [document.getElementById('c').width, document.getElementById('c').height]);
    console.log(JSON.stringify({ FPS: s.FPS, DURATION: s.DURATION, frames: Math.round(s.DURATION * s.FPS), width, height, SS: s.SS }));
  } finally { await closeSession(s); }
}

const modes = { video, stills, preview, pipe, info };
if (!modes[mode]) die('usage: node render.mjs video [from] [to] | stills t1,t2 | preview [--every N] | pipe out.mp4 [from] [to] | info  [--batch N] [--workers N] [--out DIR] [--ss N] [--solo ID]');
const { server, port } = await startServer();
try {
  await modes[mode](port);
} catch (e) {
  die(e.message);
} finally {
  server.close();
}
