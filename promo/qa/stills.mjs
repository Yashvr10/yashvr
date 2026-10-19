// node qa/stills.mjs [--aspect 9x16] [--ss N]
// Review stills for the whole edit: one at the middle of every caption's hold (from the page's
// CAPTIONS, global time) with its contrast checks, and one frame per whole second (0 … 29) tiled
// into a contact sheet. Writes qa/stills/<aspect>/hold_<scene>_<k>.png, qa/stills/<aspect>/s<NN>.png
// and qa/sheet_<aspect>.png; prints one line per still.
import { mkdir, writeFile } from 'node:fs/promises';
import { serve, launch, openPage, grab, contactSheet } from '../browser.mjs';

const argv = process.argv.slice(2), flag = (k) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : undefined);
const aspect = flag('aspect') ?? '16x9', ss = flag('ss') ?? '1', dir = `qa/stills/${aspect}`;
await mkdir(dir, { recursive: true });
const server = serve();
const browser = await launch();
const page = await openPage(browser, `aspect=${aspect}&ss=${ss}&check`);
const { caps, D, FPS } = await page.evaluate(() => ({ caps: window.CAPTIONS, D: window.DURATION, FPS: window.FPS }));
const snap = (t) => Math.round(t * FPS) / FPS;
const checks = () => page.evaluate(() => (window.COPY_CHECKS ?? []).map((b) => `"${b.text.replace(/\n/g, ' / ')}" ${b.ratio ? b.ratio.toFixed(1) : '–'}:1`));

const seen = {};
for (const c of caps) {
  const k = (seen[c.scene] = (seen[c.scene] ?? 0) + 1), t = snap((c.at + c.out) / 2);
  const file = `${dir}/hold_${c.scene}_${k}.png`;
  const t0 = performance.now();
  await writeFile(file, await grab(page, t));
  console.log(`hold ${c.scene} ${k} t ${t.toFixed(3)} (${((performance.now() - t0) / 1000).toFixed(2)} s)  ${(await checks()).join(' | ')}`);
}
const shots = [];
for (let s = 0; s < Math.round(D); s++) {
  const file = `${dir}/s${String(s).padStart(2, '0')}.png`;
  await writeFile(file, await grab(page, s));
  shots.push({ file, label: `${s} s` });
}
await page.close();
const vertical = aspect === '9x16';
await writeFile(`qa/sheet_${aspect}.png`, await contactSheet(browser, shots, vertical ? { cols: 10, tw: 216, th: 384 } : { cols: 6, tw: 384, th: 216 }));
console.log(`qa/sheet_${aspect}.png`);
await browser.close();
server.close();
