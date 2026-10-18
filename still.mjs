// Usage: node still.mjs 0.4 1.2 2.5  → qa/t0.40.png, qa/t1.20.png, ...
import { mkdir, writeFile } from 'node:fs/promises';
import { serve, launch, openPage, grab } from './browser.mjs';

const times = process.argv.slice(2).map(Number);
await mkdir('qa', { recursive: true });
const server = serve();
const browser = await launch();
const page = await openPage(browser);
for (const t of times) {
  await writeFile(`qa/t${t.toFixed(2)}.png`, await grab(page, t));
  console.log(`qa/t${t.toFixed(2)}.png`);
}
await browser.close();
server.close();
