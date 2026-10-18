// node sheet.mjs [scene…] [--aspect 9x16|16x9]: the contact-sheet tool. For each scene (default:
// every scene in timeline.js) it renders the scene alone at its key moments, read from its
// captions: the middle of the first entrance, the first settle, the middle of each hold, the end
// of the last hold, and the middle of the exit. Writes qa/sheet_<scene>[_16x9].png per scene and
// prints each still's contrast check.
import { mkdir, writeFile } from 'node:fs/promises';
import { serve, launch, openPage, grab, contactSheet } from './browser.mjs';

const argv = process.argv.slice(2), ai = argv.indexOf('--aspect');
const aspect = ai >= 0 ? argv[ai + 1] : '9x16';
const named = argv.filter((a, i) => !a.startsWith('--') && !(ai >= 0 && i === ai + 1));
const server = serve();
const browser = await launch();
const probe = await openPage(browser, `aspect=${aspect}`);
const scenes = named.length ? named : await probe.evaluate(async () => Object.keys((await import(`${location.origin}/timeline.js`)).SCENES));
await probe.close();
await mkdir('qa/sheet', { recursive: true });
const vertical = aspect !== '16x9', suffix = vertical ? '' : '_16x9';

for (const id of scenes) {
  const page = await openPage(browser, `solo=${id}&aspect=${aspect}&check`);
  const { caps, end, dur } = await page.evaluate(async (id) => {
    const m = await import(`${location.origin}/scenes/${id}.js`);
    return { caps: window.CAPTIONS, end: m.end, dur: m.dur };
  }, id);
  const first = caps.reduce((a, c) => (c.in < a.in ? c : a), caps[0] ?? { in: 0, at: 0 });
  const moments = [
    ['entrance', (first.in + first.at) / 2], ['settled', first.at],
    ...caps.map((c, k) => [`hold ${k + 1}`, (c.at + c.out) / 2]),
    ['hold end', end - 1 / 30], ['exit', (end + dur) / 2],
  ].map(([name, t]) => [name, Math.round(t * 30) / 30]);
  const shots = [];
  for (const [name, t] of moments) {
    const file = `qa/sheet/${id}${suffix}_${t.toFixed(2)}.png`;
    await writeFile(file, await grab(page, t));
    const checks = await page.evaluate(() => (window.COPY_CHECKS ?? []).map((b) => `${b.text.replace(/\n/g, ' / ')} ${b.ratio ? b.ratio.toFixed(1) : '–'}:1`));
    shots.push({ file, label: `${name} · ${t.toFixed(2)}s` });
    console.log(`${id} ${name.padEnd(9)} ${t.toFixed(2)}s  ${checks.join(' | ')}`);
  }
  await page.close();
  const out = `qa/sheet_${id}${suffix}.png`;
  await writeFile(out, await contactSheet(browser, shots, vertical ? { cols: shots.length, tw: 270, th: 480 } : { cols: 4, tw: 480, th: 270 }));
  console.log(out);
}
await browser.close();
server.close();
