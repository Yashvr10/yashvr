// node qa-aspects.mjs: renders every scene alone in 16:9 and 9:16, one still per caption at the
// middle of its hold, into qa/aspects/, and writes the text boxes and safe rects of each to
// qa/aspects/report.json. Then `python3 qa-sheet.py` draws the two contact sheets.
// Prints every text box that crosses a safe line: the layout margins (tokens.safe), title-safe,
// and in 9:16 the caption band.
import { mkdir, writeFile } from 'node:fs/promises';
import { serve, launch, openPage, grab } from './browser.mjs';

const server = serve();
const browser = await launch();
// Every scene registered in timeline.js.
const probe = await openPage(browser, '');
const SCENES = await probe.evaluate(async () => Object.keys((await import(`${location.origin}/timeline.js`)).SCENES));
await probe.close();
await mkdir('qa/aspects', { recursive: true });
const report = {};
for (const aspect of ['16x9', '9x16']) {
  const shots = [];
  let rects;
  for (const id of SCENES) {
    const page = await openPage(browser, `check&aspect=${aspect}&solo=${id}`);
    const info = await page.evaluate(async () => {
      const t = await import(`${location.origin}/tokens.js`);
      const s = t.safe;
      return {
        caps: window.CAPTIONS, W: t.W, H: t.H,
        rects: { margins: { x: s.x, y: s.top, w: t.W - 2 * s.x, h: t.H - s.top - s.bottom }, titleSafe: t.titleSafe, captionBand: t.captionBand },
      };
    });
    rects = info.rects;
    for (const [k, c] of info.caps.entries()) {
      const t = Math.round(((c.at + c.out) / 2) * 30) / 30, file = `qa/aspects/${aspect}_${id}_${k + 1}.png`;
      await writeFile(file, await grab(page, t));
      const boxes = await page.evaluate(() => window.COPY_CHECKS.map(({ x0, y0, x1, y1, text, ratio }) => ({ x0, y0, x1, y1, text, ratio })));
      shots.push({ file, scene: id, t, boxes });
    }
    await page.close();
  }
  report[aspect] = { rects, shots };
}
await browser.close();
server.close();
await writeFile('qa/aspects/report.json', JSON.stringify(report, null, 1));

// Crossings: how far each box pokes past each edge of each rect (px, rounded).
const past = (b, r) => ({
  left: r.x - b.x0, right: b.x1 - (r.x + r.w), top: r.y - b.y0, bottom: b.y1 - (r.y + r.h),
});
let n = 0;
for (const [aspect, { rects, shots }] of Object.entries(report)) {
  console.log(`\n${aspect}`);
  const seen = new Set();
  for (const s of shots) {
    for (const b of s.boxes) {
      for (const [name, r] of Object.entries(rects)) {
        if (!r) continue;
        const over = Object.entries(past(b, r)).filter(([, v]) => v > 0.5).map(([e, v]) => `${e} +${Math.round(v)}px`);
        const key = `${s.scene}|${b.text}|${name}|${over.join()}`;
        if (!over.length || seen.has(key)) continue;
        seen.add(key);
        n++;
        console.log(`  ${s.scene.padEnd(14)} t=${s.t.toFixed(2).padStart(5)}  "${b.text}" crosses ${name}: ${over.join(', ')}`);
      }
    }
  }
}
console.log(n ? `\n${n} crossing(s)` : '\nno text crosses a safe line');
