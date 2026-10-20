// Word timings for the captions. whisper reads the audio; we keep OUR words.
import fs from 'node:fs';
import { B, run, sha, duration, video, readJSON, writeJSON } from './lib.mjs';

const v = video();
fs.mkdirSync(B('words'), { recursive: true });

function whisperWords(wav) {
  run('whisper', [wav, '--model', 'tiny.en', '--language', 'en', '--word_timestamps', 'True',
    '--output_format', 'json', '--output_dir', B('align'), '--fp16', 'False']);
  const j = readJSON(B('align', wav.split('/').pop().replace(/\.wav$/, '.json')));
  return j.segments.flatMap((s) => s.words).map((w) => ({ s: w.start, e: w.end }));
}

let done = 0;
for (const s of v.scenes) {
  const wav = B('voice', `${s.id}.wav`);
  const key = sha(fs.readFileSync(B('voice', `${s.id}.key`), 'utf8'), v.meta.align, s.narration);
  const out = B('words', `${s.id}.json`);
  if (fs.existsSync(out) && readJSON(out).key === key) continue;

  const mine = s.narration.split(/\s+/).filter(Boolean);
  const total = duration(wav);
  let heard;
  if (v.meta.align === 'whisper') heard = whisperWords(wav);
  else heard = mine.map((_, i) => ({ s: (total * i) / mine.length, e: (total * (i + 1)) / mine.length })); // even split

  // The transcriber writes "300,000 km" where the script says "three hundred
  // thousand kilometres", so the counts differ. Map each of OUR words onto the
  // heard word at the same relative position: captions show the script, timed
  // by the audio.
  const words = mine.map((w, k) => {
    const j = Math.min(heard.length - 1, Math.round((k * (heard.length - 1)) / Math.max(1, mine.length - 1)));
    return { w, s: heard[j].s };
  });
  for (let i = 0; i < words.length; i++) {
    if (i && words[i].s < words[i - 1].s) words[i].s = words[i - 1].s;
    words[i].e = i < words.length - 1 ? words[i + 1].s : total;
  }
  writeJSON(out, { key, words });
  done++;
  console.log('align', s.id, `${mine.length} words`);
}
console.log(`align: ${done} aligned, ${v.scenes.length - done} cached`);
