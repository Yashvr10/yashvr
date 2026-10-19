// node qa/frames-check.mjs [--frames DIR]   Blank- or repeated-frame causes. Checks:
//   fonts     every (font, glyph) a scene draws (recorded by wrapping fillText over each scene's
//             frames) is a face READY waited for (tokens.fontLoads) and really comes from that face,
//             not a fallback (pixels differ from the same glyph in a font that doesn't exist)
//   assets    no <img>, <video> or image fetches anywhere (all pieces are drawn), shaders compiled
//   buffer    the WebGL context has preserveDrawingBuffer (toDataURL after the frame isn't blank)
//   harness   capture awaits renderFrame (an async renderFrame's drawing is in the grab) and the
//             banned-call guard throws on Math.random, Date.now, new Date, performance.now,
//             setTimeout, setInterval and requestAnimationFrame; render.mjs and browser.mjs both use it
//   frames    no run of 5+ identical file sizes, and no two consecutive byte-identical frames, in DIR
import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import { serve, launch, openPage, grab } from '../browser.mjs';

const argv = process.argv.slice(2), DIR = argv.includes('--frames') ? argv[argv.indexOf('--frames') + 1] : 'frames';
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok }); console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(9)} ${detail}`); };

const server = serve();
const browser = await launch();

// fonts: record every fillText per scene, then test each glyph against a missing-font fallback.
{
  const page = await openPage(browser, '');
  const used = await page.evaluate(async () => {
    const { main } = await import(`${location.origin}/timeline.js`), seen = new Map();
    for (const P of [CanvasRenderingContext2D.prototype, OffscreenCanvasRenderingContext2D.prototype]) {
      const orig = P.fillText;
      P.fillText = function (text, ...rest) {
        const key = this.font;
        if (!seen.has(key)) seen.set(key, new Set());
        for (const ch of String(text)) seen.get(key).add(ch);
        return orig.call(this, text, ...rest);
      };
    }
    const n = Math.round(main.DURATION * window.FPS);
    for (let f = 0; f < n; f += 3) window.renderFrame(f / window.FPS);
    return [...seen].map(([font, chars]) => [font, [...chars].join('')]);
  });
  const report = await page.evaluate(async (used) => {
    const { fontLoads } = await import(`${location.origin}/tokens.js`);
    // Chrome serialises ctx.font as [style] [variant] [weight] <size>px <family>: weight 400 is
    // dropped, 700 is written "bold", single-word family names lose their quotes.
    const parse = (font) => {
      const m = font.match(/^(?:(italic|oblique)\s+)?(?:small-caps\s+)?(?:(normal|bold|bolder|lighter|\d{3})\s+)?[\d.]+px\s+(.+)$/);
      const w = !m?.[2] || m[2] === 'normal' ? '400' : m[2] === 'bold' ? '700' : m[2];
      return { weight: w, family: m?.[3].replace(/^["']|["']$/g, '') };
    };
    const px = (weight, family, ch) => {
      const c = new OffscreenCanvas(160, 160).getContext('2d', { willReadFrequently: true });
      c.font = `${weight} 100px "${family}"`;
      c.fillText(ch, 20, 120);
      return c.getImageData(0, 0, 160, 160).data.join(',');
    };
    const loads = fontLoads.map((l) => { const m = l.match(/^(\d{3}) [^ ]+ "?([^"]+)"?$/); return `${m[1]} ${m[2]}`; });
    return used.map(([font, chars]) => {
      const { weight, family } = parse(font), face = `${weight} ${family}`;
      const missing = [...chars].filter((ch) => ch.trim() && px(weight, family, ch) === px(weight, 'NoSuchFont123', ch));
      return { face, font, waited: loads.includes(face), loaded: document.fonts.check(`${weight} 20px "${family}"`, chars), chars, missing };
    });
  }, used);
  for (const r of report) {
    check('fonts', r.waited && r.loaded && !r.missing.length,
      `${r.face} (as ${r.font}): ${r.chars.length} glyphs; READY waits for it: ${r.waited}; loaded: ${r.loaded}; missing from the face: ${r.missing.length ? JSON.stringify(r.missing.join('')) : 'none'}`);
  }
  // assets + buffer
  const assets = await page.evaluate(() => ({
    imgs: document.querySelectorAll('img, video, picture').length,
    fetched: performance.getEntriesByType('resource').map((e) => e.name.split('/').pop()).filter((n) => /\.(png|jpe?g|webp|gif|mp4|webm)$/.test(n)),
    preserve: document.getElementById('c').getContext('webgl2').getContextAttributes().preserveDrawingBuffer,
  }));
  check('assets', !assets.imgs && !assets.fetched.length, `${assets.imgs} img/video elements, image fetches: ${assets.fetched.length ? assets.fetched.join(' ') : 'none'}; shaders compile before READY (a failure is a page error)`);
  check('buffer', assets.preserve === true, `preserveDrawingBuffer: ${assets.preserve}`);
  await page.close();
}

// harness: does grab await an async renderFrame, and does the guard catch each banned call?
{
  const page = await openPage(browser, '');
  const sync = createHash('sha256').update(await grab(page, 1)).digest('hex');
  await grab(page, 2); // leave a different frame on the canvas
  await page.evaluate(() => {
    const orig = window.renderFrame;
    // Microtask awaits only (setTimeout is itself banned): if grab doesn't await, toDataURL runs
    // before these resolve and captures the stale frame 2.
    window.renderFrame = async (t) => { for (let i = 0; i < 3; i++) await Promise.resolve(); orig(t); };
  });
  let awaited;
  try { awaited = createHash('sha256').update(await grab(page, 1)).digest('hex') === sync; } catch (e) { awaited = false; }
  check('harness', awaited, `grab() captures what an async renderFrame drew after an await: ${awaited}`);
  await page.close();
  const calls = { 'Math.random': 'Math.random()', 'Date.now': 'Date.now()', 'new Date': 'new Date()', 'performance.now': 'performance.now()',
    setTimeout: 'setTimeout(() => 0)', setInterval: 'setInterval(() => 0)', requestAnimationFrame: 'requestAnimationFrame(() => 0)' };
  const caught = [];
  for (const [name, code] of Object.entries(calls)) {
    const p = await openPage(browser, '');
    await p.evaluate((code) => { window.renderFrame = new Function('t', code); }, code);
    try { await grab(p, 0); } catch { caught.push(name); }
    await p.close();
  }
  const missed = Object.keys(calls).filter((n) => !caught.includes(n));
  check('harness', !missed.length, `guard throws on: ${caught.join(', ') || 'nothing'}${missed.length ? `; MISSES ${missed.join(', ')}` : ''}`);
  const [render, helper] = await Promise.all([readFile('render.mjs', 'utf8'), readFile('browser.mjs', 'utf8')]);
  const guarded = (src) => /renderChecked\(/.test(src);
  check('harness', guarded(render) && guarded(helper), `render.mjs capture guarded: ${guarded(render)}; browser.mjs grab guarded: ${guarded(helper)}`);
}
await browser.close();
server.close();

// frames: runs of identical sizes and byte-identical neighbours.
{
  const files = (await readdir(DIR)).filter((f) => /^f\d{5}\.png$/.test(f)).sort();
  const sizes = await Promise.all(files.map(async (f) => (await stat(`${DIR}/${f}`)).size));
  const runs = [];
  for (let i = 0, j; i < sizes.length; i = j) {
    for (j = i + 1; j < sizes.length && sizes[j] === sizes[i]; j++);
    if (j - i >= 5) runs.push(`${files[i]}–${files[j - 1]} (${j - i} × ${sizes[i]} B)`);
  }
  const hashes = await Promise.all(files.map(async (f) => createHash('sha256').update(await readFile(`${DIR}/${f}`)).digest('hex')));
  const repeats = hashes.map((h, i) => (i && h === hashes[i - 1] ? files[i] : null)).filter(Boolean);
  check('frames', !runs.length && !repeats.length, `${files.length} frames in ${DIR}/; runs of 5+ equal sizes: ${runs.length ? runs.join('; ') : 'none'}; byte-identical neighbours: ${repeats.length ? repeats.join(' ') : 'none'}`);
}
const bad = results.filter((r) => !r.ok).length;
console.log(bad ? `FAIL: ${bad} check(s)` : 'PASS');
process.exit(bad ? 1 : 0);
