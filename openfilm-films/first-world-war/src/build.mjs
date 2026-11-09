// Builds film.html and the generated pages from src/scenes.json, the narration (assets/vo/*.mp3) and its word
// timings (assets/vo/*.vtt). The voice sets the length: each scene lasts its narration plus a little air.
//
//   node src/build.mjs            (run in the film's folder)
//
// Pages: src/pages/<name>.html are templates. {{head}}, {{maphead}}, {{len}}, {{title}}, {{num}}, {{kicker}},
// {{name}} are filled in, and {{cue:word}} (or {{cue:word#2}} for its second time) becomes the second, from the
// clip's start, at which the narrator says that word, so a map lights a country as it is named.

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, "src/scenes.json"), "utf8"));
const tpl = (n) => fs.readFileSync(path.join(ROOT, "src/pages", n + ".html"), "utf8");
const HEAD = tpl("_head");
const MAPHEAD = tpl("_maphead").replace("{{head}}", HEAD);
const r3 = (x) => Math.round(x * 1000) / 1000;
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
const dur = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(ROOT, f)]).toString();

const LEAD = 0.3;   // air before the voice
const TAIL = 0.4;   // air after it
const FADE = 0.35;  // each shot's way in and out (a short dip between shots)

// ---- words: from each scene's .vtt, [{ w, t }] with t from the voice's start ----
function words(id) {
  const vtt = fs.readFileSync(path.join(ROOT, "assets/vo", id + ".vtt"), "utf8");
  const sec = (s) => { const [h, m, x] = s.split(":"); return +h * 3600 + +m * 60 + +x; };
  const out = [];
  for (const block of vtt.split(/\n\n+/)) {
    const m = block.match(/^(\S+) --> \S+\n([\s\S]*)$/);
    if (!m) continue;
    let t = sec(m[1]);
    for (const tok of m[2].split(/\s+/)) {
      const tm = tok.match(/^<([\d:.]+)>(.*)$/);
      if (tm) { t = sec(tm[1]); out.push({ w: norm(tm[2]), t }); } else if (tok) out.push({ w: norm(tok), t });
    }
  }
  return out;
}
function cueTime(ws, key) {
  const [w, nth = "1"] = key.split("#");
  const hits = ws.filter((x) => x.w === norm(w));
  if (hits.length < +nth) throw new Error(`cue "${key}" not in the narration`);
  return hits[+nth - 1].t;
}

// ---- lay out the scenes ----
let t = 0;
const shots = [], pages = [], lts = [], leaks = [], vo = [], sfx = [];
const chapters = [];
for (const s of cfg.scenes) {
  if (s.card) {
    const len = s.len;
    const name = s.card === "chapter" ? `ch${chapters.length + 1}` : s.card;
    if (s.card === "chapter") chapters.push(t);
    const html = tpl(s.card).replaceAll("{{head}}", HEAD).replaceAll("{{len}}", len)
      .replaceAll("{{num}}", s.num || "").replaceAll("{{title}}", s.title || "");
    fs.writeFileSync(path.join(ROOT, name + ".html"), html);
    pages.push({ id: name, src: name + ".html", at: t, len, fade: s.card === "title" ? [0.8, 0.6] : [0.25, 0.4] });
    if (s.card !== "end") sfx.push({ f: "hf-impact-bass-1.mp3", at: t + 0.05, vol: 0.5 });
    s._t = t; s._len = len;
    t += len;
    continue;
  }
  const vlen = dur(`assets/vo/${s.id}.mp3`);
  const ws = words(s.id);
  const len = LEAD + vlen + TAIL;
  const voAt = t + LEAD;
  s._t = t; s._len = len; s._voAt = voAt; s._ws = ws;
  vo.push({ id: s.id, at: voAt });
  // split the scene among its visuals: at a cue word ("cut"), else by weight
  const vs = s.visuals;
  const starts = [t];
  let acc = 0; const wsum = vs.reduce((a, v) => a + (v.w || 1), 0);
  for (let i = 1; i < vs.length; i++) {
    acc += vs[i - 1].w || 1;
    starts.push(vs[i].cut ? voAt + cueTime(ws, vs[i].cut) - 0.3 : t + (len * acc) / wsum);
  }
  vs.forEach((v, i) => {
    const at = starts[i], end = i + 1 < vs.length ? starts[i + 1] : t + len, vl = end - at;
    const cue = (key) => r3(voAt + cueTime(ws, key) - at);
    if (v.photo) {
      shots.push({ id: `${s.id}-${v.photo}`, photo: v.photo, at, len: vl, kb: v.kb, focus: v.focus });
    } else {
      const html = tpl(v.page).replaceAll("{{maphead}}", MAPHEAD).replaceAll("{{head}}", HEAD).replaceAll("{{len}}", r3(vl))
        .replace(/\{\{cue:([^}]+)\}\}/g, (_, k) => cue(k));
      fs.writeFileSync(path.join(ROOT, v.page + ".html"), html);
      pages.push({ id: v.page, src: v.page + ".html", at, len: vl, fade: [FADE, FADE] });
    }
    if (v.lt) {
      const name = `lt-${s.id}`;
      const L = r3(Math.min(5.2, vl - 0.9));
      const html = tpl("lt").replaceAll("{{head}}", HEAD).replaceAll("{{len}}", L)
        .replaceAll("{{kicker}}", v.lt[1]).replaceAll("{{name}}", v.lt[0]);
      fs.writeFileSync(path.join(ROOT, name + ".html"), html);
      lts.push({ id: name, src: name + ".html", at: at + 0.6, len: L });
      sfx.push({ f: "hf-typing.mp3", at: at + 0.65, vol: 0.22 });
    }
    if (v.leak) leaks.push({ at: at + 0.4 });
  });
  t += len;
}
const FILM = r3(t);
for (const n of ["grain", "leak"]) fs.writeFileSync(path.join(ROOT, n + ".html"), tpl(n).replaceAll("{{head}}", HEAD));

// ---- sound effects at story moments (scene, word or offset) ----
const S = Object.fromEntries(cfg.scenes.map((s) => [s.id, s]));
const atWord = (id, key, d = 0) => S[id]._voAt + cueTime(S[id]._ws, key) + d;
sfx.push(
  { f: "distant-thunder-rumble-202961.mp3", at: S.s01._t + 0.2, vol: 0.55 },
  { f: "distant-explosion-rumble-0d81c0.mp3", at: S.s01._t + 4.2, vol: 0.5 },
  { f: "distant-explosion-rumble-0d81c0.mp3", at: S.s02._t + 2.5, vol: 0.4 },
  { f: "single-low-hit-cebd39.mp3", at: atWord("s04", "shot"), vol: 0.75 },
  ...["declared", "mobilised", "russia#2", "france", "marched", "britain"].map((k) => ({ f: "telegraph-key-ticks-3e7c48.mp3", at: atWord("s05", k, -0.15), vol: 0.28 })),
  { f: "distant-thunder-rumble-202961.mp3", at: S.s10._t + 0.3, vol: 0.45 },
  { f: "distant-church-bell-fe3669.mp3", at: S.s11._t + 0.6, vol: 0.3 },
  { f: "gas-venting-hiss-0c7a49.mp3", at: atWord("s12", "chlorine", -0.1), vol: 0.35 },
  { f: "ship-deck-at-sea-0ecce7.mp3", at: S.s14._t + 0.2, vol: 3 },
  { f: "distant-explosion-rumble-0d81c0.mp3", at: S.s15._t + 1.5, vol: 0.45 },
  { f: "distant-explosion-rumble-0d81c0.mp3", at: S.s15._t + 5.2, vol: 0.35 },
  { f: "distant-explosion-rumble-0d81c0.mp3", at: S.s16._t + 1.0, vol: 0.45 },
  { f: "telegraph-key-ticks-3e7c48.mp3", at: atWord("s18", "telegram", -0.2), vol: 0.3 },
  { f: "distant-thunder-rumble-202961.mp3", at: S.s20._t + 0.3, vol: 0.4 },
  { f: "distant-church-bell-toll-f328e5.mp3", at: atWord("s22", "oclock", 0.3), vol: 0.45 },
  { f: "distant-church-bell-fe3669.mp3", at: atWord("s22", "oclock", 2.6), vol: 0.3 },
);
for (const x of sfx) x.len = dur("assets/sfx/" + x.f);
sfx.sort((a, b) => a.at - b.at);
const sfxTracks = [];
for (const x of sfx) {
  let tr = sfxTracks.find((tk) => tk.end <= x.at + 0.001);
  if (!tr) sfxTracks.push((tr = { end: 0, clips: [] }));
  tr.clips.push(x); tr.end = x.at + x.len;
}

// ---- music: Grieg under chapters I-II, Holst's Mars under III-IV, Grieg again under V, the Last Post at the end ----
const end = S.end._t;
const music = [
  { id: "music-aase-1", src: "assets/music/aase.mp3", in: 0, at: 0, len: chapters[2] + 0.6 - 0, vol: 0.6, fade: [2.5, 2.2] },
  { id: "music-mars", src: "assets/music/mars.mp3", in: 0, at: chapters[2], len: chapters[4] + 0.6 - chapters[2], vol: 0.3, fade: [0.4, 2.4] },
  { id: "music-aase-2", src: "assets/music/aase.mp3", in: 95, at: chapters[4], len: end + 1.0 - chapters[4], vol: 0.6, fade: [2.0, 3.0] },
  { id: "music-last-post", src: "assets/music/last-post.mp3", in: 0, at: end - 0.3, len: FILM - end + 0.3, vol: 0.55, fade: [0.2, 2.5] },
];

// ---- photos: their look and their slow move ----
const PAINTED = new Set(["gassed", "amiens", "versailles", "petit-journal"]);
const COLOUR = new Set(["armistice"]);
const ext = (p) => fs.existsSync(path.join(ROOT, "assets/photos", p + ".png")) ? ".png" : ".jpg";

const ov = (fade) => ` overrides='[{"fade":[${fade[0]},${fade[1]}]}]'`;
const L = [];
L.push(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1920, height=1080">
<title>The First World War</title>
<style>
  /* Photographs fill the frame; a slow move over each (Ken Burns), timed to the clip with --clip-length. */
  .photo { object-fit: cover; }
  .archival { filter: grayscale(1) sepia(.22) contrast(1.08) brightness(.94); }
  .painted { filter: saturate(.78) contrast(1.04) brightness(.95); }
  .colour { filter: saturate(.7) sepia(.15) contrast(1.05); }
  @keyframes kb-in { from { scale: 1.02 } to { scale: 1.13 } }
  @keyframes kb-out { from { scale: 1.14 } to { scale: 1.02 } }
  @keyframes kb-left { from { scale: 1.12; translate: 2.4% 0 } to { scale: 1.12; translate: -2.4% 0 } }
  @keyframes kb-right { from { scale: 1.12; translate: -2.4% 0 } to { scale: 1.12; translate: 2.4% 0 } }
  @keyframes kb-up { from { scale: 1.14; translate: 0 3% } to { scale: 1.14; translate: 0 -3% } }
  @keyframes kb-down { from { scale: 1.14; translate: 0 -3% } to { scale: 1.14; translate: 0 3% } }
  .kb-in { animation: kb-in var(--clip-length) linear both; }
  .kb-out { animation: kb-out var(--clip-length) linear both; }
  .kb-left { animation: kb-left var(--clip-length) linear both; }
  .kb-right { animation: kb-right var(--clip-length) linear both; }
  .kb-up { animation: kb-up var(--clip-length) linear both; }
  .kb-down { animation: kb-down var(--clip-length) linear both; }
</style>
</head>
<body>`);
L.push(`<section>\n  <iframe id="grain" src="grain.html#t=0,${FILM}"></iframe>\n</section>`);
L.push(`<section>\n${leaks.map((x, i) => `  <iframe id="leak-${i + 1}" src="leak.html" at="${r3(x.at)}"></iframe>`).join("\n")}\n</section>`);
L.push(`<section>\n${lts.map((x) => `  <iframe id="${x.id}" src="${x.src}" at="${r3(x.at)}"></iframe>`).join("\n")}\n</section>`);
L.push(`<section>\n${pages.map((x) => `  <iframe id="${x.id}" src="${x.src}${x.src.startsWith("ch") || ["title.html", "end.html"].includes(x.src) ? "" : `#t=0,${r3(x.len)}`}" at="${r3(x.at)}"${ov(x.fade)}></iframe>`).join("\n")}\n</section>`);
L.push(`<section>\n${shots.map((x) => {
  const look = PAINTED.has(x.photo) ? "painted" : COLOUR.has(x.photo) ? "colour" : "archival";
  return `  <img id="${x.id}" src="assets/photos/${x.photo}${ext(x.photo)}#t=0,${r3(x.len)}" at="${r3(x.at)}" class="photo ${look} kb-${x.kb}" style="object-position: ${x.focus}"${ov([FADE, FADE])}>`;
}).join("\n")}\n</section>`);
L.push(`<section>\n${vo.map((x) => `  <audio id="vo-${x.id}" src="assets/vo/${x.id}.mp3" at="${r3(x.at)}"></audio>`).join("\n")}\n</section>`);
// two music tracks, alternating, so each piece can fade across the next
for (const x of music) if (!fs.existsSync(path.join(ROOT, x.src))) { console.warn("music missing, left out for now:", x.src); x.skip = true; }
const mclip = (x) => `  <audio id="${x.id}" src="${x.src}#t=${r3(x.in)},${r3(x.in + x.len)}" at="${r3(x.at)}" volume="${x.vol}"${ov(x.fade)}></audio>`;
L.push(`<section>\n${[music[0], music[2]].filter((x) => !x.skip).map(mclip).join("\n")}\n</section>`);
L.push(`<section>\n${[music[1], music[3]].filter((x) => !x.skip).map(mclip).join("\n")}\n</section>`);
sfxTracks.forEach((tr) => L.push(`<section>\n${tr.clips.map((x) => `  <audio src="assets/sfx/${x.f}" at="${r3(x.at)}" volume="${x.vol}"></audio>`).join("\n")}\n</section>`));
L.push(`</body>\n</html>\n`);
fs.writeFileSync(path.join(ROOT, "film.html"), L.join("\n"));

const mmss = (x) => `${Math.floor(x / 60)}:${String(Math.round(x % 60)).padStart(2, "0")}`;
console.log(`film.html: ${mmss(FILM)} (${FILM} s), ${shots.length} photographs, ${pages.length} pages, ${lts.length} lower thirds, ${vo.length} voice clips, ${sfx.length} sounds on ${sfxTracks.length} tracks`);
console.log("chapters at", chapters.map(mmss).join(", "));
