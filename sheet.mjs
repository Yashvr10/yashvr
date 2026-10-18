// Renders s02 stills at the middle of every entrance, hold and exit into qa/, then tiles
// those PNGs into qa/type_sheet.png.
import { mkdir, writeFile } from 'node:fs/promises';
import { serve, launch, openPage, grab } from './browser.mjs';

const COLS = 4, TW = 480, TH = 270, LABEL = 34;

const server = serve();
const browser = await launch();
const page = await openPage(browser);
const { start, BEATS } = await page.evaluate(() => import(`${location.origin}/scenes/s02_type_demo.js`)
  .then((m) => ({ start: m.start, BEATS: m.BEATS })));

const shots = BEATS.flatMap((b) => ['enter', 'hold', 'exit'].filter((k) => b[k]).map((k) => {
  const t = (b[k][0] + b[k][1]) / 2;
  return { label: `${b.move} · ${k} · ${t.toFixed(2)}s`, file: `qa/s02_${(start + t).toFixed(2)}.png`, t: start + t };
}));
await mkdir('qa', { recursive: true });
for (const s of shots) await writeFile(s.file, await grab(page, s.t));

// Any page on our origin can load the PNGs without tainting its canvas.
const sheet = await browser.newPage();
await sheet.goto('http://localhost:8080/qa/');
const url = await sheet.evaluate(async (shots, COLS, TW, TH, LABEL) => {
  const rows = Math.ceil(shots.length / COLS), c = document.createElement('canvas');
  c.width = COLS * TW;
  c.height = rows * (TH + LABEL);
  const g = c.getContext('2d');
  g.fillStyle = '#000';
  g.fillRect(0, 0, c.width, c.height);
  g.font = '18px monospace';
  for (const [i, s] of shots.entries()) {
    const img = new Image();
    img.src = `/${s.file}`;
    await img.decode();
    const x = (i % COLS) * TW, y = Math.floor(i / COLS) * (TH + LABEL);
    g.drawImage(img, x, y, TW, TH);
    g.strokeStyle = '#333';
    g.strokeRect(x + 0.5, y + 0.5, TW - 1, TH - 1);
    g.fillStyle = '#ccc';
    g.fillText(s.label, x + 10, y + TH + 23);
  }
  return c.toDataURL('image/png');
}, shots, COLS, TW, TH, LABEL);
await writeFile('qa/type_sheet.png', Buffer.from(url.split(',')[1], 'base64'));
console.log(`qa/type_sheet.png (${shots.length} stills)`);

await browser.close();
server.close();
