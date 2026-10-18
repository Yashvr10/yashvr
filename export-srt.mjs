// node export-srt.mjs: writes out/captions.srt from copy.json and the timeline. Each cue runs
// from a caption's entrance to the end of its hold (holdFor), clipped to its scene's window.
import { mkdir, writeFile } from 'node:fs/promises';
import { serve, launch, openPage } from './browser.mjs';

const stamp = (s) => {
  const ms = Math.round(s * 1000), p = (n, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

const server = serve();
const browser = await launch();
const page = await openPage(browser);
const captions = await page.evaluate(() => window.CAPTIONS);
await browser.close();
server.close();

const srt = captions
  .sort((a, b) => a.in - b.in)
  .map((c, i) => `${i + 1}\n${stamp(c.in)} --> ${stamp(c.out)}\n${c.text}\n`)
  .join('\n');
await mkdir('out', { recursive: true });
await writeFile('out/captions.srt', srt);
console.log(`out/captions.srt: ${captions.length} cues`);
