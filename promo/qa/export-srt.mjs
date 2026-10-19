// node qa/export-srt.mjs: writes out/captions.srt from copy.json via the timeline (window.CAPTIONS:
// each caption from its entrance to the end of its hold, clipped to its scene). Captions that are on
// screen together (a map's labels and its line) merge into one cue, so no two cues overlap:
// a cue starts at the first entrance, ends at the last hold, lists its lines in reading order,
// and a cue never runs past the next one's start.
import { mkdir, writeFile } from 'node:fs/promises';
import { serve, launch, openPage } from '../browser.mjs';

const stamp = (s) => {
  const ms = Math.round(s * 1000), p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
const server = serve();
const browser = await launch();
const page = await openPage(browser);
const caps = (await page.evaluate(() => window.CAPTIONS)).sort((a, b) => a.in - b.in);
await browser.close();
server.close();

// Group overlapping captions of the same scene.
const cues = [];
for (const c of caps) {
  const last = cues.at(-1);
  if (last && last.scene === c.scene && c.in < last.out) {
    last.lines.push(c.text);
    last.out = Math.max(last.out, c.out);
  } else cues.push({ scene: c.scene, in: c.in, out: c.out, lines: [c.text] });
}
cues.forEach((q, i) => { if (cues[i + 1]) q.out = Math.min(q.out, cues[i + 1].in); });
const srt = cues.map((q, i) => `${i + 1}\n${stamp(q.in)} --> ${stamp(q.out)}\n${q.lines.join('\n')}\n`).join('\n');
await mkdir('out', { recursive: true });
await writeFile('out/captions.srt', srt);
console.log(`out/captions.srt: ${cues.length} cues from ${caps.length} captions`);
