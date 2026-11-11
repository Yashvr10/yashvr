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

const LEAD = 0.35;  // air before the voice
const TAIL = 0.55;  // air after it
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
      .replaceAll("{{num}}", s.num || "").replaceAll("{{title}}", s.title || "")
      .replaceAll("{{late}}", fs.existsSync(path.join(ROOT, "assets/music/beethoven-7.mp3")) ? " · Beethoven, Symphony No. 7, Allegretto" : "");
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
      shots.push({ id: `${s.id}-${v.photo}`, photo: v.photo, at, len: vl, kb: v.kb, focus: v.focus, framed: v.framed });
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
  { f: "low-engine-hum-drone-685bbb.mp3", at: S.s01._t + 0.3, vol: 0.7 },
  { f: "distant-explosion-rumble-0d81c0.mp3", at: S.s01._t + 3.0, vol: 0.55 },
  { f: "deep-boom-with-long-tail-c5ebbb.mp3", at: S.s02._t + 1.5, vol: 0.45 },
  { f: "radio-tuning-static-sweep-f7864a.mp3", at: S.s04._t + 0.2, vol: 0.25 },
  ...["rhineland", "austria", "munich"].map((k) => ({ f: "telegraph-key-ticks-3e7c48.mp3", at: atWord("s05", k, -0.15), vol: 0.26 })),
  { f: "radio-tuning-static-sweep-f7864a.mp3", at: atWord("s06", "peace", -0.4), vol: 0.22 },
  { f: "telegraph-key-ticks-3e7c48.mp3", at: atWord("s07", "secret", -0.15), vol: 0.26 },
  { f: "low-engine-hum-drone-685bbb.mp3", at: atWord("s08", "invaded", -0.3), vol: 0.6 },
  { f: "distant-explosion-rumble-0d81c0.mp3", at: atWord("s08", "seventeenth", 0), vol: 0.4 },
  { f: "distant-explosion-rumble-0d81c0.mp3", at: atWord("s09", "ardennes", 0), vol: 0.45 },
  { f: "distant-ocean-wave-a9887b.mp3", at: S.s10._t + 0.3, vol: 0.6 },
  { f: "distant-ocean-wave-a9887b.mp3", at: S.s10._t + 4.0, vol: 0.45 },
  { f: "low-engine-hum-drone-685bbb.mp3", at: S.s12._t + 0.4, vol: 0.7 },
  { f: "siren.mp3", at: S.s13._t + 0.1, vol: 0.32 },
  { f: "air-whistle-fading-out-179de2.mp3", at: S.s13._t + 5.0, vol: 0.3 },
  { f: "deep-boom-with-long-tail-c5ebbb.mp3", at: S.s13._t + 6.6, vol: 0.5 },
  { f: "distant-thunder-rumble-202961.mp3", at: atWord("s14", "invaded", -0.3), vol: 0.5 },
  { f: "massive-deep-boom-9c0eda.mp3", at: atWord("s16", "attacked", 0), vol: 0.55 },
  { f: "distant-explosion-rumble-0d81c0.mp3", at: atWord("s16", "attacked", 1.6), vol: 0.45 },
  { f: "low-engine-hum-drone-685bbb.mp3", at: S.s19._t + 0.2, vol: 0.6 },
  { f: "deep-boom-with-long-tail-c5ebbb.mp3", at: atWord("s19", "sank", 0), vol: 0.45 },
  { f: "distant-thunder-rumble-202961.mp3", at: S.s20._t + 0.2, vol: 0.4 },
  { f: "distant-explosion-rumble-0d81c0.mp3", at: S.s21._t + 1.2, vol: 0.45 },
  { f: "low-engine-hum-drone-685bbb.mp3", at: S.s23._t + 0.3, vol: 0.75 },
  { f: "low-engine-hum-drone-685bbb.mp3", at: S.s23._t + 2.6, vol: 0.6 },
  { f: "distant-ocean-wave-a9887b.mp3", at: S.s24._t + 0.1, vol: 0.6 },
  { f: "distant-explosion-rumble-0d81c0.mp3", at: S.s24._t + 2.2, vol: 0.5 },
  { f: "distant-explosion-rumble-0d81c0.mp3", at: S.s27._t + 0.5, vol: 0.45 },
  { f: "crowd-cheering-and-chanting-e73b13.mp3", at: S.s29._t + 0.2, vol: 0.4 },
  { f: "low-engine-hum-drone-685bbb.mp3", at: S.s31._t + 0.3, vol: 0.5 },
  { f: "massive-deep-boom-9c0eda.mp3", at: atWord("s31", "hiroshima", 0.5), vol: 0.6 },
  { f: "distant-church-bell-toll-f328e5.mp3", at: S.s35._t + 0.4, vol: 0.3 },
);
for (const x of sfx) x.len = dur("assets/sfx/" + x.f);
sfx.sort((a, b) => a.at - b.at);
const sfxTracks = [];
for (const x of sfx) {
  let tr = sfxTracks.find((tk) => tk.end <= x.at + 0.001);
  if (!tr) sfxTracks.push((tr = { end: 0, clips: [] }));
  tr.clips.push(x); tr.end = x.at + x.len;
}

// ---- music: Grieg on the road to war; Holst's Mars through the fighting, silent under the Holocaust;
// Beethoven's Allegretto (else Grieg) for the endgame; the Last Post over the end card ----
const end = S.end._t;
const late = fs.existsSync(path.join(ROOT, "assets/music/beethoven-7.mp3"))
  ? { src: "assets/music/beethoven-7.mp3", in: 0, vol: 0.55 } : { src: "assets/music/aase.mp3", in: 95, vol: 0.6 };
const music = [
  { id: "music-aase", src: "assets/music/aase.mp3", in: 0, at: 0, len: chapters[1] + 0.6, vol: 0.6, fade: [2.5, 2.2] },
  { id: "music-mars-1", src: "assets/music/mars.mp3", in: 0, at: chapters[1], len: S.s18._t + 0.8 - chapters[1], vol: 0.3, fade: [0.4, 2.5] },
  { id: "music-mars-2", src: "assets/music/mars.mp3", in: 150, at: chapters[3], len: chapters[4] + 0.6 - chapters[3], vol: 0.26, fade: [2.0, 2.4] },
  { id: "music-late", ...late, at: chapters[4], len: end + 1.0 - chapters[4], fade: [2.0, 3.0] },
  { id: "music-last-post", src: "assets/music/last-post.mp3", in: 0, at: end - 0.3, len: FILM - end + 0.3, vol: 0.55, fade: [0.2, 2.5] },
];

// ---- photos: their look and their slow move ----
const PAINTED = new Set([]);
const COLOUR = new Set(["paris-1944", "un", "cemetery", "auschwitz"]);
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
  .print { object-fit: cover; border: 14px solid #e9e2d2; box-shadow: 0 30px 80px rgba(0,0,0,.6); }
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
  if (x.framed) {
    // a small original: shown as a print on the dark ground rather than stretched to fill the frame
    const [w, h] = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0",
      path.join(ROOT, "assets/photos", x.photo + ext(x.photo))]).toString().trim().split(",").map(Number);
    const H = 760, W = Math.round((H * w) / h);
    return `  <img id="${x.id}" src="assets/photos/${x.photo}${ext(x.photo)}#t=0,${r3(x.len)}" at="${r3(x.at)}" class="print ${look} kb-in" style="left: ${960 - W / 2}px; top: ${540 - H / 2}px; width: ${W}px; height: ${H}px"${ov([FADE, FADE])}>`;
  }
  return `  <img id="${x.id}" src="assets/photos/${x.photo}${ext(x.photo)}#t=0,${r3(x.len)}" at="${r3(x.at)}" class="photo ${look} kb-${x.kb}" style="object-position: ${x.focus}"${ov([FADE, FADE])}>`;
}).join("\n")}\n</section>`);
L.push(`<section>\n${vo.map((x) => `  <audio id="vo-${x.id}" src="assets/vo/${x.id}.mp3" at="${r3(x.at)}"></audio>`).join("\n")}\n</section>`);
// two music tracks, alternating, so each piece can fade across the next
for (const x of music) if (!fs.existsSync(path.join(ROOT, x.src))) { console.warn("music missing, left out for now:", x.src); x.skip = true; }
const mclip = (x) => `  <audio id="${x.id}" src="${x.src}#t=${r3(x.in)},${r3(x.in + x.len)}" at="${r3(x.at)}" volume="${x.vol}"${ov(x.fade)}></audio>`;
for (const k of [0, 1]) L.push(`<section>\n${music.filter((x, i) => i % 2 === k && !x.skip).map(mclip).join("\n")}\n</section>`);
sfxTracks.forEach((tr) => L.push(`<section>\n${tr.clips.map((x) => `  <audio src="assets/sfx/${x.f}" at="${r3(x.at)}" volume="${x.vol}"></audio>`).join("\n")}\n</section>`));
L.push(`</body>\n</html>\n`);
fs.writeFileSync(path.join(ROOT, "film.html"), L.join("\n"));

const mmss = (x) => `${Math.floor(x / 60)}:${String(Math.round(x % 60)).padStart(2, "0")}`;
console.log(`film.html: ${mmss(FILM)} (${FILM} s), ${shots.length} photographs, ${pages.length} pages, ${lts.length} lower thirds, ${vo.length} voice clips, ${sfx.length} sounds on ${sfxTracks.length} tracks`);
console.log("chapters at", chapters.map(mmss).join(", "));
