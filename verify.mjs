// node verify.mjs out/file.mp4 [--size 1920x1080] [--solo <scene id>] [--frames N]
// Runs ffprobe on an encoded file and asserts width, height, fps and nb_frames ==
// round(DURATION * FPS), with FPS and DURATION read from the page (via `render.mjs info`, so
// --solo checks one scene). Prints the bitrate and file size. Exits 1 on any mismatch.
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2), flags = {}, pos = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) flags[argv[i].slice(2)] = argv[++i];
  else pos.push(argv[i]);
}
const file = pos[0];
if (!file) { console.error('usage: node verify.mjs file.mp4 [--size WxH] [--solo ID] [--frames N]'); process.exit(2); }

const page = JSON.parse(execFileSync(process.execPath, [join(ROOT, 'render.mjs'), 'info', ...(flags.solo ? ['--solo', flags.solo] : [])], { encoding: 'utf8' }).trim().split('\n').at(-1));
const [W, H] = (flags.size ?? '1920x1080').split('x').map(Number);
const frames = Number(flags.frames ?? Math.round(page.DURATION * page.FPS));

const probe = JSON.parse(execFileSync('ffprobe', [
  '-v', 'error', '-count_packets', '-show_entries',
  'stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames,nb_read_packets,bit_rate,pix_fmt,sample_rate,channels:format=size,bit_rate,duration',
  '-of', 'json', file,
], { encoding: 'utf8' }));
const v = probe.streams.find((s) => s.codec_type === 'video'), a = probe.streams.find((s) => s.codec_type === 'audio');
const [num, den] = v.r_frame_rate.split('/').map(Number), fps = num / den;
const n = Number(v.nb_frames ?? v.nb_read_packets);

const checks = [
  ['width', v.width, W],
  ['height', v.height, H],
  ['fps', +fps.toFixed(3), page.FPS],
  ['nb_frames', n, frames],
];
let bad = 0;
for (const [name, got, want] of checks) {
  const ok = got === want;
  bad += !ok;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(9)} ${got}${ok ? '' : ` (expected ${want})`}`);
}
const mbps = (b) => `${(Number(b) / 1e6).toFixed(2)} Mb/s`;
console.log(`     video     ${v.codec_name} ${v.pix_fmt}, ${v.bit_rate ? mbps(v.bit_rate) : 'n/a'}`);
if (a) console.log(`     audio     ${a.codec_name} ${a.sample_rate} Hz, ${a.channels} ch, ${a.bit_rate ? `${(a.bit_rate / 1000).toFixed(0)} kb/s` : 'n/a'}`);
console.log(`     overall   ${mbps(probe.format.bit_rate)}, ${(probe.format.size / 2 ** 20).toFixed(2)} MiB, ${Number(probe.format.duration).toFixed(3)} s`);
console.log(bad ? `${file}: ${bad} check(s) failed` : `${file}: verified`);
process.exit(bad ? 1 : 0);
