// Builds film.html, captions.html and captions-back.html for "How to Make Your Dream a Reality".
//   pictures  paintings and archival photographs (no paper or book pages), one at a time, a slow push on each, short
//             dissolves through dark between them (the reference video)
//   captions  the caption reel Dd0NzeWxryg: a top line of tall condensed serif capitals, the key word huge beneath it
//             (white or red), both behind the figure when the picture has a cut-out
//   chapters  roman numeral and a small spaced title on black (the reference video); a title card at the end
//   music     three dark, mysterious tracks in a row, crossfaded
//   node src/build.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const cfg = J("src/scenes.json"), POOLS = J("src/images.json"), CUT = J("src/cutouts.json");
const FPS = 30, q = (x) => Math.round(x * FPS) / FPS, r3 = (x) => Math.round(x * 1000) / 1000;
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
const dur = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(ROOT, f)]).toString();
let seed = 5; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const ALIAS = { scholar: ["writer", "crowd"], build: ["build", "work"], lilienthal: ["lilienthal", "wright"], thoreau: ["thoreau", "night"] };
const uses = {}; const ALL = [...new Set(Object.values(POOLS).flat())]; ALL.forEach((k) => (uses[k] = 0));
let recent = [];
function pick(themes) {
  const ths = [...new Set(themes.flatMap((x) => ALIAS[x] || [x]))];
  const cand = ths.flatMap((t) => POOLS[t] || []).filter((k) => !recent.includes(k));
  let best = cand.sort((a, b) => uses[a] - uses[b] || rnd() - 0.5)[0];
  if (!best) best = ALL.filter((k) => !recent.includes(k)).sort((a, b) => uses[a] - uses[b] || rnd() - 0.5)[0];
  uses[best]++; recent = [best, ...recent].slice(0, 5); return best;
}

const FADE = 0.45;
const shots = [], vo = [], sfx = [], chaps = [], ends = [], caps = [], capsBack = [];
let t = 0.6, n = 0;
for (const s of cfg.scenes) {
  if (s.card) {
    chaps.push({ at: r3(t), end: r3(t + s.len), num: s.num, title: s.title });
    sfx.push({ f: "swell.mp3", at: t - 0.3, vol: 0.35 });
    t = q(t + s.len); continue;
  }
  const vlen = dur(`assets/vo/${s.id}.mp3`), ws = J(`assets/vo/${s.id}.words.json`);
  const voAt = t, end = q(voAt + vlen + s.gap);
  vo.push({ id: s.id, at: voAt });
  const wt = (k) => q(voAt + ws[k].start);
  // pictures: one per ~4.5 s of the sentence, cut on a word start
  const nShots = Math.max(1, Math.round((end - t) / 4.6));
  const cuts = [t];
  for (let i = 1; i < nShots; i++) {
    const want = t + ((end - t) * i) / nShots; let best = null;
    for (let k = 1; k < ws.length; k++) { const x = wt(k); if (x > cuts[cuts.length - 1] + 2 && x < end - 2 && (!best || Math.abs(x - want) < Math.abs(best - want))) best = x; }
    if (best) cuts.push(best);
  }
  const sh = cuts.map((a, i) => {
    const b = i + 1 < cuts.length ? cuts[i + 1] : end, k = pick([s.th[i % s.th.length]]);
    const o = { at: r3(a), end: r3(b), k, kb: ["in", "out", "left", "right"][n++ % 4], cut: !!CUT[k] };
    shots.push(o); return o;
  });
  // captions: phrases of up to five words; the sentence's key word (s.big) is pulled out of its phrase and shown huge
  const bigWords = s.big ? s.big.split(" ").map(norm) : [];
  let bigAt = -1;
  if (bigWords.length) for (let k = 0; k + bigWords.length <= ws.length; k++) if (bigWords.every((w, j) => norm(ws[k + j].word) === w)) { bigAt = k; break; }
  if (s.big && bigAt < 0) console.warn("key word not found:", s.id, s.big);
  const phrases = []; let cur = [];
  ws.forEach((w, k) => {
    cur.push(k);
    const inBig = bigAt >= 0 && k >= bigAt && k < bigAt + bigWords.length;
    if (!inBig && (cur.length >= 5 || /[.,;:?!]$/.test(w.word))) { phrases.push(cur); cur = []; }
    else if (inBig && k === bigAt + bigWords.length - 1 && /[.,;:?!]$/.test(w.word)) { phrases.push(cur); cur = []; }
  });
  if (cur.length) phrases.push(cur);
  const clean = (k) => ws[k].word.replace(/["“”]/g, "").replace(/[.,;:!?]+$/, "").toUpperCase();
  phrases.forEach((p, i) => {
    const a = wt(p[0]), b = i + 1 < phrases.length ? wt(phrases[i + 1][0]) - 0.04 : end - 0.08;
    const hasBig = bigAt >= 0 && p.includes(bigAt);
    const W = (ks) => ks.map((k) => ({ x: clean(k), t: r3(wt(k)) }));
    const c = { at: r3(a), end: r3(Math.max(a + 0.4, b)), red: !!s.red };
    if (hasBig) {
      const bi = p.indexOf(bigAt);
      c.top = W(p.slice(0, bi)); c.big = [{ x: bigWords.length > 1 ? p.slice(bi, bi + bigWords.length).map(clean).join(" ") : clean(bigAt), t: r3(wt(bigAt)) }];
      c.tail = W(p.slice(bi + bigWords.length));
      if (!c.top.length) { c.top = c.tail; c.tail = []; if (c.top.length && c.top[0].t > c.big[0].t) { /* words after the key word, shown as the top line once spoken */ } }
      sfx.push({ f: s.red ? "thump.mp3" : "tick.mp3", at: wt(bigAt) - 0.02, vol: s.red ? 0.4 : 0.22 });
    } else c.top = W(p);
    const shot = sh.find((x) => a >= x.at - 0.01 && a < x.end) || sh[sh.length - 1];
    (shot.cut ? capsBack : caps).push(c);
  });
  t = end;
}
const title = "How to Make Your Dream a Reality";
ends.push({ at: r3(t + 0.3), end: r3(t + 4.3), text: title });
const FILM = r3(q(t + 4.6));

// ---- music: Titan, then Coming From Above, then Expanse, 5 s crossfades (each evened to the same loudness)
const MV = 0.42;
const tracks = [["titan.mp3", 0, 0], ["coming-from-above.mp3", 0, 0], ["expanse.mp3", 0, 0]];
let mt = 0; const music = [];
for (const [f] of tracks) {
  if (mt >= FILM) break;
  const L = Math.min(dur("assets/music/" + f) - 1.5, FILM - mt + 0.1);
  music.push({ f, at: r3(mt), len: r3(L) }); mt = mt + L - 5;
}

// ---- pages
const tpl = fs.readFileSync(path.join(ROOT, "src/captions.html"), "utf8");
fs.writeFileSync(path.join(ROOT, "captions.html"), tpl.replace("{{data}}", JSON.stringify({ caps, chaps, ends })));
fs.writeFileSync(path.join(ROOT, "captions-back.html"), tpl.replace("{{data}}", JSON.stringify({ caps: capsBack, chaps: [], ends: [] })));
fs.copyFileSync(path.join(ROOT, "src/grain.html"), path.join(ROOT, "grain.html"));
for (const x of sfx) x.len = dur("assets/sfx/" + x.f);
sfx.sort((a, b) => a.at - b.at);
const sTracks = [];
for (const x of sfx) { x.at = Math.max(0, x.at); let tr = sTracks.find((k) => k.end <= x.at + 0.001); if (!tr) sTracks.push((tr = { end: 0, clips: [] })); tr.clips.push(x); tr.end = x.at + x.len; }
const ov = (a, b) => ` overrides='[{"fade":[${a},${b}]}]'`;
const img = (x, i, cut) => `  <img id="${cut ? "c" : "p"}${i}" src="assets/${cut ? "cutouts" : "photos169"}/${x.k}.${cut ? "png" : "jpg"}#t=0,${r3(x.end - x.at + FADE)}" at="${x.at}" class="pic kb-${x.kb}"${ov(FADE, FADE)}>`;
const L = [];
L.push(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1920, height=1080">
<title>${title}</title>
<style>
  .pic { object-fit: cover; }
  @keyframes kb-in { from { scale: 1.0 } to { scale: 1.07 } }
  @keyframes kb-out { from { scale: 1.07 } to { scale: 1.0 } }
  @keyframes kb-left { from { scale: 1.06; translate: 1.5% 0 } to { scale: 1.06; translate: -1.5% 0 } }
  @keyframes kb-right { from { scale: 1.06; translate: -1.5% 0 } to { scale: 1.06; translate: 1.5% 0 } }
  .kb-in { animation: kb-in var(--clip-length) linear both; } .kb-out { animation: kb-out var(--clip-length) linear both; }
  .kb-left { animation: kb-left var(--clip-length) linear both; } .kb-right { animation: kb-right var(--clip-length) linear both; }
</style>
</head>
<body>`);
L.push(`<section>\n  <iframe id="grain" src="grain.html#t=0,${FILM}"></iframe>\n</section>`);
L.push(`<section>\n  <iframe id="captions" src="captions.html#t=0,${FILM}"></iframe>\n</section>`);
L.push(`<section>\n${shots.filter((x) => x.cut).map((x, i) => img(x, i, true)).join("\n")}\n</section>`);
L.push(`<section>\n  <iframe id="captions-back" src="captions-back.html#t=0,${FILM}"></iframe>\n</section>`);
// alternate two picture tracks so each dissolves over the next
for (const par of [0, 1]) L.push(`<section>\n${shots.map((x, i) => [x, i]).filter(([, i]) => i % 2 === par).map(([x, i]) => img(x, i, false)).join("\n")}\n</section>`);
L.push(`<section>\n${vo.map((x) => `  <audio id="vo-${x.id}" src="assets/vo/${x.id}.mp3" at="${r3(x.at)}"></audio>`).join("\n")}\n</section>`);
music.forEach((m, i) => L.push(`<section>\n  <audio id="music-${i}" src="assets/music/${m.f}#t=0,${m.len}" at="${m.at}" volume="${MV}"${ov(i ? 5 : 1.5, 5)}></audio>\n</section>`));
sTracks.forEach((tr) => L.push(`<section>\n${tr.clips.map((x) => `  <audio src="assets/sfx/${x.f}" at="${r3(x.at)}" volume="${x.vol}"></audio>`).join("\n")}\n</section>`));
L.push(`</body>\n</html>\n`);
fs.writeFileSync(path.join(ROOT, "film.html"), L.join("\n"));
const mmss = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;
console.log(`film.html ${mmss(FILM)} (${FILM}s): ${shots.length} shots (${shots.filter((x) => x.cut).length} with cut-outs), ${new Set(shots.map((x) => x.k)).size} pictures, ${caps.length + capsBack.length} captions (${capsBack.length} behind figures), music ${music.map((m) => m.f + "@" + mmss(m.at)).join(", ")}`);
console.log("chapters:", chaps.map((c) => mmss(c.at) + " " + c.num + " " + c.title).join(" | "));
