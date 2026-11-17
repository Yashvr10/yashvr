// Builds film.html + stage.html for "The Spartan Secret to Staying Calm Under Pressure".
// Look (the user's references):
//   pictures  gritty black and white with a red square on each face (src/look.py; "they say ego, I say standards")
//   layout    three portrait panels side by side, a new picture cutting into one slot on each beat, now and then a wide
//             picture slamming in on top, tilted, with a shadow (reel DdpRKIjIRps); some sentences full frame
//   captions  one word at a time, white sans; emphasis words in red condensed capitals (reel Df09Ol1ujQm)
//   chapters  small white Bebas word in front of a huge red one, letters fading in at random (as in the last film)
//   opening   black, then the heading (the user's note on the last film)
//   node src/build.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const cfg = J("src/scenes.json"), POOLS = J("src/images.json");
const FPS = 30, F = 1 / FPS;
const q = (x) => Math.round(x * FPS) / FPS;
const r3 = (x) => Math.round(x * 1000) / 1000;
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
const dur = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(ROOT, f)]).toString();
let seed = 11; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

const FACES = new Set(J("src/faces-ok.json"));
const ALIAS = { hoplite: ["sparta", "battle", "helmet"], statue: ["sparta", "face", "greece"], shield: ["sparta", "battle"], helmet: ["helmet", "sparta"],
  feet: ["march", "boy"], hands: ["face", "hunger"], reeds: ["river"], door: ["greece", "hunger"], sea: ["storm"], crowd: ["march", "orator"] };
const expand = (ths) => [...new Set(ths.flatMap((x) => ALIAS[x] || [x]))];
// archival footage (src/footage.py): 3.2 s shots, used for about a third of the beats
const CLIPS = fs.existsSync(path.join(ROOT, "src/clips.json")) ? J("src/clips.json") : {};
const CLIPALIAS = { hoplite: ["march", "battle"], sparta: ["march", "athlete"], boy: ["boy", "athlete"], hunger: ["crowd", "face"], persia: ["march", "battle"],
  archer: ["battle"], sun: ["storm", "mountain"], greece: ["mountain", "crowd"], scholar: ["orator", "face"], mother: ["face", "crowd"], helmet: ["march"], statue: ["face"] };
const cuses = {}; Object.values(CLIPS).flat().forEach((k) => (cuses[k] = 0));
let crecent = [];
function pickClip(themes) {
  const ths = [...new Set(themes.flatMap((x) => [x, ...(CLIPALIAS[x] || [])]))];
  let cand = ths.flatMap((x) => CLIPS[x] || []).filter((k) => !crecent.includes(k) && cuses[k] < 2);
  if (!cand.length) cand = Object.keys(cuses).filter((k) => !crecent.includes(k) && cuses[k] < 2);
  const k = cand.sort((a, b) => cuses[a] - cuses[b] || rnd() - 0.5)[0];
  if (k) { cuses[k]++; crecent = [k, ...crecent].slice(0, 8); }
  return k;
}
const uses = {}; const ALL = [...new Set(Object.values(POOLS).flat())]; ALL.forEach((k) => (uses[k] = 0));
let recent = [];
function pick(themes, wantFace = false) {
  const ok = (k) => !recent.includes(k);
  let cand = expand(themes).flatMap((t) => POOLS[t] || []).filter(ok);
  if (wantFace && cand.some((k) => FACES.has(k))) cand = cand.filter((k) => FACES.has(k));
  let best = cand.sort((a, b) => uses[a] - uses[b] || rnd() - 0.5)[0];
  if (!best || uses[best] >= 2) best = ALL.filter(ok).sort((a, b) => uses[a] - uses[b] || rnd() - 0.5)[0];
  uses[best]++; recent = [best, ...recent].slice(0, 10); return best;
}

const panels = [[], [], []], fulls = [], tilts = [], chaps = [], caps = [], vo = [], sfx = [];
let t = 1.0, chapN = 0, beat = 0, panelsLive = false;
const closePanels = (at) => { for (const p of panels) { const l = p[p.length - 1]; if (l && l.end == null) l.end = at; } panelsLive = false; };
const putPanel = (slot, k, at, clip) => { const p = panels[slot]; const l = p[p.length - 1]; if (l && l.end == null) l.end = at; p.push(clip ? { clip, at } : { k, at }); };
const chapterTimes = [];
for (const s of cfg.scenes) {
  if (s.card) {
    closePanels(t); chapN++; chapterTimes.push([t, s.a + " " + s.b]);
    chaps.push({ at: r3(q(t)), end: r3(q(t + s.len)), a: s.a, b: s.b, seed: chapN * 31 });
    sfx.push({ f: "swell.mp3", at: t - 0.2, vol: 0.45 }, { f: "thump.mp3", at: t + 0.95, vol: 0.5 });
    t = q(t + s.len); continue;
  }
  const vlen = dur(`assets/vo/${s.id}.mp3`);
  const ws = J(`assets/vo/${s.id}.words.json`);
  const voAt = t, end = q(voAt + vlen + s.gap);
  vo.push({ id: s.id, at: voAt });
  const wt = (k) => q(voAt + ws[k].start);

  // captions: every spoken word on its own, from its start to the next word's start (a beat longer at a pause)
  const E = new Set(s.emph.map(norm));
  ws.forEach((w, k) => {
    const a = wt(k), nxt = k + 1 < ws.length ? wt(k + 1) : end - 0.1;
    const em = E.has(norm(w.word));
    const b = Math.min(Math.max(nxt, a + (em ? 0.5 : 0.2)), k + 1 < ws.length ? wt(k + 1) + (em ? 0.25 : 0) : end - 0.05);
    const x = em ? w.word.replace(/[^A-Za-z0-9'’-]/g, "").toUpperCase() : w.word.replace(/[“”"]/g, "");
    caps.push({ at: r3(a), end: r3(Math.min(b, end)), x, em });
    if (em) sfx.push({ f: "thump.mp3", at: a - 0.02, vol: 0.45 });
  });

  // beats: a word start every ~1.25-1.6 s
  const beats = [t]; let want = t + 1.25 + rnd() * 0.35;
  for (let k = 0; k < ws.length; k++) { const x = wt(k); if (x >= want && x < end - 0.45) { beats.push(x); want = x + 1.25 + rnd() * 0.35; } }
  let th = 0; const theme = () => [s.th[th++ % s.th.length]];
  if (s.full) {
    closePanels(t);
    beats.forEach((a, i) => {
      const b = i + 1 < beats.length ? beats[i + 1] : end, th0 = theme();
      const c = (i % 2 === 1 || rnd() < 0.3) && b - a <= 3.1 ? pickClip(th0) : null;
      fulls.push(c ? { at: r3(a), len: r3(b - a), clip: c } : { at: r3(a), len: r3(b - a), k: pick(th0, true), kb: i % 2 ? "out" : "in" });
    });
  } else {
    beats.forEach((a, i) => {
      if (!panelsLive) {        // fill all three slots, one after another, a few frames apart
        [0, 1, 2].forEach((slot, j) => putPanel(slot, pick(theme(), j === 1), q(a + j * 4 * F)));
        sfx.push({ f: "tick.mp3", at: a, vol: 0.3 }); panelsLive = true; return;
      }
      beat++;
      if (beat % 7 === 0 && i + 1 < beats.length) {   // a wide picture slams in on top, tilted, with a shadow
        const b = Math.min(i + 1 < beats.length ? beats[i + 1] : end, a + 1.4);
        tilts.push({ at: r3(a), len: r3(b - a), k: pick(theme()), rot: (rnd() < 0.5 ? -1 : 1) * (2 + rnd() * 3), x: 300 + Math.round(rnd() * 120), y: 150 + Math.round(rnd() * 60) });
        sfx.push({ f: "kick.mp3", at: a, vol: 0.35 }); return;
      }
      const th0 = theme(), nb = i + 1 < beats.length ? beats[i + 1] : end;
      const c = rnd() < 0.36 ? pickClip(th0) : null;
      putPanel([0, 2, 1][beat % 3], c ? null : pick(th0, beat % 5 === 2), a, c);
      sfx.push({ f: "tick.mp3", at: a, vol: 0.22 });
    });
  }
  t = end;
}
closePanels(t);
for (const p of panels) for (let i = 0; i < p.length; i++) {
  const x = p[i]; if (x.clip && x.end - x.at > 3.1) { const nx = { k: pick(["sparta", "battle", "greece"]), at: q(x.at + 3.1), end: x.end }; x.end = nx.at; p.splice(i + 1, 0, nx); }
}
const FILM = r3(q(t + 1.0));

// ---- write the pages
fs.writeFileSync(path.join(ROOT, "stage.html"), fs.readFileSync(path.join(ROOT, "src/stage.html"), "utf8").replace("{{data}}", JSON.stringify({ cards: [], emph: [], chaps, caps, rects: [] })));
for (const x of sfx) x.len = dur("assets/sfx/" + x.f);
sfx.sort((a, b) => a.at - b.at);
const tracks = [];
for (const x of sfx) { x.at = Math.max(0, x.at); let tr = tracks.find((k) => k.end <= x.at + 0.001); if (!tr) tracks.push((tr = { end: 0, clips: [] })); tr.clips.push(x); tr.end = x.at + x.len; }
const MV = J("src/music-vol.json");
const L = [];
L.push(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1920, height=1080">
<title>The Spartan Secret to Staying Calm Under Pressure</title>
<style>
  .full { object-fit: cover; }
  .panel { object-fit: cover; top: 0; width: 640px; height: 1080px; }
  .tilt { object-fit: cover; width: 1180px; height: 664px; box-shadow: 0 30px 70px rgba(0,0,0,.75); outline: 6px solid #111; }
  @keyframes kb-in { from { scale: 1.0 } to { scale: 1.05 } }
  @keyframes kb-out { from { scale: 1.05 } to { scale: 1.0 } }
  @keyframes slam { from { scale: 1.08 } to { scale: 1 } }
  .kb-in { animation: kb-in var(--clip-length) linear both; }
  .kb-out { animation: kb-out var(--clip-length) linear both; }
</style>
</head>
<body>`);
L.push(`<section>\n  <iframe id="stage" src="stage.html#t=0,${FILM}"></iframe>\n</section>`);
L.push(`<section>\n${tilts.map((x, i) => `  <img id="tilt-${i}" src="assets/photos169/${x.k}.jpg#t=0,${x.len}" at="${x.at}" class="tilt" style="left: ${x.x}px; top: ${x.y}px; rotate: ${x.rot.toFixed(1)}deg; animation: slam .12s ease-out both">`).join("\n")}\n</section>`);
L.push(`<section>\n${fulls.map((x, i) => x.clip ? `  <video id="full-${i}" src="assets/clips/${x.clip}.mp4#t=0,${x.len}" at="${x.at}" class="full" volume="0"></video>` : `  <img id="full-${i}" src="assets/photos169/${x.k}.jpg#t=0,${x.len}" at="${x.at}" class="full kb-${x.kb}">`).join("\n")}\n</section>`);
panels.forEach((p, slot) => L.push(`<section>\n${p.filter((x) => x.end - x.at > F / 2).map((x, i) => x.clip
  ? `  <video id="p${slot}-${i}" src="assets/clips/${x.clip}-p.mp4#t=0,${r3(x.end - x.at)}" at="${r3(x.at)}" class="panel" style="left: ${slot * 640}px" volume="0"></video>`
  : `  <img id="p${slot}-${i}" src="assets/panels/${x.k}.jpg#t=0,${r3(x.end - x.at)}" at="${r3(x.at)}" class="panel" style="left: ${slot * 640}px">`).join("\n")}\n</section>`));
L.push(`<section>\n${vo.map((x) => `  <audio id="vo-${x.id}" src="assets/vo/${x.id}.mp3" at="${r3(x.at)}"></audio>`).join("\n")}\n</section>`);
L.push(`<section>\n  <audio id="music" src="assets/music/trap-bells.mp3#t=${MV.in},${r3(MV.in + FILM)}" at="0" volume="${MV.vol}" overrides='[{"fade":[0.5,3]}]'></audio>\n</section>`);
tracks.forEach((tr) => L.push(`<section>\n${tr.clips.map((x) => `  <audio src="assets/sfx/${x.f}" at="${r3(x.at)}" volume="${x.vol}"></audio>`).join("\n")}\n</section>`));
L.push(`</body>\n</html>\n`);
fs.writeFileSync(path.join(ROOT, "film.html"), L.join("\n"));
const mmss = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;
const nP = panels.flat().length; const nC = panels.flat().filter((x) => x.clip).length + fulls.filter((x) => x.clip).length;
console.log(`film.html ${mmss(FILM)} (${FILM}s): ${nP} panel cuts, ${fulls.length} full-frame shots, ${tilts.length} tilted slams, ${nC} footage shots, ${new Set([...panels.flat(), ...fulls, ...tilts].filter((x) => x.k).map((x) => x.k)).size} pictures, ${caps.length} caption words, ${sfx.length} sounds`);
console.log("chapters:", chapterTimes.map(([a, n]) => mmss(a) + " " + n).join(" | "));
