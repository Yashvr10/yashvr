// node qa/stills.mjs: one still per template (stills/jobs/<tpl>.json → stills/<tpl>.png, at 0.4 s after
// its last caption settles, or just before its end), then the title template in all three looks side
// by side (stills/jobs/title_<look>.json → stills/title_looks.png). Prints each still's contrast checks.
import { readdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { serve, launch, openPage, grab } from '../browser.mjs';

const server = serve();
const browser = await launch();
const shoot = async (job, out) => {
  const page = await openPage(browser, `job=${job}&check`);
  const t = await page.evaluate(() => {
    const at = Math.max(...window.CAPTIONS.map((c) => c.at));
    return Math.round(Math.min(window.DURATION - 0.2, at + 0.4) * 30) / 30;
  });
  writeFileSync(out, await grab(page, t));
  const checks = await page.evaluate(() => (window.COPY_CHECKS ?? []).map((b) => `${b.ratio ? b.ratio.toFixed(1) : '–'}:1`).join(' '));
  console.log(`${out} at ${t.toFixed(3)} s  contrast ${checks || '(3D text, not measured)'}`);
  await page.close();
};
for (const f of readdirSync('stills/jobs').filter((n) => !n.startsWith('title_')).sort()) await shoot(`stills/jobs/${f}`, `stills/${f.replace('.json', '.png')}`);
const looks = ['night-amber', 'paper-red', 'chrome-blue'];
for (const l of looks) await shoot(`stills/jobs/title_${l}.json`, `qa/title_${l}.png`);
await browser.close();
server.close();
execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...looks.flatMap((l) => ['-i', `qa/title_${l}.png`]), '-filter_complex',
  `${looks.map((_, i) => `[${i}]scale=960:540:flags=lanczos,drawtext=fontfile=fonts/JetBrainsMono-400.woff2:text='${looks[i]}':x=16:y=16:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=6[v${i}]`).join(';')};${looks.map((_, i) => `[v${i}]`).join('')}hstack=inputs=3`, 'stills/title_looks.png']);
console.log('stills/title_looks.png');
