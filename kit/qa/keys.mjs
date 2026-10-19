// node qa/keys.mjs: every look in kit/tokens/ exports exactly the same keys as kit/tokens.js
// re-exports. Exit 1 on any difference.
import { readFileSync } from 'node:fs';
const LOOKS = ['night-amber', 'paper-red', 'chrome-blue'];
const keysOf = (src) => [...src.matchAll(/^export const (\w+)/gm)].map((m) => m[1]).sort();
const dispatched = readFileSync('tokens.js', 'utf8').match(/export const \{([^}]*)\}/)[1].split(',').map((s) => s.trim()).filter(Boolean).sort();
let bad = 0;
for (const look of LOOKS) {
  const k = keysOf(readFileSync(`tokens/${look}.js`, 'utf8'));
  const missing = dispatched.filter((x) => !k.includes(x)), extra = k.filter((x) => !dispatched.includes(x));
  bad += missing.length + extra.length;
  console.log(`${look.padEnd(12)} ${k.length} keys${missing.length ? `  missing: ${missing}` : ''}${extra.length ? `  extra: ${extra}` : ''}`);
}
console.log(bad ? 'FAIL' : `PASS: ${dispatched.length} keys in every look`);
process.exit(bad ? 1 : 0);
