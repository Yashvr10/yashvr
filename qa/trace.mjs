// node qa/trace.mjs [--aspect 16x9] [--allow id:frame,…]
// Stutter check. With ?trace=<id> a scene reports one named element's screen position each frame
// (window.TRACE = { x, y }, set by engine/trace.js, cleared by renderFrame). For the main moving
// element of every scene this renders each frame of the scene alone and flags where the second
// difference a(n) = p(n+1) − 2p(n) + p(n−1) jumps: the jerk |a(n) − a(n−1)| over 3× the median jerk
// of the frames around it (n ± 3) and over 2 px. A smooth ease changes a(n) gradually (an outBack is a
// cubic: its jerk is constant), so it never trips this; a restart, a window boundary or a step in
// scale or offset does:
//   jump   the jerk spike happens while the element moves on both sides (mid-motion: a real stutter
//          unless it is a designed hit such as a camera punch)
//   onset  the element was at rest (|v| < 0.5 px) just before (motion starting, or an impact on a
//          resting element)
//   stall  a frame that doesn't move between two that move more than 1 px (a repeated value: rounding,
//          a clamp that holds early, a window gap)
//   gap    the element missing from a frame inside its visible span
// Writes qa/trace/<id>.csv. Exit 1 if any flag isn't in --allow (flags explained and accepted).
import { mkdir, writeFile } from 'node:fs/promises';
import { serve, launch, openPage } from '../browser.mjs';

// The main moving element of each scene.
const TRACES = {
  's01.tile': 's01_hook', 's02.strip': 's02_growth', 's03.tile0': 's03_reveal',
  's05.stripB': 's05_milestones', 's04.tile': 's04_answer',
};
const argv = process.argv.slice(2), flag = (k) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : undefined);
const aspect = flag('aspect') ?? '9x16';
const allow = new Set((flag('allow') ?? '').split(',').filter(Boolean));

const server = serve();
const browser = await launch();
await mkdir('qa/trace', { recursive: true });
const median = (xs) => { const s = [...xs].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
let open = 0;
for (const [id, scene] of Object.entries(TRACES)) {
  const page = await openPage(browser, `solo=${scene}&aspect=${aspect}&trace=${id}`);
  const pts = await page.evaluate(() => {
    const n = Math.round(window.DURATION * window.FPS), out = [];
    for (let f = 0; f < n; f++) {
      window.renderFrame(f / window.FPS);
      out.push(window.TRACE ? [window.TRACE.x, window.TRACE.y] : null);
    }
    return out;
  });
  await page.close();
  await writeFile(`qa/trace/${id}.csv`, `frame,t,x,y\n${pts.map((p, f) => `${f},${(f / 30).toFixed(4)},${p ? p.map((v) => v.toFixed(3)).join(',') : ','}`).join('\n')}\n`);

  const seen = pts.map((p, f) => (p ? f : -1)).filter((f) => f >= 0);
  if (!seen.length) { console.log(`${id}: NO TRACE (trace mode missing or id not reported)`); open++; continue; }
  const flags = [];
  for (let f = seen[0]; f <= seen.at(-1); f++) if (!pts[f]) flags.push({ f, kind: 'gap', note: 'missing inside its span' });
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], len = (v) => Math.hypot(v[0], v[1]);
  const v = pts.map((p, f) => (p && pts[f - 1] ? len(sub(p, pts[f - 1])) : null));
  const acc = pts.map((p, f) => (p && pts[f - 1] && pts[f + 1] ? sub(sub(pts[f + 1], p), sub(p, pts[f - 1])) : null));
  const jerk = acc.map((a, f) => (a && acc[f - 1] ? len(sub(a, acc[f - 1])) : null));
  jerk.forEach((j, f) => {
    if (j === null || !(v[f] > 0.5 || v[f + 1] > 0.5)) return;
    const m = median([-3, -2, -1, 1, 2, 3].map((k) => jerk[f + k]).filter((x) => x !== null && x !== undefined));
    if (j <= Math.max(3 * m, 2)) return;
    const kind = v[f - 1] < 0.5 || v[f] < 0.5 ? 'onset' : 'jump';
    flags.push({ f, kind, note: `jerk ${j.toFixed(1)} px (around it ${m.toFixed(2)}), |a| ${len(acc[f - 1]).toFixed(1)} → ${len(acc[f]).toFixed(1)}, |v| ${v[f - 1]?.toFixed(1)} → ${v[f]?.toFixed(1)} → ${v[f + 1]?.toFixed(1)}` });
  });
  v.forEach((_, f) => {
    if (v[f] !== null && v[f] < 0.05 && v[f - 1] > 1 && v[f + 1] > 1) flags.push({ f, kind: 'stall', note: `still between moves of ${v[f - 1].toFixed(1)} and ${v[f + 1].toFixed(1)} px` });
  });
  flags.sort((a, b) => a.f - b.f);
  console.log(`${id} (${scene}): frames ${seen[0]}–${seen.at(-1)}, ${flags.length} flag(s)`);
  for (const fl of flags) {
    const ok = allow.has(`${id}:${fl.f}`);
    if (!ok) open++;
    console.log(`  frame ${String(fl.f).padStart(3)} t ${(fl.f / 30).toFixed(3)}  ${fl.kind.padEnd(5)} ${fl.note}${ok ? '  (explained)' : ''}`);
  }
}
await browser.close();
server.close();
console.log(open ? `FAIL: ${open} unexplained flag(s)` : 'PASS');
process.exit(open ? 1 : 0);
