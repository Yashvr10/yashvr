// node qa/boundaries.mjs [--aspect 16x9]
// Off-by-one check of every scene window and transition in the main timeline, frame by frame:
//   coverage    every frame 0..N−1 resolves to exactly one scene or transition; N = round(DURATION·FPS)
//   continuity  a scene's local time advances by exactly 1/FPS per frame while it is on screen (no
//               repeated or skipped local frame), from its in-point `from` on its first frame
//   holds       its last frame on screen is in its last frame before `end` (the hold isn't cut short
//               and its exit never shows), and local time stays within [0, mod.dur]
//   windows     each transition has an A that ends and a B that starts on its cut frame, its window
//               lies inside the edit, and both scenes' local times in it are within [0, mod.dur]
//   edges       at t = start + dur exactly, resolve() gives the next scene (not the previous one)
// Exit 1 on any failure.
import { serve, launch, openPage } from '../browser.mjs';

const argv = process.argv.slice(2), aspect = argv.includes('--aspect') ? argv[argv.indexOf('--aspect') + 1] : '9x16';
const server = serve();
const browser = await launch();
const page = await openPage(browser, `aspect=${aspect}`);
const r = await page.evaluate(async () => {
  const { main } = await import(`${location.origin}/timeline.js`), F = window.FPS, eps = 1e-6;
  const N = Math.round(main.DURATION * F), fails = [], notes = [];
  const id = (e) => e.scene;
  const frames = Array.from({ length: N }, (_, f) => {
    const t = f / F, res = main.resolve(t);
    return { f, t, res, owner: res.tr ? null : res.entry };
  });
  // coverage
  frames.forEach(({ f, res }) => { if (!res.tr && !res.entry) fails.push(`frame ${f}: resolves to nothing`); });
  if (Math.abs(N / F - main.DURATION) > eps) fails.push(`DURATION ${main.DURATION} is not a whole number of frames`);
  // continuity and holds, per scene, over the frames it owns (outside transition windows too:
  // a transition draws A and B at their own local times, checked under windows)
  for (const e of main.scenes) {
    const f0 = Math.round(e.start * F), f1 = Math.round((e.start + e.dur) * F) - 1;
    const locals = [];
    for (let f = f0; f <= f1; f++) locals.push(main.local(e, f / F));
    if (Math.abs(locals[0] - (e.from ?? 0)) > eps) fails.push(`${id(e)}: first frame ${f0} at local ${locals[0]}, expected from ${e.from}`);
    locals.forEach((l, i) => {
      if (i && Math.abs(l - locals[i - 1] - 1 / F) > eps) fails.push(`${id(e)}: local time steps by ${(l - locals[i - 1]).toFixed(5)} at frame ${f0 + i}`);
      if (l < -eps || l > e.mod.dur + eps) fails.push(`${id(e)}: local ${l.toFixed(4)} outside [0, ${e.mod.dur.toFixed(4)}] at frame ${f0 + i}`);
    });
    const last = locals.at(-1), end = e.mod.end;
    if (last >= end - eps) fails.push(`${id(e)}: last frame ${f1} at local ${last.toFixed(4)} ≥ end ${end.toFixed(4)} (its exit shows)`);
    if (last < end - 1 / F - eps && e !== main.scenes.at(-1)) fails.push(`${id(e)}: last frame ${f1} at local ${last.toFixed(4)} cuts the hold short of end ${end.toFixed(4)} by more than a frame`);
    if (e === main.scenes.at(-1) && last < end - 1 / F - eps) fails.push(`${id(e)}: the video ends ${(end - last).toFixed(3)} s before the last hold does`);
    notes.push(`${id(e).padEnd(15)} frames ${f0}–${f1}, local ${locals[0].toFixed(3)}–${last.toFixed(3)} (end ${end.toFixed(3)}, dur ${e.mod.dur.toFixed(3)})`);
    // edges: t exactly at start + dur belongs to the next scene
    const next = main.scenes[main.scenes.indexOf(e) + 1];
    if (next) {
      const at = main.resolve(e.start + e.dur), owner = at.tr ? (Math.round((e.start + e.dur) * F) >= Math.round(at.tr.at * F) ? at.tr.B : at.tr.A) : at.entry;
      if (owner !== next) fails.push(`t = start + dur of ${id(e)} (${(e.start + e.dur).toFixed(4)}) resolves to ${owner?.scene}, not ${next.scene}`);
    }
  }
  // windows
  for (const x of main.transitions) {
    const cut = Math.round(x.at * F);
    if (Math.round((x.A.start + x.A.dur) * F) !== cut || Math.round(x.B.start * F) !== cut) fails.push(`${x.tr.name}: A or B doesn't meet the cut at frame ${cut}`);
    if (x.f0 < 0 || x.f1 > N) fails.push(`${x.tr.name}: window ${x.f0}–${x.f1 - 1} outside the edit`);
    for (let f = x.f0; f < x.f1; f++) {
      for (const e of [x.A, x.B]) {
        const l = main.local(e, f / F);
        if (l < -eps || l > e.mod.dur + eps) fails.push(`${x.tr.name} frame ${f}: ${id(e)} drawn at local ${l.toFixed(4)} outside [0, ${e.mod.dur.toFixed(4)}]`);
      }
    }
    notes.push(`${x.tr.name.padEnd(15)} window ${x.f0}–${x.f1 - 1} around cut ${cut} (${x.A.scene} → ${x.B.scene}), dur ${x.dur.toFixed(3)} = ${x.f1 - x.f0} frames`);
  }
  return { N, fails, notes };
});
await page.close();
await browser.close();
server.close();
console.log(`${r.N} frames (${aspect})`);
r.notes.forEach((n) => console.log(`  ${n}`));
r.fails.forEach((f) => console.log(`FAIL ${f}`));
console.log(r.fails.length ? `FAIL: ${r.fails.length} boundary problem(s)` : 'PASS');
process.exit(r.fails.length ? 1 : 0);
