// node qa-captions.mjs: renders one still per caption at the middle of its hold into
// qa/captions/, tiles them into qa/captions.png, and flags any caption line below 7:1 contrast
// or outside tokens.safe16x9 (and reports which also leave the 9:16 crop's title-safe).
import { mkdir, writeFile } from 'node:fs/promises';
import { serve, launch, openPage, grab, contactSheet } from './browser.mjs';

const server = serve();
const browser = await launch();
const page = await openPage(browser, 'check');
const { caps, safe16x9, safe9x16 } = await page.evaluate(async () => {
  const t = await import(`${location.origin}/tokens.js`);
  return { caps: window.CAPTIONS, safe16x9: t.safe16x9, safe9x16: t.safe9x16 };
});
const inside = (b, s) => b.x0 >= s.x && b.y0 >= s.y && b.x1 <= s.x + s.w && b.y1 <= s.y + s.h;

await mkdir('qa/captions', { recursive: true });
const shots = [], rows = [];
for (const [k, c] of caps.entries()) {
  const t = (c.at + c.out) / 2, file = `qa/captions/${String(k + 1).padStart(2, '0')}_${c.scene}.png`;
  await writeFile(file, await grab(page, t));
  const wanted = c.text.split('\n');
  const boxes = (await page.evaluate(() => window.COPY_CHECKS)).filter((b) => wanted.includes(b.text));
  // One row per caption line: the lowest-contrast box drawn for it this frame.
  for (const line of wanted) {
    const mine = boxes.filter((b) => b.text === line);
    if (!mine.length) { rows.push({ k: k + 1, t, line, ratio: null, s169: null, s916: null }); continue; }
    const b = mine.reduce((p, q) => ((q.ratio ?? 99) < (p.ratio ?? 99) ? q : p));
    rows.push({ k: k + 1, t, line, ratio: b.ratio, s169: mine.every((m) => inside(m, safe16x9)), s916: mine.every((m) => inside(m, safe9x16)) });
  }
  shots.push({ file, label: `${k + 1} · ${c.scene} · ${t.toFixed(2)}s` });
}
await writeFile('qa/captions.png', await contactSheet(browser, shots, { cols: 4, tw: 480, th: 270 }));
await browser.close();
server.close();

let fails = 0;
console.log('#  t(s)    contrast  16:9 safe  9:16 safe  line');
for (const r of rows) {
  const bad = r.ratio === null || r.ratio < 7 || !r.s169;
  fails += bad;
  console.log(`${String(r.k).padStart(2)} ${r.t.toFixed(2).padStart(6)}  ${r.ratio === null ? '  n/a  ' : `${r.ratio.toFixed(1).padStart(5)}:1`}  ${r.s169 ? 'inside   ' : r.s169 === null ? 'n/a      ' : 'CROSSES  '}  ${r.s916 ? 'inside   ' : r.s916 === null ? 'n/a      ' : 'crosses  '}  ${bad ? 'FLAG ' : '     '}${r.line}`);
}
console.log(fails ? `${fails} caption line(s) flagged` : 'no caption line flagged');
