import { createHash } from 'node:crypto';
import { serve, launch, openPage, grab } from './browser.mjs';

const FRAME = 150;
const sha = (buf) => createHash('sha256').update(buf).digest('hex');

const server = serve();
const browser = await launch();
let ok = false;
try {
  const cold = await openPage(browser);
  const { DURATION, FPS } = await cold.evaluate(() => ({ DURATION: window.DURATION, FPS: window.FPS }));
  if (FRAME >= DURATION * FPS) throw new Error(`frame ${FRAME} is past the end (${DURATION * FPS} frames)`);
  const a = sha(await grab(cold, FRAME / FPS));

  const warm = await openPage(browser);
  let png;
  for (let i = 0; i <= FRAME; i++) png = await grab(warm, i / FPS);
  const b = sha(png);

  console.log(`frame ${FRAME} alone:    ${a}\nframe ${FRAME} after 0..${FRAME - 1}: ${b}`);
  ok = a === b;
} catch (e) {
  console.error(e.message);
}
console.log(ok ? 'PASS' : 'FAIL');
await browser.close();
server.close();
process.exit(ok ? 0 : 1);
