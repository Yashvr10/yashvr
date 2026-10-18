// Renders s02 stills at the middle of every entrance, hold and exit into qa/, then tiles
// those PNGs into qa/type_sheet.png.
import { mkdir, writeFile } from 'node:fs/promises';
import { serve, launch, openPage, grab, contactSheet } from './browser.mjs';

const server = serve();
const browser = await launch();
// s02 alone from its local time 0, so its beat times are frame times.
const page = await openPage(browser, 'solo=s02_type_demo'), start = 0;
const { BEATS } = await page.evaluate(() => import(`${location.origin}/scenes/s02_type_demo.js`)
  .then((m) => ({ BEATS: m.BEATS })));

const shots = BEATS.flatMap((b) => ['enter', 'hold', 'exit'].filter((k) => b[k]).map((k) => {
  const t = (b[k][0] + b[k][1]) / 2;
  return { label: `${b.move} · ${k} · ${t.toFixed(2)}s`, file: `qa/s02_${(start + t).toFixed(2)}.png`, t: start + t };
}));
await mkdir('qa', { recursive: true });
for (const s of shots) await writeFile(s.file, await grab(page, s.t));

await writeFile('qa/type_sheet.png', await contactSheet(browser, shots));
console.log(`qa/type_sheet.png (${shots.length} stills)`);

await browser.close();
server.close();
