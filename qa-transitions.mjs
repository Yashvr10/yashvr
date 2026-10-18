// node qa-transitions.mjs: for every transition in the main timeline, renders each frame of
// its window into qa/tr_<name>/ plus a strip qa/tr_<name>.png, and checks each frame:
//  - not blank: some scene content is visible (2D layer coverage), or 3D content for a 3D scene;
//  - never both scenes at full opacity in the same pixels (A-only vs B-only renders);
//  - blur follows the motion: whip blurs along x (horizontal detail drops more than vertical);
//    zoomThrough blurs radially (radial detail drops more than tangential), against the frame
//    just before the window.
import { mkdir, writeFile } from 'node:fs/promises';
import { serve, launch, openPage, grab, contactSheet } from './browser.mjs';

const server = serve();
const browser = await launch();
const page = await openPage(browser);
await page.evaluate(async () => {
  const { main } = await import(`${location.origin}/timeline.js`), { W, H } = await import(`${location.origin}/tokens.js`);
  const probe = new OffscreenCanvas(W, H).getContext('2d', { willReadFrequently: true });
  const shot = new OffscreenCanvas(W, H).getContext('2d', { willReadFrequently: true });
  const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];

  // Alpha of the 2D layer when the transition draws only A, only B, or both.
  const alpha = (x, t, a, b) => {
    probe.reset();
    const none = () => {};
    x.tr(probe, t, a ? main.drawer(x.A, t) : none, b ? main.drawer(x.B, t) : none, x.t0, x.dur, x.opts);
    const d = probe.getImageData(0, 0, W, H).data, out = new Uint8Array(W * H);
    for (let i = 0; i < out.length; i++) out[i] = d[4 * i + 3];
    return { out, rgba: d };
  };
  // Mean absolute luminance difference along x and y of an RGBA image (alpha-weighted).
  const directional = (d) => {
    let ex = 0, ey = 0;
    for (let y = 1; y < H - 1; y += 2) for (let x = 1; x < W - 1; x += 2) {
      const i = 4 * (y * W + x), a = d[i + 3] / 255;
      ex += Math.abs(lum(d, i + 4) * (d[i + 7] / 255) - lum(d, i - 4) * (d[i - 1] / 255));
      ey += Math.abs(lum(d, i + 4 * W) * (d[i + 4 * W + 3] / 255) - lum(d, i - 4 * W) * (d[i - 4 * W + 3] / 255));
      void a;
    }
    return ex / Math.max(ey, 1e-6);
  };
  // Radial over tangential gradient of the final frame (canvas #c), around the centre.
  const radial = () => {
    shot.reset();
    shot.drawImage(document.getElementById('c'), 0, 0);
    const d = shot.getImageData(0, 0, W, H).data;
    let gr = 0, gt = 0;
    for (let y = 2; y < H - 2; y += 3) for (let x = 2; x < W - 2; x += 3) {
      const i = 4 * (y * W + x), gx = lum(d, i + 4) - lum(d, i - 4), gy = lum(d, i + 4 * W) - lum(d, i - 4 * W);
      const rx = x - W / 2, ry = y - H / 2, r = Math.hypot(rx, ry);
      if (r < 120) continue;
      gr += Math.abs((gx * rx + gy * ry) / r);
      gt += Math.abs((-gx * ry + gy * rx) / r);
    }
    return gr / Math.max(gt, 1e-6);
  };

  window.QA = {
    list: () => main.transitions.map((x) => ({ name: x.tr.name, f0: x.f0, f1: x.f1, at: x.at, A: x.A.scene, B: x.B.scene })),
    // Call after renderFrame(t) so the final frame is on #c.
    check(k, t, base) {
      const x = main.transitions[k], n = W * H;
      // What the transition draws itself (a matchCut outline, a dip colour) belongs to neither scene.
      const own = alpha(x, t, false, false).out;
      const a = alpha(x, t, true, false).out, b = alpha(x, t, false, true).out, both = alpha(x, t, true, true);
      let na = 0, nb = 0, overlap = 0, covered = 0;
      for (let i = 0; i < n; i++) {
        const fa = a[i] > 230 && own[i] < 25, fb = b[i] > 230 && own[i] < 25;
        na += fa; nb += fb; overlap += fa && fb; covered += both.out[i] > 25;
      }
      // The final frame (3D included): share of pixels clearly brighter than the background.
      shot.reset();
      shot.drawImage(document.getElementById('c'), 0, 0);
      const d = shot.getImageData(0, 0, W, H).data;
      let lit = 0;
      for (let i = 0; i < d.length; i += 16) lit += lum(d, i) > 60;
      const r = { coverage: covered / n, final: lit / (n / 4), overlap: overlap / Math.max(1, Math.min(na, nb)), na, nb };
      if (x.tr.name === 'whip') r.xy = directional(both.rgba);
      if (x.tr.name === 'zoomThrough') r.radial = radial();
      if (base) {
        // Same measures on a plain frame of A just before the window.
        if (x.tr.name === 'whip') {
          probe.reset();
          main.drawer(x.A, t)(probe);
          r.xy = directional(probe.getImageData(0, 0, W, H).data);
        }
        if (x.tr.name === 'zoomThrough') r.radial = radial();
      }
      return r;
    },
  };
});

const report = [];
for (const [k, x] of (await page.evaluate(() => window.QA.list())).entries()) {
  const dir = `qa/tr_${x.name}`, shots = [];
  await mkdir(dir, { recursive: true });
  await grab(page, (x.f0 - 1) / 30);
  const base = await page.evaluate((k, t) => window.QA.check(k, t, true), k, (x.f0 - 1) / 30);
  const rows = [];
  for (let f = x.f0; f < x.f1; f++) {
    const file = `${dir}/f${String(f).padStart(5, '0')}.png`;
    await writeFile(file, await grab(page, f / 30));
    const r = await page.evaluate((k, t) => window.QA.check(k, t, false), k, f / 30);
    rows.push({ f, ...r });
    shots.push({ file, label: `${f}${f === Math.round(x.at * 30) ? ' cut' : ''}` });
  }
  await writeFile(`qa/tr_${x.name}.png`, await contactSheet(browser, shots, { cols: shots.length, tw: 320, th: 180 }));
  report.push({ ...x, base, rows });
}
console.log(JSON.stringify(report));
await browser.close();
server.close();
