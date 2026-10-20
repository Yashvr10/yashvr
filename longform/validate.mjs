// Catch a bad manifest in half a second, before any voice is spoken or frame drawn.
//   node validate.mjs            (exit code 1 if anything is wrong)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, video } from './lib.mjs';

const v = video();
const known = fs.readdirSync(path.join(ROOT, 'engine/scenes')).filter((f) => f !== 'index.js').map((f) => f.replace('.js', ''));

// What each scene type must carry in `data`.
const need = {
  title: ['title'],
  stat: ['value', 'unit', 'label'],
  bars: ['title', 'items'],
  timeline: ['events'],
  flow: ['nodes'],
  compare: ['left', 'right'],
  list: ['title', 'items'],
  outro: ['title'],
  image: ['src'],
  quote: ['text', 'by'],
};

const problems = [];
const seen = new Set();
let words = 0;
for (const s of v.scenes) {
  const at = `scene ${s.id}`;
  if (!/^s\d{3,}$/.test(s.id || '')) problems.push(`${at}: id must look like s014`);
  if (seen.has(s.id)) problems.push(`${at}: duplicate id`);
  seen.add(s.id);
  if (!known.includes(s.type)) problems.push(`${at}: unknown type "${s.type}" (have: ${known.join(', ')})`);
  for (const k of need[s.type] || []) if (s.data?.[k] === undefined) problems.push(`${at}: ${s.type} needs data.${k}`);
  const n = (s.narration || '').split(/\s+/).filter(Boolean).length;
  words += n;
  if (n < 6) problems.push(`${at}: narration is only ${n} words`);
  if (n > 55) problems.push(`${at}: narration is ${n} words (~${Math.round(n / 2.6)} s); split it into two scenes`);
  if (/\d/.test(s.narration || '')) problems.push(`${at}: digits in narration - spell numbers out for the voice and put the figures in data`);
  if (s.type === 'bars' && s.data?.items) {
    const max = Math.max(...s.data.items.map((i) => i.value));
    const min = Math.min(...s.data.items.map((i) => i.value));
    if (max / min > 40) problems.push(`${at}: bars span ${Math.round(max / min)}x - the small ones will be slivers; use "display" labels and "highlight", or split the chart`);
  }
}
for (let i = 2; i < v.scenes.length; i++) {
  const [a, b, c] = [v.scenes[i - 2], v.scenes[i - 1], v.scenes[i]];
  if (a.type === b.type && b.type === c.type) problems.push(`scenes ${a.id}-${c.id}: three ${a.type} scenes in a row - vary the visuals`);
}

const minutes = words / 150; // ~150 spoken words per minute
console.log(`${v.scenes.length} scenes, ${words} words, ~${minutes.toFixed(1)} min of narration`);
if (problems.length) {
  console.error(problems.map((p) => `  x ${p}`).join('\n'));
  process.exit(1);
}
console.log('manifest OK');
