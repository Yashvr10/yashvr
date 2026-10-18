import http from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import puppeteer from 'puppeteer';

const ROOT = process.cwd();
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json', '.png': 'image/png',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf' };

const server = http.createServer(async (req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  try {
    const body = await readFile(join(ROOT, path === '/' ? 'index.html' : path));
    res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(8080);

// CHROME_PATH lets you point at a specific browser; otherwise puppeteer's own is used.
// Chrome refuses to sandbox as root (e.g. in containers), so drop the sandbox only then.
const browser = await puppeteer.launch({
  headless: true,
  executablePath: process.env.CHROME_PATH || undefined,
  args: process.getuid?.() === 0 ? ['--no-sandbox'] : [],
});
const page = await browser.newPage();
await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
await page.goto('http://localhost:8080/index.html');
await page.waitForFunction('window.READY === true');

const dataUrl = await page.evaluate(() => {
  window.renderFrame(0);
  return document.getElementById('c').toDataURL('image/png');
});
await writeFile('frames/f00000.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
console.log('wrote frames/f00000.png');

await browser.close();
server.close();
