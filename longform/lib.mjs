import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath, not URL.pathname: the latter leaves a space in a folder name as %20.
export const ROOT = path.dirname(fileURLToPath(import.meta.url));
export const B = (...p) => path.join(ROOT, 'build', ...p);
export const readJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
export const writeJSON = (f, o) => {
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, JSON.stringify(o, null, 2));
};
export const video = () => readJSON(path.join(ROOT, 'video.json'));

/** Short stable fingerprint of anything JSON-able: the key of every cache here. */
export const sha = (...parts) =>
  crypto
    .createHash('sha1')
    .update(parts.map((p) => (typeof p === 'string' ? p : JSON.stringify(p))).join('\u0000'))
    .digest('hex')
    .slice(0, 12);

export function run(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28, ...opts });
  if (r.status !== 0) throw new Error(`${cmd} failed:\n${(r.stderr || '').slice(-1500)}`);
  return r.stdout;
}
export const ffmpeg = (...args) => run('ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', ...args]);
export const duration = (f) =>
  parseFloat(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]));

export function flags() {
  const a = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < a.length; i++) {
    if (!a[i].startsWith('--')) continue;
    out[a[i].slice(2)] = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true;
  }
  return out;
}

/** Everything a scene's pixels depend on - and nothing else. */
export function sceneKey(v, scene, slot, extra = '') {
  const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
  // `start` is deliberately left out: where a scene sits in the film changes
  // none of its pixels. Keep it in and one edit near the top re-renders
  // every scene after it.
  const { start, ...pixels } = slot;
  // Sound cues do not change a single pixel, and the narration reaches the picture
  // through `slot` (words and length). Leave both out of the picture's fingerprint.
  const { sfx, narration, ...visual } = scene;
  // Every meta setting that changes how a frame LOOKS (size, fps, captions, caption
  // style...). Voice, alignment, music and pronunciation are excluded: they act through
  // `slot`, which already carries the resulting words and durations.
  const { voice, align, music, pronounce, slug, lead, tail, ...look } = v.meta;
  return sha(
    visual, pixels, v.style, look, extra,
    read('stage.js'), read('engine/ease.js'), read('engine/draw.js'),
    read(`engine/scenes/${scene.type}.js`), // only THIS scene type's code
  );
}
