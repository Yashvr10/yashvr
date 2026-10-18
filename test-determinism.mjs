// node test-determinism.mjs [frames...] [--scene s04_particles]
// Each frame is rendered alone in a fresh page, then again by one page that renders every frame
// from 0 up to the last target in order; the SHA-256 hashes must match. With --scene, that
// scene plays alone (?solo=) and frames count from its local time 0. Default: frame 150 of
// the whole timeline.
import { createHash } from 'node:crypto';
import { serve, launch, openPage, grab } from './browser.mjs';

const args = process.argv.slice(2), at = args.indexOf('--scene');
const scene = at >= 0 ? args.splice(at, 2)[1] : null;
const wanted = args.length ? args.map(Number) : [150];
const sha = (buf) => createHash('sha256').update(buf).digest('hex');

const server = serve();
const browser = await launch();
let ok = true;
try {
  const query = scene ? `solo=${scene}` : '';
  const probe = await openPage(browser, query);
  const { DURATION, FPS } = await probe.evaluate(() => ({ DURATION: window.DURATION, FPS: window.FPS }));
  const last = Math.round(DURATION * FPS) - 1;
  const frames = wanted.map((f) => Math.min(f, last));

  const cold = [];
  for (const f of frames) cold.push(sha(await grab(await openPage(browser, query), f / FPS)));

  const warm = await openPage(browser, query), seen = new Map();
  for (let i = 0; i <= Math.max(...frames); i++) {
    const png = await grab(warm, i / FPS);
    if (frames.includes(i)) seen.set(i, sha(png));
  }

  frames.forEach((f, k) => {
    const same = cold[k] === seen.get(f);
    ok &&= same;
    console.log(`frame ${f}${scene ? ` of ${scene}` : ''}: alone ${cold[k].slice(0, 16)}  in sequence ${seen.get(f).slice(0, 16)}  ${same ? 'same' : 'DIFFERENT'}`);
  });
} catch (e) {
  ok = false;
  console.error(e.message);
}
console.log(ok ? 'PASS' : 'FAIL');
await browser.close();
server.close();
process.exit(ok ? 0 : 1);
