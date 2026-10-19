// node qa/parity.mjs [scene…] [--aspect 16x9|9x16|both]
// Proves the templates draw what the scenes they came from drew. For each explainer scene
// (promo/scenes/<id>.js) and its single-scene job (qa/parity/<id>_<aspect>.json: the same copy,
// duration and look), it renders three frames, early, middle and late, with each project's own
// render.mjs (promo: --solo <id>; kit: --job), then compares them: identical PNG bytes, else the
// pixel difference (ffmpeg: mean and max over the frame). Writes qa/parity/<id>_<aspect>_<t>.{orig,tpl}.png
// and qa/parity.txt; exit 1 on any difference.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const argv = process.argv.slice(2), ai = argv.indexOf('--aspect');
const aspects = ai >= 0 && argv[ai + 1] !== 'both' ? [argv[ai + 1]] : ['16x9', '9x16'];
const ALL = ['s01_open', 's02_map', 's03_response', 's04_cost', 's05_crisis', 's06_talks', 's07_now', 's08_end'];
const ids = argv.filter((a, i) => !a.startsWith('--') && !(ai >= 0 && i === ai + 1));
const KIT = resolve('.'), PROMO = resolve('../promo');
const sha = (f) => createHash('sha256').update(readFileSync(f)).digest('hex').slice(0, 16);
const run = (cwd, args) => execFileSync(process.execPath, ['render.mjs', ...args], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const diff = (a, b) => {
  const out = execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-i', a, '-i', b, '-filter_complex',
    '[0]format=gbrp[x];[1]format=gbrp[y];[x][y]blend=all_mode=difference,format=gray,signalstats,metadata=print:file=-', '-f', 'null', '-'], { encoding: 'utf8' });
  return { mean: Number(out.match(/YAVG=([\d.]+)/)[1]), max: Number(out.match(/YMAX=([\d.]+)/)[1]) };
};

// Scenes that can't play alone in the explainer: compared at their place in the full edit (the
// job leads in with a scene of the same length, then a hard cut, so global time matches).
const IN_EDIT = { s06_talks: 19.8 };
const lines = [];
let bad = 0;
for (const id of ids.length ? ids : ALL) {
  for (const aspect of aspects) {
    const job = `qa/parity/${id}_${aspect}.json`, dur = JSON.parse(readFileSync(job, 'utf8')).scenes.at(-1).dur;
    const at = IN_EDIT[id] ?? 0;
    // Early (an entrance under way), middle, late: whole frames.
    const ts = [0.4, dur / 2, dur - 0.2].map((t) => (Math.round((at + t) * 30) / 30).toFixed(4));
    run(PROMO, ['stills', ts.join(','), ...(at ? [] : ['--solo', id]), '--aspect', aspect]);
    run(KIT, ['stills', ts.join(','), '--job', job]);
    for (const t of ts) {
      const o = join(KIT, `qa/parity/${id}_${aspect}_${t}.orig.png`), p = join(KIT, `qa/parity/${id}_${aspect}_${t}.tpl.png`);
      renameSync(join(PROMO, `qa/still_${t}.png`), o);
      renameSync(join(KIT, `qa/still_${t}.png`), p);
      const same = sha(o) === sha(p);
      const d = same ? { mean: 0, max: 0 } : diff(o, p);
      if (!same) bad++;
      const line = `${id.padEnd(13)} ${aspect.padEnd(5)} t ${t}  orig ${sha(o)}  tpl ${sha(p)}  ${same ? 'IDENTICAL' : `DIFFERENT (mean ${d.mean.toFixed(3)}, max ${d.max})`}`;
      lines.push(line);
      console.log(line);
    }
  }
}
const summary = bad ? `FAIL: ${bad} of ${lines.length} frames differ` : `PASS: all ${lines.length} frames byte-identical`;
console.log(summary);
writeFileSync('qa/parity.txt', `${lines.join('\n')}\n${summary}\n`);
process.exit(bad ? 1 : 0);
