// Real caption files for YouTube/Instagram from the same word timings the burned-in captions use.
//   node srt.mjs   ->  out/<slug>.srt
import fs from 'node:fs';
import path from 'node:path';
import { B, ROOT, readJSON, video } from './lib.mjs';

const v = video();
const tl = readJSON(B('timeline.json'));
const stamp = (t) => {
  const ms = Math.round(t * 1000);
  const p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

let n = 0;
const out = [];
for (const s of v.scenes) {
  const slot = tl.scenes[s.id];
  let line = [];
  const flush = () => {
    if (!line.length) return;
    out.push(`${++n}\n${stamp(slot.start + slot.lead + line[0].s)} --> ${stamp(slot.start + slot.lead + line[line.length - 1].e)}\n${line.map((w) => w.w).join(' ')}\n`);
    line = [];
  };
  for (const w of slot.words) {
    line.push(w);
    if (line.length >= 9 || /[.!?]$/.test(w.w)) flush(); // a cue ends at a sentence or after 9 words
  }
  flush();
}
const file = path.join(ROOT, 'out', `${v.meta.slug}.srt`);
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, out.join('\n'));
console.log(`${n} caption cues -> ${file}`);
