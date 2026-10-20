// The whole film, in order. Anything unchanged is skipped by its own cache.
//   node build.mjs            final render
//   node build.mjs --draft    fast pass for checking pacing and layout
import { spawnSync } from 'node:child_process';

const rest = process.argv.slice(2); // --draft, --workers 4, --only s003 ...
const steps = ['tts.mjs', 'align.mjs', 'sfx.mjs', 'plan.mjs', 'render.mjs', 'mix.mjs'];
for (const step of steps) {
  const t0 = Date.now();
  const r = spawnSync('node', [step, ...rest], { stdio: 'inherit' });
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log(`✓ ${step}  ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
}
