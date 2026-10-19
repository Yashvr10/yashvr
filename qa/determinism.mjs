// node qa/determinism.mjs [frames…] [--aspect 16x9]   (default frames: 0, 45, 150, last)
// Renders each frame three ways and compares SHA-256 hashes of the PNG the canvas produces:
//   cold     a fresh browser context per frame (nothing rendered before it)
//   order    one page, frames ascending
//   reverse  one page, frames descending
// plus `repeat` (the same frame twice in a row on the order page). Any mismatch fails (exit 1) and
// is reported with its likely cause. Every render runs under grab()'s banned-call guard.
import { createHash } from 'node:crypto';
import { serve, launch, openPage, grab } from '../browser.mjs';

const argv = process.argv.slice(2), ai = argv.indexOf('--aspect');
const query = ai >= 0 ? `aspect=${argv[ai + 1]}` : '';
const asked = argv.filter((a, i) => !a.startsWith('--') && !(ai >= 0 && i === ai + 1)).map(Number);
const sha = (buf) => createHash('sha256').update(buf).digest('hex').slice(0, 16);

const server = serve();
const browser = await launch();
const probe = await openPage(browser, query);
const { FPS, DURATION } = await probe.evaluate(() => ({ FPS: window.FPS, DURATION: window.DURATION }));
const last = Math.round(DURATION * FPS) - 1;
const frames = [...new Set((asked.length ? asked : [0, 45, 150, last]).map((f) => Math.min(f, last)))].sort((a, b) => a - b);
await probe.close();

const hashes = Object.fromEntries(frames.map((f) => [f, {}]));
for (const f of frames) { // cold
  const page = await openPage(browser, query);
  hashes[f].cold = sha(await grab(page, f / FPS));
  await page.close();
}
const order = await openPage(browser, query);
for (const f of frames) {
  hashes[f].order = sha(await grab(order, f / FPS));
  hashes[f].repeat = sha(await grab(order, f / FPS));
}
await order.close();
const reverse = await openPage(browser, query);
for (const f of [...frames].reverse()) hashes[f].reverse = sha(await grab(reverse, f / FPS));
await reverse.close();
await browser.close();
server.close();

// Which pair differs says where the state lives.
const cause = (h) => {
  if (h.order !== h.repeat) return 'same frame twice differs: state mutated by rendering (a cache or counter advanced inside renderFrame)';
  if (h.cold !== h.order && h.order === h.reverse) return 'only the cold render differs: something not ready at READY (a font, texture or async load) or a lazy first-use init';
  if (h.order !== h.reverse) return 'order matters: state carried between frames (module-level variables, a sim/cache keyed on history, transforms not reset)';
  return 'differs';
};
let bad = 0;
console.log(`frames ${frames.join(', ')} of 0..${last} (${query || 'aspect 9x16'})`);
for (const f of frames) {
  const h = hashes[f], same = h.cold === h.order && h.order === h.reverse && h.order === h.repeat;
  if (!same) bad++;
  console.log(`frame ${String(f).padStart(4)}  cold ${h.cold}  order ${h.order}  reverse ${h.reverse}  repeat ${h.repeat}  ${same ? 'same' : `MISMATCH: ${cause(h)}`}`);
}
console.log(bad ? `FAIL: ${bad} frame(s) differ` : 'PASS');
process.exit(bad ? 1 : 0);
