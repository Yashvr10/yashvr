// node test-determinism.mjs [frames...] [--scene s04_particles]
// Each frame is rendered alone in a fresh page, then again by one page that renders every frame
// from 0 up to the last target in order; the SHA-256 hashes must match. With --scene, frame
// numbers count from that scene's start. Default: frame 150 of the whole timeline.
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
  const probe = await openPage(browser);
  const { DURATION, FPS, offset } = await probe.evaluate(async (scene) => ({
    DURATION: window.DURATION, FPS: window.FPS,
    offset: scene ? (await import(`${location.origin}/scenes/${scene}.js`)).start : 0,
  }), scene);
  const last = Math.round(DURATION * FPS) - 1;
  const frames = wanted.map((f) => Math.min(Math.round(offset * FPS) + f, last));

  const cold = [];
  for (const f of frames) cold.push(sha(await grab(await openPage(browser), f / FPS)));

  const warm = await openPage(browser), seen = new Map();
  for (let i = 0; i <= Math.max(...frames); i++) {
    const png = await grab(warm, i / FPS);
    if (frames.includes(i)) seen.set(i, sha(png));
  }

  frames.forEach((f, k) => {
    const same = cold[k] === seen.get(f);
    ok &&= same;
    console.log(`frame ${f}${scene ? ` (${scene} +${wanted[k]})` : ''}: alone ${cold[k].slice(0, 16)}  in sequence ${seen.get(f).slice(0, 16)}  ${same ? 'same' : 'DIFFERENT'}`);
  });
} catch (e) {
  ok = false;
  console.error(e.message);
}
console.log(ok ? 'PASS' : 'FAIL');
await browser.close();
server.close();
process.exit(ok ? 0 : 1);
