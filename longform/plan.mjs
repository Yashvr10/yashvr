// Audio-first timeline: the voice decides how long each scene is.
import { B, duration, ffmpeg, video, writeJSON, readJSON } from './lib.mjs';
import fs from 'node:fs';

const v = video();
const FPS = v.meta.fps;
const scenes = {};
let start = 0;
fs.mkdirSync(B('audio'), { recursive: true });

v.scenes.forEach((s, i) => {
  const voiceDur = duration(B('voice', `${s.id}.wav`));
  const lead = s.lead ?? (i === 0 ? 0.9 : v.meta.lead);
  const tail = s.tail ?? (i === v.scenes.length - 1 ? 1.2 : v.meta.tail);
  // Round UP to a whole frame. The - 1e-6 stops 7.2 * 30 = 216.00000000000003
  // from becoming 217 frames and drifting the audio by a frame per scene.
  const frames = Math.ceil((lead + voiceDur + tail) * FPS - 1e-6);
  const dur = frames / FPS;
  const words = readJSON(B('words', `${s.id}.json`)).words;
  scenes[s.id] = { start, dur, frames, lead, voiceDur, words };
  start += dur;

  // This scene's finished audio: voice + its sound effects, padded to EXACTLY dur.
  const sfx = s.sfx ?? [{ name: 'whoosh', at: 0.05, gain: 0.35 }];
  const inputs = ['-i', B('voice', `${s.id}.wav`), ...sfx.flatMap((e) => ['-i', B('sfx', `${e.name}.wav`)])];
  const parts = [`[0:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay=${Math.round(lead * 1000)}:all=1[v]`];
  sfx.forEach((e, k) => parts.push(`[${k + 1}:a]volume=${e.gain ?? 0.4},adelay=${Math.round(e.at * 1000)}:all=1[e${k}]`));
  const labels = ['[v]', ...sfx.map((_, k) => `[e${k}]`)].join('');
  parts.push(`${labels}amix=inputs=${sfx.length + 1}:normalize=0:duration=longest,apad=whole_dur=${dur},atrim=0:${dur}[out]`);
  ffmpeg(...inputs, '-filter_complex', parts.join(';'), '-map', '[out]', '-ar', '48000', '-ac', '2', '-c:a', 'pcm_s16le', B('audio', `${s.id}.wav`));
});

writeJSON(B('timeline.json'), { fps: FPS, total: start, scenes });
const mins = Math.floor(start / 60);
console.log(`plan: ${v.scenes.length} scenes, ${mins}m ${(start % 60).toFixed(1)}s, ${Math.round(start * FPS)} frames`);
