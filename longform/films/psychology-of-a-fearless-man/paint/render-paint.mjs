// Renders paint/scenes/<name>.js to a PNG by waiting until the layered painting sets window.DONE.
// (Chrome's --screenshot does not wait for p5's draw() frames.) Run as builder from longform/:
//   node films/psychology-of-a-fearless-man/paint/render-paint.mjs [--quick] storm desk ...
import fs from 'node:fs';
import puppeteer from 'puppeteer';
const args = process.argv.slice(2), quick = args.includes('--quick'), names = args.filter((a) => a !== '--quick');
const P = 'films/psychology-of-a-fearless-man/paint';
fs.mkdirSync('build/paint', { recursive: true });
const b = await puppeteer.launch({ headless: true, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--allow-file-access-from-files'] });
for (const s of names) {
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#000}</style>` +
    ['p5.min.js', 'p5.brush.js', 'lib.js', `scenes/${s}.js`].map((f) => `<script src="../../${P}/${f}"></script>`).join('') + `</head><body></body></html>`;
  fs.writeFileSync(`build/paint/${s}.html`, html);
  const p = await b.newPage();
  p.on('pageerror', (e) => { console.error('PAGE ERROR', s, e.message); process.exit(1); });
  const t0 = Date.now();
  await p.goto(`file://${process.cwd()}/build/paint/${s}.html${quick ? '#quick' : ''}`, { timeout: 0, waitUntil: 'domcontentloaded' });
  await p.waitForFunction('window.DONE === true', { timeout: 600000, polling: 1000 });
  const b64 = await p.evaluate(() => document.querySelector('canvas').toDataURL('image/png').split(',')[1]);
  fs.writeFileSync(`build/paint/${s}.${quick ? 'quick' : 'raw'}.png`, Buffer.from(b64, 'base64'));
  console.log(`${quick ? 'quick' : 'painted'} ${s} in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  await p.close();
}
await b.close();
