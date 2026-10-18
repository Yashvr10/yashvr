import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import puppeteer from 'puppeteer';

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf' };

export function serve(port = 8080) {
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

// CHROME_PATH picks a specific browser. Chrome won't sandbox as root (e.g. in containers).
export const launch = () => puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || undefined,
  args: process.getuid?.() === 0 ? ['--no-sandbox'] : [],
});

// Each call gets an isolated context, so no module state carries over between pages.
export async function openPage(browser) {
  const page = await (await browser.createBrowserContext()).newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
  await page.goto('http://localhost:8080/index.html?render');
  await page.waitForFunction('window.READY === true');
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
