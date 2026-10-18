// node time.mjs <scene> [every]: times every Nth frame of a scene, split into renderFrame
// itself and the PNG readback + encode that render.mjs adds. Timing happens outside
// renderFrame, so it never reads the clock.
import { serve, launch, openPage } from './browser.mjs';

const [scene = 's01_hook', every = 1] = process.argv.slice(2).map((a, i) => (i ? Number(a) : a));
const server = serve();
const browser = await launch();
const page = await openPage(browser, `solo=${scene}`);
const r = await page.evaluate(async (scene, every) => {
  const m = await import(`${location.origin}/scenes/${scene}.js`), FPS = window.FPS, c = document.getElementById('c');
  const frames = [], render = [], encode = [];
  for (let f = 0; f < m.dur * FPS; f += every) frames.push(f);
  window.renderFrame(0); // warm-up: first-use costs are not per-frame costs
  for (const f of frames) {
    const t0 = performance.now();
    window.renderFrame(f / FPS);
    const t1 = performance.now();
    c.toDataURL('image/png');
    render.push(t1 - t0);
    encode.push(performance.now() - t1);
  }
  const stat = (a) => {
    const s = [...a].sort((x, y) => x - y);
    return { mean: a.reduce((x, y) => x + y, 0) / a.length, p50: s[s.length >> 1], max: s.at(-1) };
  };
  return { n: frames.length, render: stat(render), encode: stat(encode) };
}, scene, every);
const fmt = (s) => `mean ${s.mean.toFixed(0)} ms, median ${s.p50.toFixed(0)} ms, max ${s.max.toFixed(0)} ms`;
console.log(`${scene}: ${r.n} frames`);
console.log(`  renderFrame:      ${fmt(r.render)}`);
console.log(`  PNG readback:     ${fmt(r.encode)}`);
console.log(`  total per frame:  ${(r.render.mean + r.encode.mean).toFixed(0)} ms`);
await browser.close();
server.close();
