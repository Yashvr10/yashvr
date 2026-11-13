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
const QUOTES = JSON.parse(fs.readFileSync(path.join(ROOT, "src/quotes.json"), "utf8"));
const MAPHEAD = tpl("_maphead").replace("{{head}}", HEAD);
const r3 = (x) => Math.round(x * 1000) / 1000;
const norm = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, "");
const dur = (f) => +execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path.join(ROOT, f)]).toString();

const LEAD = 0.6;   // air before the voice
const TAIL = 1.3;  // air after it (an essay film breathes)
const FADE = 0.6;   // each shot's way in and out: slow dissolves through dark

// ---- words: from each scene's .vtt, [{ w, t }] with t from the voice's start ----
function words(id) {
  // openai-whisper word timings (src/align_whisper.py) when present: start and end of every script word
  const wj = path.join(ROOT, "assets/vo", id + ".words.json");
  if (fs.existsSync(wj)) return JSON.parse(fs.readFileSync(wj, "utf8")).map((x) => ({ w: norm(x.word), t: x.start, e: x.end }));
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
// The longest run of a caption's words that the narrator says in [from, to) (seconds from the voice's start).
function phraseIn(ws, text, from, to) {
  const C = text.split(/\s+/).map(norm).filter(Boolean);
  let best = null;
  for (let i = 0; i < ws.length; i++) {
    if (ws[i].t < from - 0.05 || ws[i].t >= to) continue;
    for (let j = 0; j < C.length; j++) {
      let k = 0;
      while (i + k < ws.length && j + k < C.length && ws[i + k].w === C[j + k]) k++;
      if (k && (!best || k > best.k)) best = { k, start: ws[i].t, end: ws[i + k - 1].e ?? ws[i + k - 1].t + 0.4 };
    }
  }
  return best;
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
    if (s.card === "title") sfx.push({ f: "distant-church-bell-toll-f328e5.mp3", at: t + 0.4, vol: 0.35 });
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
      // the reference cuts often: a painting held longer than 9 s cuts from the whole picture to a closer detail of it
      if (!v.framed && vl > 9) {
        const a1 = vl * 0.55;
        shots.push({ id: `${s.id}-${v.photo}`, photo: v.photo, at, len: a1, kb: v.kb, focus: v.focus });
        shots.push({ id: `${s.id}-${v.photo}-detail`, photo: v.photo, at: at + a1, len: vl - a1, kb: "detail", focus: v.focus });
      } else shots.push({ id: `${s.id}-${v.photo}`, photo: v.photo, at, len: vl, kb: v.kb, focus: v.focus, framed: v.framed });
    } else if (v.page.startsWith("q-")) {
      // a page from the book: the passage around the quotation, the spoken words highlighted as they are read
      const q = QUOTES[v.page.slice(2)];
      const esc = (x) => x.replace(/_/g, "").replace(/&/g, "&amp;").replace(/</g, "&lt;");  // Gutenberg marks italics with _underscores_
      let text = esc(q.before + " " + q.quote + " " + q.after);
      const runs = q.hl.map(([sub, a, b], i) => {
        const wrapped = esc(sub).split(" ").map((w) => `<span class="w r${i}">${w}</span>`).join(" ");
        text = text.replace(esc(sub), wrapped);
        return [`r${i}`, cue(a), cue(b)];
      });
      const html = tpl("quote").replaceAll("{{head}}", HEAD).replaceAll("{{runhead}}", q.runhead).replaceAll("{{num}}", q.num)
        .replaceAll("{{cite}}", q.cite).replaceAll("{{body}}", text).replaceAll("{{runs}}", JSON.stringify(runs));
      fs.writeFileSync(path.join(ROOT, v.page + ".html"), html);
      pages.push({ id: v.page, src: v.page + ".html", at, len: vl, fade: [FADE, FADE] });
      sfx.push({ f: "page-turn.mp3", at: at + 0.1, vol: 0.5 });
    } else {
      const html = tpl(v.page).replaceAll("{{maphead}}", MAPHEAD).replaceAll("{{head}}", HEAD).replaceAll("{{len}}", r3(vl))
        .replace(/\{\{cue:([^}]+)\}\}/g, (_, k) => cue(k));
      fs.writeFileSync(path.join(ROOT, v.page + ".html"), html);
      pages.push({ id: v.page, src: v.page + ".html", at, len: vl, fade: [FADE, FADE] });
    }
    for (const kind of ["cap", "label", "step"]) {
      if (!v[kind]) continue;
      const name = `${kind}-${s.id}-${i + 1}`;
      const L = r3(Math.max(2.5, Math.min(kind === "step" ? vl - 0.8 : 6.5, vl - 0.8)));
      const [num, text] = kind === "step" ? v.step : ["", v[kind]];
      const html = tpl(kind).replaceAll("{{head}}", HEAD).replaceAll("{{len}}", L).replaceAll("{{text}}", text).replaceAll("{{num}}", num);
      fs.writeFileSync(path.join(ROOT, name + ".html"), html);
      // Sync to the voice: find the caption's own words in what the narrator says during this shot (Whisper word times)
      // and show it from the first of them; it stays until the phrase is finished, and at least 2.5 s.
      // a name label names the portrait on screen, so it stays with the picture; captions and steps follow the voice
      const hit = kind === "label" ? null : phraseIn(ws, text, at - voAt, end - voAt);
      let cAt = at + 0.5, cLen = L;
      if (hit) {
        cAt = Math.max(at + 0.15, voAt + hit.start - 0.15);
        cLen = Math.min(end - 0.2 - cAt, Math.max(2.5, voAt + hit.end + 1.6 - cAt));
      }
      const syncedHtml = tpl(kind).replaceAll("{{head}}", HEAD).replaceAll("{{len}}", r3(cLen)).replaceAll("{{text}}", text).replaceAll("{{num}}", num);
      fs.writeFileSync(path.join(ROOT, name + ".html"), syncedHtml);
      lts.push({ id: name, src: name + ".html", at: r3(cAt), len: r3(cLen), synced: !!hit });
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
  { f: "distant-church-bell-toll-f328e5.mp3", at: S.s60._t + 0.6, vol: 0.25 },
);
for (const x of sfx) x.len = x.len || dur("assets/sfx/" + x.f);
sfx.sort((a, b) => a.at - b.at);
const sfxTracks = [];
for (const x of sfx) {
  let tr = sfxTracks.find((tk) => tk.end <= x.at + 0.001);
  if (!tr) sfxTracks.push((tr = { end: 0, clips: [] }));
  tr.clips.push(x); tr.end = x.at + x.len;
}

const end = S.end._t;
// ---- music: Satie's first Gnossienne, then Debussy's Rêverie and Clair de Lune (Felted Classics), well under the voice
const music = [
  { id: "music-gnossienne-1", src: "assets/music/gnossienne-1.mp3", in: 0, at: 0, len: 255.5, vol: 0.34, fade: [3.0, 4.0] },
  { id: "music-reverie", src: "assets/music/reverie.mp3", in: 0, at: 251, len: 321.4, vol: 0.30, fade: [3.0, 4.0] },
  { id: "music-clair-de-lune", src: "assets/music/clair-de-lune.mp3", in: 0, at: 568, len: Math.min(349.4, FILM - 568), vol: 0.30, fade: [3.0, 5.0] },
];

// ---- photos: their look and their slow move ----
const PRINTS = new Set(["goltzius-horatius", "tempesta-polyphemus", "rowlandson-pillory", "lincoln-marsh", "lincoln-volk"]);  // engravings and a daguerreotype; everything else is a painting
const ext = (p) => fs.existsSync(path.join(ROOT, "assets/photos", p + ".png")) ? ".png" : ".jpg";

const ov = (fade) => ` overrides='[{"fade":[${fade[0]},${fade[1]}]}]'`;
const L = [];
L.push(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1920, height=1080">
<title>The Man Who Can’t Be Broken</title>
<style>
  /* Photographs fill the frame; a slow move over each (Ken Burns), timed to the clip with --clip-length. */
  .photo { object-fit: cover; }
  .print { object-fit: cover; border: 14px solid #e9e2d2; box-shadow: 0 30px 80px rgba(0,0,0,.6); }
  .archival { filter: grayscale(1) sepia(.22) contrast(1.08) brightness(.94); }
  .painted { filter: saturate(.86) sepia(.08) contrast(1.03) brightness(.9); }
  .colour { filter: saturate(.7) sepia(.15) contrast(1.05); }
  @keyframes kb-in { from { scale: 1.02 } to { scale: 1.13 } }
  @keyframes kb-out { from { scale: 1.14 } to { scale: 1.02 } }
  @keyframes kb-left { from { scale: 1.12; translate: 2.4% 0 } to { scale: 1.12; translate: -2.4% 0 } }
  @keyframes kb-right { from { scale: 1.12; translate: -2.4% 0 } to { scale: 1.12; translate: 2.4% 0 } }
  @keyframes kb-up { from { scale: 1.14; translate: 0 3% } to { scale: 1.14; translate: 0 -3% } }
  @keyframes kb-down { from { scale: 1.14; translate: 0 -3% } to { scale: 1.14; translate: 0 3% } }
  .kb-in { animation: kb-in var(--clip-length) linear both; }
  @keyframes kb-detail { from { scale: 1.34 } to { scale: 1.42 } }
  .kb-detail { animation: kb-detail var(--clip-length) linear both; }
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
  const look = PRINTS.has(x.photo) ? "archival" : "painted";
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
sfxTracks.forEach((tr) => L.push(`<section>\n${tr.clips.map((x) => `  <audio src="assets/sfx/${x.f}${x.in != null ? `#t=${x.in},${x.in + x.len}` : ""}" at="${r3(x.at)}" volume="${x.vol}"${x.in != null ? ov([1.5, 2.0]) : ""}></audio>`).join("\n")}\n</section>`));
L.push(`</body>\n</html>\n`);
fs.writeFileSync(path.join(ROOT, "film.html"), L.join("\n"));

const mmss = (x) => `${Math.floor(x / 60)}:${String(Math.round(x % 60)).padStart(2, "0")}`;
console.log(`film.html: ${mmss(FILM)} (${FILM} s), ${shots.length} photographs, ${pages.length} pages, ${lts.length} lower thirds, ${vo.length} voice clips, ${sfx.length} sounds on ${sfxTracks.length} tracks`);
console.log("chapters at", chapters.map(mmss).join(", "));
for (const x of lts) console.log(`  ${x.synced ? "synced " : "at shot"}  ${mmss(x.at).padStart(5)}  ${x.len.toFixed(1)}s  ${x.id}  “${fs.readFileSync(path.join(ROOT, x.src), "utf8").match(/<title>(.*?)<\/title>/)[1]}”`);
