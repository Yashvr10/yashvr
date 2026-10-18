// node test-particles.mjs [scene] [first] [last] [limit]
// Evaluates the scene's alphas(t) (every Canvas2D particle, as drawn) for scene frames
// first..last and reports any particle whose alpha changes by more than limit between
// consecutive frames. Default: s04_particles, frames 0..180, limit 0.2.
import { serve, launch, openPage } from './browser.mjs';

const [scene = 's04_particles', first = 0, last = 180, limit = 0.2] = process.argv.slice(2)
  .map((a, i) => (i ? Number(a) : a));

const server = serve();
const browser = await launch();
const page = await openPage(browser);
const r = await page.evaluate(async (scene, first, last, limit) => {
  const m = await import(`${location.origin}/scenes/${scene}.js`), FPS = window.FPS;
  let prev = m.alphas(first / FPS), worst = { d: 0 }, peak = 0;
  const jumps = [];
  for (let f = first + 1; f <= last; f++) {
    const cur = m.alphas(Math.min(f, m.dur * FPS - 1e-6 * FPS) / FPS);
    cur.forEach((a, i) => {
      const d = Math.abs(a - prev[i]);
      peak = Math.max(peak, a);
      if (d > worst.d) worst = { d, i, f, from: prev[i], to: a };
      if (d > limit) jumps.push({ i, f, from: prev[i], to: a });
    });
    prev = cur;
  }
  return { count: prev.length, worst, jumps, peak };
}, scene, first, last, limit);

console.log(`${scene}: ${r.count} particles, frames ${first}..${last}, peak alpha ${r.peak.toFixed(3)}`);
console.log(`largest step: ${r.worst.d.toFixed(4)} (particle ${r.worst.i}, frame ${r.worst.f - 1}→${r.worst.f}, ${r.worst.from?.toFixed(3)} → ${r.worst.to?.toFixed(3)})`);
for (const j of r.jumps.slice(0, 20)) console.log(`  jump: particle ${j.i} frame ${j.f - 1}→${j.f}: ${j.from.toFixed(3)} → ${j.to.toFixed(3)}`);
console.log(r.jumps.length ? `FAIL: ${r.jumps.length} steps over ${limit}` : `PASS: no step over ${limit}`);
await browser.close();
server.close();
process.exit(r.jumps.length ? 1 : 0);
