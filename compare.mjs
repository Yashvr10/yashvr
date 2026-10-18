// node compare.mjs <scene> [exemplar] [--aspect 9x16|16x9]: renders the scene and an exemplar
// (default s01_hook) alone at the same three moments of each, read from their captions: the middle
// of the first entrance, the middle of the first hold, and the middle of the exit. Writes
// qa/<sNN>_vs_exemplar.png: the scene on the top row, the exemplar under it.
import { mkdir, writeFile } from 'node:fs/promises';
import { serve, launch, openPage, grab, contactSheet } from './browser.mjs';

const argv = process.argv.slice(2), ai = argv.indexOf('--aspect');
const aspect = ai >= 0 ? argv[ai + 1] : '9x16';
const [scene, exemplar = 's01_hook'] = argv.filter((a, i) => !a.startsWith('--') && !(ai >= 0 && i === ai + 1));
if (!scene) { console.error('usage: node compare.mjs <scene> [exemplar] [--aspect 9x16|16x9]'); process.exit(2); }
const server = serve();
const browser = await launch();
await mkdir('qa/compare', { recursive: true });
const shots = [];
for (const id of [scene, exemplar]) {
  const page = await openPage(browser, `solo=${id}&aspect=${aspect}`);
  const { caps, end, dur } = await page.evaluate(async (id) => {
    const m = await import(`${location.origin}/scenes/${id}.js`);
    return { caps: window.CAPTIONS, end: m.end, dur: m.dur };
  }, id);
  const c = caps[0] ?? { in: 0, at: Math.min(0.5, end), out: end };
  for (const [name, t] of [['entrance', (c.in + c.at) / 2], ['hold', (c.at + c.out) / 2], ['exit', (end + dur) / 2]]) {
    const tt = Math.round(t * 30) / 30, file = `qa/compare/${id}_${aspect}_${name}.png`;
    await writeFile(file, await grab(page, tt));
    shots.push({ file, label: `${id.split("_")[0]} ${name} ${tt.toFixed(2)}s` });
  }
  await page.close();
}
const out = `qa/${scene.split('_')[0]}_vs_exemplar${aspect === '16x9' ? '_16x9' : ''}.png`;
await writeFile(out, await contactSheet(browser, shots, aspect === '16x9' ? { cols: 3, tw: 480, th: 270 } : { cols: 3, tw: 270, th: 480 }));
console.log(out);
await browser.close();
server.close();
