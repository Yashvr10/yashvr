// Stitch the scene clips, build the sound bed, duck it under the voice,
// normalise loudness and mux the finished file.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { B, ROOT, duration, ffmpeg, flags, readJSON, sceneKey, video, writeJSON } from './lib.mjs';

const f = flags();
const draft = !!f.draft;
const v = video();
const tl = readJSON(B('timeline.json'));
const ids = v.scenes.map((s) => s.id);
const T = tl.total;
const dir = B(draft ? 'scenes-draft' : 'scenes');

// 1. Video: concatenate the per-scene clips. -c copy = no re-encode, so an hour
//    of video stitches in seconds.
const list = ids.map((id) => {
  const scene = v.scenes.find((s) => s.id === id);
  const file = path.join(dir, `${id}.${sceneKey(v, scene, tl.scenes[id], draft ? 'draft' : 'final')}.mp4`);
  if (!fs.existsSync(file)) throw new Error(`Scene ${id} is not rendered yet (run render.mjs)`);
  return `file '${file}'`;
});
fs.writeFileSync(B('video.list'), list.join('\n'));
ffmpeg('-f', 'concat', '-safe', '0', '-i', B('video.list'), '-c', 'copy', B('video.mp4'));

// 2. Dialogue + effects: every scene's audio is already exactly as long as its
//    video, so plain concatenation stays in sync for the whole film.
fs.writeFileSync(B('audio.list'), ids.map((id) => `file '${B('audio', `${id}.wav`)}'`).join('\n'));
ffmpeg('-f', 'concat', '-safe', '0', '-i', B('audio.list'), '-c', 'copy', B('dialog.wav'));

// 3. A free sound bed: an A-major pad built from sines. Every frequency does a
//    whole number of cycles in 50 s, so the loop has no click at the seam.
//    Prefer your own licensed track? Set "music": "music/track.mp3" in video.json.
const own = v.meta.music ? path.join(ROOT, v.meta.music) : null;
if (own) ffmpeg('-i', own, '-ar', '48000', '-ac', '2', B('music-loop.wav'));
else if (!fs.existsSync(B('music-loop.wav'))) {
  ffmpeg(
    '-f', 'lavfi', '-i',
    "aevalsrc='0.10*(sin(2*PI*110*t)+0.8*sin(2*PI*164.82*t)+0.6*sin(2*PI*220*t)+0.4*sin(2*PI*277.2*t))*(0.75+0.25*sin(2*PI*0.08*t))':d=50:s=48000",
    '-af', 'lowpass=f=1800,aecho=0.8:0.7:60|120:0.3|0.2', '-ac', '2', B('music-loop.wav'),
  );
}

// 4. Duck the bed under the voice, mix, then normalise to -14 LUFS (YouTube's reference).
const fade = Math.min(3, T / 4);
ffmpeg(
  '-i', B('dialog.wav'), '-stream_loop', '-1', '-i', B('music-loop.wav'),
  '-filter_complex',
  [
    '[0:a]asplit=2[d1][d2]',
    `[1:a]atrim=0:${T},asetpts=PTS-STARTPTS,afade=t=in:d=2,afade=t=out:st=${T - fade}:d=${fade},volume=${v.meta.musicGain ?? 0.55}[m]`,
    '[m][d1]sidechaincompress=threshold=0.02:ratio=10:attack=15:release=350[duck]',
    '[d2][duck]amix=inputs=2:normalize=0:duration=first[mix]',
    '[mix]loudnorm=I=-14:TP=-1.5:LRA=11[out]',
  ].join(';'),
  '-map', '[out]', '-t', String(T), '-ar', '48000', B('master.wav'),
);

// 5. Mux.
const out = path.join(ROOT, 'out', `${v.meta.slug}${draft ? '.draft' : ''}.mp4`);
fs.mkdirSync(path.dirname(out), { recursive: true });
ffmpeg('-i', B('video.mp4'), '-i', B('master.wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'copy',
  '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', out);

// 6. Verify, so a bad render is caught here and not after the upload.
const ebu = spawnSync('ffmpeg', ['-hide_banner', '-nostats', '-i', out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
const lufs = /I:\s+(-?[\d.]+) LUFS/.exec(ebu.slice(ebu.lastIndexOf('Summary')))?.[1];
const peak = /Peak:\s+(-?[\d.]+) dBFS/.exec(ebu.slice(ebu.lastIndexOf('Summary')))?.[1];
const report = { file: out, planned: +T.toFixed(3), file_seconds: +duration(out).toFixed(3), loudness_lufs: lufs, true_peak_dbfs: peak };
writeJSON(B('report.json'), report);
console.log(report);
if (Math.abs(report.planned - report.file_seconds) > 0.1) { console.error('Duration drift: the timeline and the file disagree.'); process.exit(1); }
