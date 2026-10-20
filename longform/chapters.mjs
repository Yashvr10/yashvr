// YouTube chapters from the timeline, so the timestamps can never be wrong.
// Mark a scene with  "chapter": "Why it matters"  in video.json, then:
//   node chapters.mjs      ->  paste the output into the video description
import { B, readJSON, video } from './lib.mjs';

const v = video();
const tl = readJSON(B('timeline.json'));
const stamp = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

const marked = v.scenes.filter((s) => s.chapter);
const lines = marked.map((s) => ({ at: tl.scenes[s.id].start, title: s.chapter }));

// YouTube's rules: the first chapter must start at 0:00, there must be at least
// three, and each must run at least 10 seconds.
const problems = [];
if (!lines.length || lines[0].at !== 0) problems.push('the first chapter must be on the first scene (0:00)');
if (lines.length < 3) problems.push(`need at least 3 chapters, found ${lines.length}`);
lines.forEach((l, i) => {
  const end = i < lines.length - 1 ? lines[i + 1].at : tl.total;
  if (end - l.at < 10) problems.push(`"${l.title}" is only ${(end - l.at).toFixed(1)} s long`);
});

console.log(lines.map((l) => `${stamp(l.at)} ${l.title}`).join('\n'));
if (problems.length) {
  console.error(`\n${problems.map((p) => `  x ${p}`).join('\n')}`);
  process.exit(1);
}
