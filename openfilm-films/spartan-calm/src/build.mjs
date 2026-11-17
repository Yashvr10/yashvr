// Builds film.html + stage.html for the self-hypnosis film from src/scenes.json, the narration (assets/vo/*.mp3) and its
// word timings (assets/vo/*.words.json). Style: src/../style.md (reel DezFTyktEUp pacing, cuts, grids, captions;
// Video-43179 emphasis; "FOOLISH PUPPET" chapter layout with the "rishot4rx." letter fade).
//   node src/build.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const J = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const cfg = J("src/scenes.json"), POOLS = J("src/images.json");
const FPS = 30, F = 1 / FPS;
const q = (x) => Math.round(x * FPS) / FPS;            // snap to the frame grid
const r3 = (x) => Math.round(x * 1000) / 1000;
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
const dur = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(ROOT, f)]).toString();
let seed = 7; const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

// ---- images: least-used first within a theme, the whole collection as fallback; never the same picture twice in a row
const uses = {}; const ALL = [...new Set(Object.values(POOLS).flat())]; ALL.forEach((k) => (uses[k] = 0));
let last = [];
const ALIAS = { hoplite: ["sparta", "battle"], statue: ["sparta", "face"], shield: ["sparta", "battle"], helmet: ["sparta", "battle"], spear: ["battle", "sparta"],
  feet: ["march", "boy"], hands: ["face", "hunger"], reeds: ["river"], door: ["greece", "hunger"], wrestle: ["athlete", "boy", "sparta"], crowd: ["march", "orator"] };
function pick(themes) {
  const cand = [...new Set(themes.flatMap((x) => ALIAS[x] || [x]))].flatMap((t) => POOLS[t] || []).filter((k) => !last.includes(k));
  let best = cand.sort((a, b) => uses[a] - uses[b] || rnd() - 0.5)[0];
  if (!best || uses[best] >= 2) best = ALL.filter((k) => !last.includes(k)).sort((a, b) => uses[a] - uses[b] || rnd() - 0.5)[0];
  uses[best]++; last = [best, ...last].slice(0, 6); return best;
}
const gsize = (k) => execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=width,height", "-of", "csv=p=0", path.join(ROOT, `assets/grid/${k}.jpg`)]).toString().trim().split(",").map(Number);

const BG = J("src/beats.json"), BEAT = BG.period, PH = BG.phase || 0;   // music starts at film time 0, from BG.music_in in the track
const beatAt = (x) => PH + Math.round((x - PH) / BEAT) * BEAT, beatAfter = (x) => PH + Math.ceil((x - PH) / BEAT - 1e-6) * BEAT;
const shots = [], cards = [], emph = [], chaps = [], caps = [], rects = [], vo = [], sfx = [];
const SLOTS = [[60, 40], [520, 60], [980, 40], [1440, 60], [80, 730], [540, 750], [1000, 730], [1460, 750]];  // top row, bottom row
let t = 1.0, cutN = 0, chapN = 0;
const chapterTimes = [];
for (const s of cfg.scenes) {
  if (s.card) {
    chapN++; chapterTimes.push([t, s.a + " " + s.b]);
    chaps.push({ at: r3(q(t)), end: r3(q(t + s.len)), a: s.a, b: s.b, seed: chapN * 31 });
    sfx.push({ f: "swell.mp3", at: t - 0.2, vol: 0.45 }, { f: "thump.mp3", at: beatAt(t + 0.95), vol: 0.5 });
    t = q(t + s.len); continue;
  }
  const vlen = dur(`assets/vo/${s.id}.mp3`);
  const ws = J(`assets/vo/${s.id}.words.json`);
  const voAt = t, end = q(voAt + vlen + s.gap);
  vo.push({ id: s.id, at: voAt });
  const wt = (k) => q(voAt + ws[k].start);
  const card = s.grid || s.grey;

  // emphasis words: from the word's start until the next word starts (at least 0.45 s, a beat longer at a sentence end)
  const E = new Set();
  for (const e of s.emph) {
    const k = ws.findIndex((w, i) => norm(w.word) === norm(e) && !E.has(i));
    if (k < 0) { console.warn("emphasis not found:", s.id, e); continue; }
    E.add(k);
    const a = wt(k), b = k + 1 < ws.length ? Math.max(wt(k + 1), a + 0.45) : end;
    emph.push({ at: r3(a), end: r3(q(Math.min(b, end))), text: ws[k].word.replace(/[^A-Za-z0-9'’-]/g, "").toUpperCase() });
    sfx.push({ f: "thump.mp3", at: a - 0.02, vol: 0.55 }, { f: "swish.mp3", at: a - 0.18, vol: 0.3 });
  }

  // captions: phrases of up to 4 words (break at punctuation), spread across one line, each word popping on as spoken
  const phrases = []; let cur = [];
  ws.forEach((w, k) => {
    if (E.has(k)) { if (cur.length) phrases.push(cur); cur = []; return; }
    cur.push(k); if (cur.length >= 4 || /[.,;:?!]$/.test(w.word)) { phrases.push(cur); cur = []; }
  });
  if (cur.length) phrases.push(cur);
  phrases.forEach((p, i) => {
    let a = wt(p[0]);
    for (const m of emph) if (a >= m.at && a < m.end) a = m.end;   // never under an emphasis word still on screen
    let b = i + 1 < phrases.length ? wt(phrases[i + 1][0]) : end;
    const nextE = [...E].map(wt).filter((x) => x > a).sort((x, y) => x - y)[0];
    if (nextE !== undefined) b = Math.min(b, nextE);
    if (b - a < 0.1) return;
    const words = p.map((k) => ({ x: ws[k].word, t: r3(wt(k)) }));
    caps.push({ at: r3(a), end: r3(b), words, dark: !!card });
  });

  // pictures
  if (card) {
    const c = { at: r3(t), end: r3(end) };
    if (s.grid) {
      const n = 8, slots = SLOTS.slice().sort(() => rnd() - 0.5);
      const step = (end - beatAfter(t + 0.05)) / n >= BEAT * 0.95 ? BEAT : BEAT / 2;
      c.pics = slots.slice(0, n).map(([x, y], i) => {
        const k = pick([s.grid, ...s.th]); const [w, h] = gsize(k); const box = 420, sc = Math.min(box / w, 290 / h) * (0.9 + rnd() * 0.15);
        const at = r3(q(beatAfter(t + 0.05) + i * step));
        sfx.push({ f: "tick.mp3", at, vol: 0.35 });
        return { src: `assets/grid/${k}.jpg`, x: Math.round(x + (box - w * sc) / 2), y: Math.round(y + (290 - h * sc) / 2 * (y < 500 ? 1 : 0)), w: Math.round(w * sc), h: Math.round(h * sc), at };
      });
    } else sfx.push({ f: "tick.mp3", at: t, vol: 0.4 });
    cards.push(c);
    // a flash of white as the card arrives
    rects.push({ at: r3(t), end: r3(t + 2 * F), x: 0, y: 0, w: 1920, h: 1080, c: "#fff" });
  } else {
    // cut points: the sentence start, then a word start every ~1.1-1.5 s, and right after each emphasis word
    let cuts = [t];
    if (s.burst) {   // ~12 cuts in a second: 2-3 frame shots
      let x = t; for (let i = 0; i < 11; i++) { x = q(x + (i % 3 ? 2 : 3) * F); cuts.push(x); }
      sfx.push({ f: "swish.mp3", at: t, vol: 0.4 });
    }
    const after = cuts[cuts.length - 1];
    let lastCut = after;
    for (let k = 0; k < ws.length; k++) if (E.has(k) && k + 1 < ws.length) { const y = beatAfter(Math.max(wt(k + 1), wt(k) + 0.45)); if (y < end - 0.35) cuts.push(q(y)); }
    for (let b = beatAfter(lastCut + 0.5); b < end - 0.35; b += BEAT) if (Math.round((b - PH) / BEAT) % 2 === 0) cuts.push(q(b));
    cuts.sort((a, b) => a - b); cuts = cuts.filter((x, i) => i === 0 || x - cuts[i - 1] > 0.5);
    cuts = [...new Set(cuts.map(r3))].sort((a, b) => a - b);
    let th = 0;
    cuts.forEach((a, i) => {
      const b = i + 1 < cuts.length ? cuts[i + 1] : end;
      if (b - a < F / 2) return;
      const k = pick(i > 0 && i % 2 === 0 ? [s.th[(++th) % s.th.length]] : [s.th[th % s.th.length]]);
      shots.push({ at: r3(a), len: r3(b - a), k, kb: b - a > 0.5 ? (cutN % 2 ? "in" : "out") : "" });
      // transitions at the cut (reel): a 2-frame negative of the incoming shot, or a flat grey/white rectangle
      if (i > 0 && b - a > 0.3) {
        cutN++;
        if (cutN % 4 === 1) { shots.push({ at: r3(a), len: r3(2 * F), k, inv: true }); sfx.push({ f: "kick.mp3", at: a, vol: 0.25 }); }
        else if (cutN % 4 === 3) {
          const w = 500 + Math.round(rnd() * 700), h = 300 + Math.round(rnd() * 400);
          rects.push({ at: r3(a - 2 * F), end: r3(a + F), x: Math.round(rnd() * (1920 - w)), y: Math.round(rnd() * (1080 - h)), w, h, c: rnd() < 0.5 ? "#e8e8e6" : "#9a9a98" });
        }
      }
    });
  }
  t = end;
}
const FILM = r3(q(t + 1.6));
const credits = { end: FILM };

// ---- write stage.html and film.html
fs.writeFileSync(path.join(ROOT, "stage.html"), fs.readFileSync(path.join(ROOT, "src/stage.html"), "utf8").replace("{{data}}", JSON.stringify({ cards, emph, chaps, caps, rects })));
fs.copyFileSync(path.join(ROOT, "src/grain.html"), path.join(ROOT, "grain.html"));
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
  .shot { object-fit: cover; filter: brightness(.86); }
  .inv { object-fit: cover; filter: invert(1) contrast(1.15); }
  @keyframes kb-in { from { scale: 1.0 } to { scale: 1.05 } }
  @keyframes kb-out { from { scale: 1.05 } to { scale: 1.0 } }
  .kb-in { animation: kb-in var(--clip-length) linear both; }
  .kb-out { animation: kb-out var(--clip-length) linear both; }
</style>
</head>
<body>`);
L.push(`<section>\n  <iframe id="grain" src="grain.html#t=0,${FILM}"></iframe>\n</section>`);
L.push(`<section>\n  <iframe id="stage" src="stage.html#t=0,${FILM}"></iframe>\n</section>`);
L.push(`<section>\n${shots.filter((x) => x.inv).map((x, i) => `  <img id="inv-${i}" src="assets/photos169/${x.k}.jpg#t=0,${x.len}" at="${x.at}" class="inv">`).join("\n")}\n</section>`);
L.push(`<section>\n${shots.filter((x) => !x.inv).map((x, i) => `  <img id="shot-${i}" src="assets/photos169/${x.k}.jpg#t=0,${x.len}" at="${x.at}" class="shot${x.kb ? " kb-" + x.kb : ""}">`).join("\n")}\n</section>`);
L.push(`<section>\n${vo.map((x) => `  <audio id="vo-${x.id}" src="assets/vo/${x.id}.mp3" at="${r3(x.at)}"></audio>`).join("\n")}\n</section>`);
// the track runs out before the film: a second pass from the same point, started on a whole number of beats so the
// beat grid carries on, crossfading in over the last seconds of the first pass
const TRACK_LEN = +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(ROOT, "assets/music/" + BG.track)]).toString();
const firstLen = Math.min(FILM, TRACK_LEN - BG.music_in - 0.05);
L.push(`<section>\n  <audio id="music" src="assets/music/${BG.track}#t=${BG.music_in},${r3(BG.music_in + firstLen)}" at="0" volume="${MV.vol}" overrides='[{"fade":[0.4,${firstLen < FILM ? 4 : 2.5}]}]'></audio>\n</section>`);
if (firstLen < FILM) {
  const at2 = Math.floor((firstLen - 4) / BEAT) * BEAT;
  L.push(`<section>\n  <audio id="music-2" src="assets/music/${BG.track}#t=${BG.music_in},${r3(BG.music_in + FILM - at2)}" at="${r3(at2)}" volume="${MV.vol}" overrides='[{"fade":[4,2.5]}]'></audio>\n</section>`);
}
tracks.forEach((tr) => L.push(`<section>\n${tr.clips.map((x) => `  <audio src="assets/sfx/${x.f}" at="${r3(x.at)}" volume="${x.vol}"></audio>`).join("\n")}\n</section>`));
L.push(`</body>\n</html>\n`);
fs.writeFileSync(path.join(ROOT, "film.html"), L.join("\n"));
const mmss = (x) => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, "0")}`;
console.log(`film.html ${mmss(FILM)} (${FILM}s): ${shots.length} shots, ${new Set(shots.map((x) => x.k)).size} pictures, ${cards.length} cards, ${emph.length} emphasis, ${caps.length} caption lines, ${sfx.length} sounds`);
console.log("chapters:", chapterTimes.map(([a, n]) => mmss(a) + " " + n).join(" | "));
fs.writeFileSync(path.join(ROOT, "src/chapters.json"), JSON.stringify(chapterTimes));
