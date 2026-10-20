// A viewer comments "the number at 4:12 is wrong". Which scene is that?
//   node scene-at.mjs 4:12        ->  s120  (starts 4:08.0, ends 4:19.5)
//   node scene-at.mjs 252         ->  the same, in seconds
import { B, readJSON, video } from './lib.mjs';

const arg = process.argv[2];
if (!arg) {
  console.error('usage: node scene-at.mjs <m:ss | seconds>');
  process.exit(1);
}
const t = arg.includes(':') ? arg.split(':').reduce((a, b) => a * 60 + Number(b), 0) : Number(arg);
const tl = readJSON(B('timeline.json'));
const clock = (s) => `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, '0')}`;

const scene = video().scenes.find((s) => t >= tl.scenes[s.id].start && t < tl.scenes[s.id].start + tl.scenes[s.id].dur);
if (!scene) {
  console.error(`Nothing at ${arg}: the film is ${clock(tl.total)} long.`);
  process.exit(1);
}
const slot = tl.scenes[scene.id];
console.log(`${scene.id}  (${scene.type}, starts ${clock(slot.start)}, ends ${clock(slot.start + slot.dur)})`);
console.log(`"${scene.narration}"`);
