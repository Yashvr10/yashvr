import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import puppeteer from 'puppeteer';

// PORT env var picks the static server's port (default 8080), e.g. to run two jobs at once.
const PORT = Number(process.env.PORT ?? 8080);

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf' };

export function serve(port = PORT) {
  return http.createServer(async (req, res) => {
    let path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    if (path.endsWith('/')) path += 'index.html';
    try {
      const body = await readFile(join(process.cwd(), path));
      res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404, { 'Content-Type': 'text/plain' }); res.end('not found'); }
  }).listen(port);
}

// CHROME_PATH picks a specific browser. WebGL2 needs the GPU blocklist off (headless often
// lands on SwiftShader); macOS renders through ANGLE's Metal backend. Chrome won't sandbox as
// root (e.g. in containers).
export const launch = () => puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || undefined,
  args: [
    '--ignore-gpu-blocklist',
    ...(process.platform === 'darwin' ? ['--use-angle=metal'] : []),
    ...(process.getuid?.() === 0 ? ['--no-sandbox'] : []),
  ],
});

// Each call gets an isolated context, so no module state carries over between pages.
// query adds URL flags after ?render, e.g. 'nopost'. A page error (a shader that fails to
// compile, a missing extension) rejects at once instead of timing out on READY.
export async function openPage(browser, query = '') {
  const page = await (await browser.createBrowserContext()).newPage();
  const failed = new Promise((_, reject) => page.on('pageerror', reject));
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto(`http://localhost:${PORT}/index.html?render${query ? `&${query}` : ''}`);
  await Promise.race([page.waitForFunction('window.READY === true'), failed]);
  failed.catch(() => {});
  return page;
}

// Renders time t to PNG bytes. Clock, random and timer calls throw while renderFrame runs.
export async function grab(page, t) {
  const url = await page.evaluate((t) => {
    const banned = [[Math, 'random'], [Date, 'now'], [performance, 'now'], [window, 'setTimeout'], [window, 'setInterval']];
    const saved = banned.map(([o, k]) => o[k]);
    banned.forEach(([o, k]) => { o[k] = () => { throw new Error(`banned call in renderFrame: ${k}`); }; });
    try { window.renderFrame(t); } finally { banned.forEach(([o, k], i) => { o[k] = saved[i]; }); }
    return document.getElementById('c').toDataURL('image/png');
  }, t);
  return Buffer.from(url.split(',')[1], 'base64');
}

// Tiles PNG files already on disk (served from this folder) into one labelled PNG.
// shots: [{ file, label }]. Any page on our origin can draw them without tainting its canvas.
export async function contactSheet(browser, shots, { cols = 4, tw = 480, th = 270 } = {}) {
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/qa/`);
  const url = await page.evaluate(async (shots, cols, tw, th) => {
    const LABEL = 34, rows = Math.ceil(shots.length / cols), c = document.createElement('canvas');
    c.width = cols * tw;
    c.height = rows * (th + LABEL);
    const g = c.getContext('2d');
    g.fillStyle = '#000';
    g.fillRect(0, 0, c.width, c.height);
    g.font = '18px monospace';
    for (const [i, s] of shots.entries()) {
      const img = new Image();
      img.src = `/${s.file}`;
      await img.decode();
      const x = (i % cols) * tw, y = Math.floor(i / cols) * (th + LABEL);
      g.drawImage(img, x, y, tw, th);
      g.strokeStyle = '#333';
      g.strokeRect(x + 0.5, y + 0.5, tw - 1, th - 1);
      g.fillStyle = '#ccc';
      g.fillText(s.label, x + 10, y + th + 23);
    }
    return c.toDataURL('image/png');
  }, shots, cols, tw, th);
  await page.close();
  return Buffer.from(url.split(',')[1], 'base64');
}
