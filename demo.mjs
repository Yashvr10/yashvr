// node demo.mjs [name…]: renders each engine demo (demos/<name>.js, at its exported time T) to
// qa/demo_<name>.png, tiles them into qa/demo_sheet.png, and fails if any engine module is
// 300 lines or longer.
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { serve, launch, openPage, grab, contactSheet } from './browser.mjs';

const names = process.argv.slice(2).length ? process.argv.slice(2)
  : (await readdir('demos')).filter((f) => f.endsWith('.js') && !f.startsWith('_')).map((f) => f.slice(0, -3)).sort();
await mkdir('qa', { recursive: true });
const server = serve();
const browser = await launch();
const shots = [];
for (const name of names) {
  const page = await openPage(browser, `demo=${name}`);
  const T = await page.evaluate(async (n) => (await import(`${location.origin}/demos/${n}.js`)).T ?? 0, name);
  const file = `qa/demo_${name}.png`;
  await writeFile(file, await grab(page, T));
  shots.push({ file, label: name });
  console.log(file);
  await page.close();
}
await writeFile('qa/demo_sheet.png', await contactSheet(browser, shots, { cols: 6, tw: 270, th: 480 }));
await browser.close();
server.close();

let over = 0;
for (const f of (await readdir('engine')).filter((f) => f.endsWith('.js')).sort()) {
  const n = (await readFile(`engine/${f}`, 'utf8')).split('\n').length - 1;
  if (n >= 300) over++;
  console.log(`${n >= 300 ? 'OVER' : 'ok  '} ${String(n).padStart(4)}  engine/${f}`);
}
if (over) { console.error(`${over} engine module(s) at 300 lines or more`); process.exit(1); }
