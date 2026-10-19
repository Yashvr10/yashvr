// node qa/flicker.mjs [--in frames] [--aspect 16x9]
// Encodes a draft from rendered frames (out/draft.mp4), runs ffmpeg tblend=all_mode=difference +
// signalstats into qa/diff.txt (YAVG of |frame n+1 − frame n|), and lists every frame pair whose
// YAVG is more than 3× the median and isn't within 1 frame of a timeline cut or transition window.
// For each one it writes qa/flicker/<n>.png (frames n−1, n, n+1, n+2 side by side) to inspect.
// A spike alone can't tell flicker from motion (the median is the grain on held frames), so each is
// classified with the two-frame difference d2(n) = |frame n+2 − frame n| (qa/diff2.txt):
//   FLICKER  frame n+1 is the odd one out: both its steps spike but d2(n) < half the smaller one
//            (A-B-A: the frame jumps away and comes back)
//   motion   d2(n) ≥ half the smaller step: the picture keeps going the way it went
// Exit 1 on any FLICKER (pass --allow n,n,… for ones explained and accepted).
import { execFileSync } from 'node:child_process';
import { readFile, mkdir } from 'node:fs/promises';
import { serve, launch, openPage } from '../browser.mjs';

const argv = process.argv.slice(2), flag = (k) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : undefined);
const aspect = flag('aspect') ?? '16x9', IN = flag('in') ?? (aspect === '16x9' ? 'frames_16x9' : 'frames_9x16');
const allow = new Set((flag('allow') ?? '').split(',').filter(Boolean).map(Number));
const run = (cmd, args) => execFileSync(cmd, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

// 1. Draft encode and the difference stats.
run('./encode.sh', ['draft', '--aspect', aspect, '--in', IN, '--out', 'out/draft.mp4']);
run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', 'out/draft.mp4', '-vf',
  'tblend=all_mode=difference,signalstats,metadata=mode=print:key=lavfi.signalstats.YAVG:file=qa/diff.txt', '-f', 'null', '-']);
// tblend output n blends input frames n and n+1, so value n is the change from frame n to n+1.
const yavg = [...(await readFile('qa/diff.txt', 'utf8')).matchAll(/YAVG=([\d.]+)/g)].map((m) => Number(m[1]));
// The same stat for frame n against frame n+2: the stream blended with itself two frames later.
run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', 'out/draft.mp4', '-filter_complex',
  '[0:v]split[a][b];[b]trim=start_frame=2,setpts=PTS-STARTPTS[c];[a][c]blend=all_mode=difference,signalstats,metadata=mode=print:key=lavfi.signalstats.YAVG:file=qa/diff2.txt',
  '-f', 'null', '-']);
const yavg2 = [...(await readFile('qa/diff2.txt', 'utf8')).matchAll(/YAVG=([\d.]+)/g)].map((m) => Number(m[1]));
const kind = (n) => (n + 1 < yavg.length && yavg2[n] !== undefined && yavg2[n] < 0.5 * Math.min(yavg[n], yavg[n + 1]) ? 'FLICKER' : 'motion');

// 2. Where the timeline cuts: every scene start and every transition window, in frames.
const server = serve();
const browser = await launch();
const page = await openPage(browser, `aspect=${aspect}`);
const cuts = await page.evaluate(async () => {
  const { main } = await import(`${location.origin}/timeline.js`), F = window.FPS;
  return {
    starts: main.scenes.slice(1).map((e) => Math.round(e.start * F)),
    windows: main.transitions.map((x) => [x.f0, x.f1 - 1, x.tr.name]),
  };
});
await page.close();
await browser.close();
server.close();
// A pair n→n+1 is "at a cut" if either frame is within 1 of a scene start or inside/next to a window.
const nearCut = (n) => cuts.starts.some((s) => n + 1 >= s - 1 && n <= s) ||
  cuts.windows.some(([a, b]) => n + 1 >= a - 1 && n <= b + 1);

const sorted = [...yavg].sort((a, b) => a - b), median = sorted[Math.floor(sorted.length / 2)];
const spikes = yavg.map((v, n) => ({ n, v })).filter(({ v }) => v > 3 * median);
const flagged = spikes.filter(({ n }) => !nearCut(n));
console.log(`${yavg.length} frame pairs, median YAVG ${median.toFixed(3)}, threshold ${(3 * median).toFixed(3)}`);
console.log(`cuts at frames ${cuts.starts.join(', ')}; windows ${cuts.windows.map(([a, b, n]) => `${n} ${a}–${b}`).join(', ')}`);
console.log(`${spikes.length} pair(s) over 3× median; ${spikes.length - flagged.length} at cuts, ${flagged.length} elsewhere:`);

// 3. Strips to inspect: frames n−1, n, n+1, n+2 from the draft.
await mkdir('qa/flicker', { recursive: true });
for (const { n, v } of flagged) {
  run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', 'out/draft.mp4', '-vf',
    `select='between(n\\,${n - 1}\\,${n + 2})',scale=270:-1,tile=4x1`, '-frames:v', '1', `qa/flicker/${n}.png`]);
  console.log(`  ${n}→${n + 1} (t ${(n / 30).toFixed(2)}s)  YAVG ${v.toFixed(2)} (${(v / median).toFixed(1)}× median)  n→n+2 ${yavg2[n]?.toFixed(2)}  ${kind(n)}${allow.has(n) ? ' (explained)' : ''}  qa/flicker/${n}.png`);
}
// Runs of consecutive flagged pairs, to read against the scenes' beats.
const runs = [];
for (const { n } of flagged) (runs.length && runs.at(-1)[1] === n - 1 ? (runs.at(-1)[1] = n) : runs.push([n, n]));
console.log(`runs: ${runs.map(([a, b]) => (a === b ? `${a}` : `${a}–${b}`)).join(', ')}`);
const open = flagged.filter(({ n }) => kind(n) === 'FLICKER' && !allow.has(n));
console.log(open.length ? `FAIL: ${open.length} flicker frame(s) (A-B-A)` : `PASS: no flicker; ${flagged.length} spike(s) are motion`);
process.exit(open.length ? 1 : 0);
