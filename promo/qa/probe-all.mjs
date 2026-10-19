// node qa/probe-all.mjs: ffprobe on every video in out/, printing codec, pix_fmt, width, height,
// fps and duration, and asserting each against the timeline (FPS, DURATION and frame count from
// the page via render.mjs info) and the size its name implies. _a files must also carry a 48 kHz
// stereo AAC track no longer than the video. Exit 1 on any mismatch.
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const info = JSON.parse(execFileSync(process.execPath, ['render.mjs', 'info'], { encoding: 'utf8' }).trim().split('\n').at(-1));
const frames = Math.round(info.DURATION * info.FPS);
const SIZE = { final_2160: [3840, 2160], final_1080_ss: [1920, 1080], final_9x16: [1080, 1920], draft: [1920, 1080] };
let bad = 0;
console.log(`timeline: ${info.FPS} fps, ${info.DURATION.toFixed(3)} s, ${frames} frames\n`);
console.log('file                     codec pix_fmt   width height fps  duration  frames  audio');
for (const f of readdirSync('out').filter((n) => n.endsWith('.mp4')).sort()) {
  const p = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-count_packets', '-show_entries',
    'stream=codec_type,codec_name,pix_fmt,width,height,r_frame_rate,nb_read_packets,duration,sample_rate,channels', '-of', 'json', `out/${f}`], { encoding: 'utf8' }));
  const v = p.streams.find((s) => s.codec_type === 'video'), a = p.streams.find((s) => s.codec_type === 'audio');
  const [n, d] = v.r_frame_rate.split('/').map(Number), fps = n / d, dur = Number(v.duration), nb = Number(v.nb_read_packets);
  const key = f.replace(/(_a)?\.mp4$/, ''), [w, h] = SIZE[key] ?? [];
  const fails = [];
  if (v.codec_name !== 'h264') fails.push('codec');
  if (v.pix_fmt !== 'yuv420p') fails.push('pix_fmt');
  if (v.width !== w || v.height !== h) fails.push(`size (want ${w}x${h})`);
  if (Math.abs(fps - info.FPS) > 1e-6) fails.push('fps');
  if (Math.abs(dur - info.DURATION) > 0.5 / info.FPS) fails.push('duration');
  if (nb !== frames) fails.push('frames');
  if (f.endsWith('_a.mp4')) {
    if (!a || a.codec_name !== 'aac' || Number(a.sample_rate) !== 48000 || a.channels !== 2) fails.push('audio');
    else if (Number(a.duration) > dur + 0.05) fails.push('audio longer than video');
  } else if (a) fails.push('unexpected audio');
  bad += fails.length > 0;
  const aud = a ? `${a.codec_name} ${a.sample_rate} Hz ${a.channels}ch ${Number(a.duration).toFixed(3)} s` : '—';
  console.log(`${f.padEnd(24)} ${v.codec_name.padEnd(5)} ${v.pix_fmt.padEnd(9)} ${String(v.width).padEnd(5)} ${String(v.height).padEnd(6)} ${fps.toFixed(0).padEnd(4)} ${dur.toFixed(3).padEnd(9)} ${String(nb).padEnd(7)} ${aud}  ${fails.length ? `FAIL: ${fails.join(', ')}` : 'ok'}`);
}
console.log(bad ? `\nFAIL: ${bad} file(s)` : '\nPASS: every video matches the timeline');
process.exit(bad ? 1 : 0);
