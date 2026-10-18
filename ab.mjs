// Post off vs on: node ab.mjs 1 3 → qa/ab_off_1.00.png, qa/ab_on_1.00.png, ... and qa/post_ab.png
// (one row per time, off on the left).
import { mkdir, writeFile } from 'node:fs/promises';
import { serve, launch, openPage, grab, contactSheet } from './browser.mjs';

const times = process.argv.slice(2).map(Number);
const server = serve();
const browser = await launch();
const pages = { off: await openPage(browser, 'nopost'), on: await openPage(browser) };
await mkdir('qa', { recursive: true });

const shots = [];
for (const t of times) {
  for (const mode of ['off', 'on']) {
    const file = `qa/ab_${mode}_${t.toFixed(2)}.png`;
    await writeFile(file, await grab(pages[mode], t));
    shots.push({ file, label: `t = ${t.toFixed(2)} s · post ${mode}` });
  }
}
await writeFile('qa/post_ab.png', await contactSheet(browser, shots, { cols: 2, tw: 960, th: 540 }));
console.log(`qa/post_ab.png (${shots.length} stills)`);

await browser.close();
server.close();
