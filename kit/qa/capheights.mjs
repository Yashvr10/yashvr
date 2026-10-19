// node qa/capheights.mjs: measures cap height (em) of each face in Chrome: ascent of "H" / size.
import { serve, launch } from '../browser.mjs';
const server = serve();
const browser = await launch();
const page = await browser.newPage();
await page.goto(`http://localhost:${process.env.PORT ?? 8080}/qa/`);
const out = await page.evaluate(async () => {
  const faces = [['Anton', 400, 'fonts/Anton-400.ttf'], ['Inter Tight', 700, 'fonts/InterTight-700.woff2'], ['Inter', 400, 'fonts/Inter-400.woff2'], ['Playfair Display', 700, 'fonts/PlayfairDisplay-700.woff2'], ['Zilla Slab', 700, 'fonts/ZillaSlab-700.woff2']];
  const c = new OffscreenCanvas(10, 10).getContext('2d'), r = {};
  for (const [f, w, url] of faces) {
    const ff = new FontFace(f, `url(/${url})`, { weight: String(w) });
    document.fonts.add(await ff.load());
    c.font = `${w} 1000px "${f}"`;
    r[`${f} ${w}`] = (c.measureText('H').actualBoundingBoxAscent / 1000).toFixed(3);
  }
  return r;
});
console.log(out);
await browser.close();
server.close();
