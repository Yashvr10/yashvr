// Builds film.html and captions.html for "Why Believing in Yourself Feels So Lonely" (same look as You Were Programmed and The Battle of Thoughts).
//   pictures  public-domain paintings, prints and drawings (Cleveland Museum of Art, Art Institute of Chicago), one at a
//             time, a slow push on each, short dissolves through dark between them
//   captions  small lowercase EB Garamond words in the middle of the frame, the sentence's key word as a big script accent
//   chapters  roman numeral and a small spaced title on black; a title card at the end
//   music     mysterious, suspenseful Kevin MacLeod (CC BY 4.0) tracks in a row, crossfaded
//   node src/build.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const cfg = J("src/scenes.json"), POOLS = J("src/images.json");
const FPS = 30, q = (x) => Math.round(x * FPS) / FPS, r3 = (x) => Math.round(x * 1000) / 1000;
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
const dur = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(ROOT, f)]).toString();
let seed = 5; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const ALIAS = {"judge": ["judge", "crowd", "mask"], "crowd": ["crowd", "judge", "mask"], "mask": ["mask", "crowd"], "mirror": ["mirror", "mask", "alone"], "alone": ["alone", "road", "nature"], "dream": ["dream", "sleep", "light", "door"], "fire": ["fire", "storm", "war"], "war": ["war", "storm"], "empire": ["empire", "gold", "war"], "faith": ["faith", "light", "sage"], "family": ["child", "kind"], "madness": ["madness", "mirror", "shadow"], "road": ["road", "alone", "nature", "war"], "door": ["door", "light", "dream"], "sage": ["sage", "alone"]};
const uses = {}; const ALL = [...new Set(Object.values(POOLS).flat())]; ALL.forEach((k) => (uses[k] = 0));
let recent = [];
// a cut-out is used only when its figure leaves most of a red word visible: BAND is how much of the frame's middle the
// figure covers (src/cutband.json); a short word needs more room than a long one
let LIM = 0.45;
const goodCut = (k) => false;   // no cut-outs in this film
function pick(themes, wantCut = false) {
  const ths = [...new Set(themes.flatMap((x) => ALIAS[x] || [x]))];
  const cand = ths.flatMap((t) => POOLS[t] || []).filter((k) => !recent.includes(k));
  // a shot carrying a red word prefers a picture with a clean figure, so the word can sit behind it
  let best = cand.sort((a, b) => (wantCut ? +goodCut(b) - +goodCut(a) : 0) || uses[a] - uses[b] || rnd() - 0.5)[0];
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
  LIM = s.red && s.big && s.big.length <= 5 ? 0.25 : 0.45;
  let redT = -1;
  if (s.red && s.big) { const bw = s.big.split(" ").map(norm); for (let k = 0; k + bw.length <= ws.length; k++) if (bw.every((w, j) => norm(ws[k + j].word) === w)) { redT = wt(k); break; } }
  const sh = cuts.map((a, i) => {
    const b = i + 1 < cuts.length ? cuts[i + 1] : end, red = redT >= a && redT < b, k = pick(red ? s.th : [s.th[i % s.th.length]], red);
    const o = { at: r3(a), end: r3(b), k, kb: ["in", "out", "left", "right"][n++ % 4], cut: goodCut(k) };
    shots.push(o); return o;
  });
  // captions (the Rise Above style): every spoken word in small lowercase EB Garamond, one to three words at a time in
  // the middle of the frame, each word appearing as it is said, never across a cut; the sentence's key word (s.big) as a
  // big Pinyon Script accent with the next words small beneath, or, for the red key words, huge red Instrument Serif
  // capitals filling the frame, behind the figure where the picture has a cut-out
  const bigWords = s.big ? s.big.split(" ").map(norm) : [];
  let bigAt = -1;
  if (bigWords.length) for (let k = 0; k + bigWords.length <= ws.length; k++) if (bigWords.every((w, j) => norm(ws[k + j].word) === w)) { bigAt = k; break; }
  if (s.big && bigAt < 0) console.warn("key word not found:", s.id, s.big);
  const inBig = (k) => bigAt >= 0 && k >= bigAt && k < bigAt + bigWords.length;
  const accent = bigAt >= 0 && !s.red && bigWords.length === 1 && /^[a-z]+$/.test(bigWords[0]);
  const shotOf = (k) => sh.findIndex((x) => wt(k) >= x.at - 0.01 && wt(k) < x.end);
  const clean = (k) => ws[k].word.replace(/["“”]/g, "").replace(/[.,;:!?]+$/, "");
  const groups = []; let cur = null;
  const flush = () => { if (cur && cur.ks.length) groups.push(cur); cur = null; };
  ws.forEach((w, k) => {
    if (inBig(k) && s.red) { if (k === bigAt) { flush(); groups.push({ kind: "emph", ks: [] }); } groups[groups.length - 1].ks.push(k); return; }
    if (cur && shotOf(k) !== shotOf(cur.ks[0])) flush();
    if (accent && k === bigAt) { flush(); cur = { kind: "quiet", acc: true, ks: [] }; }
    if (!cur) cur = { kind: "quiet", ks: [] };
    cur.ks.push(k);
    if (cur.ks.length >= 3 || /[.,;:?!]$/.test(w.word)) flush();
  });
  flush();
  let busy = 0;   // a red word holds the middle of the frame for about a second; the words after it wait their turn
  groups.forEach((g, i) => {
    const last = g.ks[g.ks.length - 1], si = shotOf(g.ks[0]);
    const shot = sh[si] || sh[sh.length - 1];
    const a = Math.max(wt(g.ks[0]), busy);
    const nxt = i + 1 < groups.length ? wt(groups[i + 1].ks[0]) - 0.02 : end - 0.1;
    const wEnd = voAt + ws[last].end;
    const e = g.kind === "emph"
      ? r3(Math.max(a + 0.4, Math.min(shot.end - 0.08, end - 0.1, Math.max(nxt, wEnd + 1.0))))
      : r3(Math.max(a + 0.4, Math.min(Math.max(nxt, a + 0.6), shot.end - 0.08, wEnd + 1.1)));
    busy = e + 0.02;
    if (g.kind === "emph") {
      (shot.cut ? capsBack : caps).push({ kind: "emph", at: r3(a), end: e, lines: [g.ks.map((k) => ({ x: clean(k).toUpperCase(), t: r3(wt(k)) }))] });
      sfx.push({ f: "thump.mp3", at: a - 0.02, vol: 0.4 });
    } else {
      caps.push({ kind: "quiet", acc: !!g.acc, at: r3(a), end: e, words: g.ks.map((k) => ({ x: clean(k).toLowerCase(), t: r3(Math.max(a, wt(k))) })) });
      if (g.acc) sfx.push({ f: "tick.mp3", at: a - 0.02, vol: 0.22 });
    }
  });
  t = end;
}
const title = "Delusional Until It Becomes Real";
ends.push({ at: r3(t + 0.3), end: r3(t + 4.3), text: title });
const FILM = r3(q(t + 4.6));

// ---- music: three mysterious, suspenseful tracks, one per chapter, 5 s crossfades
const MV = 0.42;
const tracks = [["hiding-your-reality.mp3", 0, 0], ["interloper.mp3", 0, 0], ["crypto.mp3", 0, 0]];
// one track per stretch: the first under the opening and chapter I, then a new track as each later chapter's card begins
const starts = [0, ...chaps.slice(1).map((c) => c.at)];
const music = tracks.map(([f], i) => {
  const at = Math.max(0, starts[i] - (i ? 2.5 : 0)), end = i + 1 < starts.length ? starts[i + 1] + 2.5 : FILM + 0.1;
  return { f, at: r3(at), len: r3(Math.min(dur("assets/music/" + f) - 1.5, end - at)) };
});

// ---- pages
const tpl = fs.readFileSync(path.join(ROOT, "src/captions.html"), "utf8");
fs.writeFileSync(path.join(ROOT, "captions.html"), tpl.replace("{{data}}", JSON.stringify({ caps, chaps, ends })));
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
