import { readdir, rm, writeFile } from 'node:fs/promises';
import { serve, launch, openPage, grab } from './browser.mjs';

const server = serve();
const browser = await launch();
const page = await openPage(browser);
const { DURATION, FPS } = await page.evaluate(() => ({ DURATION: window.DURATION, FPS: window.FPS }));

for (const f of await readdir('frames')) if (f.endsWith('.png')) await rm(`frames/${f}`);
const n = Math.round(DURATION * FPS);
for (let i = 0; i < n; i++) {
  await writeFile(`frames/f${String(i).padStart(5, '0')}.png`, await grab(page, i / FPS));
}
console.log(`wrote ${n} frames to frames/`);

await browser.close();
server.close();
