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

const LEAD = 0.3;   // air before the voice (a motivational pace)
const TAIL = 0.55; // air after it
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
const caps = [], capsBack = [];
const FADED = new Set(fs.existsSync(path.join(ROOT, "src/faded.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "src/faded.json"), "utf8")) : []);
let autoN = 0;
const BEHIND = fs.existsSync(path.join(ROOT, "src/behind.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "src/behind.json"), "utf8")) : {};
for (const s of cfg.scenes) {
  if (s.card) {
    const len = s.len;
    const name = s.card === "chapter" ? `ch${chapters.length + 1}` : s.card;
    if (s.card === "chapter") chapters.push(t);
    const html = tpl(s.card).replaceAll("{{head}}", HEAD).replaceAll("{{len}}", len)
      .replaceAll("{{num}}", s.num || "").replaceAll("{{title}}", (s.title || "").replace(/~(.*?)~/g, '<span class="scr">$1</span>'))
      .replaceAll("{{titlejson}}", JSON.stringify((s.title || "").replace(/~/g, ""))).replaceAll("{{type0}}", "0.7").replaceAll("{{typedt}}", "0.055")
      .replaceAll("{{late}}", fs.existsSync(path.join(ROOT, "assets/music/beethoven-7.mp3")) ? " · Beethoven, Symphony No. 7, Allegretto" : "");
    fs.writeFileSync(path.join(ROOT, name + ".html"), html);
    pages.push({ id: name, src: name + ".html", at: t, len, fade: s.card === "title" ? [0.8, 0.6] : [0.25, 0.4] });
    // chapter: the numeral on a key, then the title typed out, one keystroke per character (space bar on spaces)
    if (s.card === "chapter") {
      sfx.push({ f: "key1.mp3", at: t + 0.12, vol: 0.8 });
      [...(s.title || "").replace(/~/g, "")].forEach((ch, j) => sfx.push({ f: ch === " " ? "keysp.mp3" : ["key1.mp3", "key2.mp3", "key3.mp3"][(j * 7) % 3], at: t + 0.7 + j * 0.055, vol: ch === " " ? 0.55 : 0.5 + ((j * 13) % 5) * 0.04, extra: true }));
    }
    // the title: a hit under each "rise", then a swell into "above the ordinary"
    if (s.card === "title") { for (const d of [0.5, 1.4, 2.3]) sfx.push({ f: "kick.mp3", at: t + d, vol: 0.8 }); sfx.push({ f: "swell.mp3", at: t + 2.7, vol: 0.6 }); }
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
      if (false) {   // no cut to a closer detail: every picture stays whole in its 16:9 frame
        const a1 = vl * 0.55;
        shots.push({ id: `${s.id}-${v.photo}`, photo: v.photo, at, len: a1, kb: v.kb, focus: v.focus });
        shots.push({ id: `${s.id}-${v.photo}-detail`, photo: v.photo, at: at + a1, len: vl - a1, kb: "detail", focus: v.focus });
      } else shots.push({ id: `${s.id}-${v.photo}`, photo: v.photo, at, len: vl, kb: v.kb, focus: v.focus, framed: v.framed, cutout: !!v.behind, fit: v.fit });
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
    // ---- captions (two reference reels) ----
    // Quiet layer, every spoken word: small lowercase serif, one to three words at a time, each word appearing on the
    // frame it is spoken and the group replaced by the next, placed beside the subject (v.pos), never across a cut.
    // Emphasis (v.emph, "line one / line two"): huge red condensed serif capitals filling the frame width, word by word;
    // a second line smaller beneath; behind the figure when the shot has a cut-out (v.behind = true). v.flash: each
    // emphasis word replaces the last instead of building. Accent (v.accent): one spoken word in a big script, the rest
    // of its phrase small beneath. Ghost (v.ghost): a huge see-through italic word behind the figure.
    if (!v.page) {
      const raw = s.text.split(/\s+/);
      const inShot = []; for (let k = 0; k < ws.length; k++) { const tt = voAt + ws[k].t; if (tt >= at - 0.06 && tt < end - 0.05) inShot.push(k); }
      const wt = (k) => r3(voAt + ws[k].t - 0.03);
      const wend = (k) => voAt + (ws[k].e ?? ws[k].t + 0.35);
      const clean = (k) => raw[k].replace(/[.,;:!?"“”]+$/g, "").replace(/^[“"]/, "");
      const used = new Set(), groups = [];
      const findSpan = (phrase) => {          // the tightest run of spoken words in this shot that contains the phrase
        const want = phrase.split(/\s+/).map(norm).filter(Boolean); let best = null;
        for (const q0 of inShot) {
          if (ws[q0].w !== want[0]) continue;
          const ks = [q0]; let p = q0 + 1, ok = true;
          for (const w of want.slice(1)) { const k = inShot.find((q) => q >= p && ws[q].w === w); if (k === undefined) { ok = false; break; } ks.push(k); p = k + 1; }
          if (ok && (!best || ks[ks.length - 1] - ks[0] < best[best.length - 1] - best[0])) best = ks;
        }
        return best;
      };
      const behindLayer = v.behind && fs.existsSync(path.join(ROOT, "assets/cutouts169", v.photo + ".png"));
      if (v.emph) {
        const lines = v.emph.split(" / ");
        const spans = lines.map(findSpan);
        if (spans.some((x) => !x)) console.warn(`  emphasis ${s.id}: "${v.emph}" not all in the narration here`);
        const got = spans.filter(Boolean);
        if (got.length) {
          for (const sp of got) for (let k = sp[0]; k <= sp[sp.length - 1]; k++) used.add(k);
          const first = got[0][0], last = got[got.length - 1].slice(-1)[0];
          const eAt = wt(first), eEnd = r3(Math.min(end - 0.1, wend(last) + 1.3));
          const L = got.map((sp, li) => sp.map((k) => ({ x: clean(k).toUpperCase(), t: wt(k) })));
          if (v.flash) {   // one word at a time, each filling the frame, each replacing the last
            const W = L.flat();
            W.forEach((w, j) => (behindLayer ? capsBack : caps).push({ kind: "emph", at: w.t, end: j + 1 < W.length ? r3(W[j + 1].t - 0.01) : eEnd, lines: [[w]] }));
          } else (behindLayer ? capsBack : caps).push({ kind: "emph", at: eAt, end: eEnd, lines: L });
          sfx.push({ f: "swish.mp3", at: eAt - 0.2, vol: 0.5 });
          sfx.push({ f: "thump.mp3", at: eAt - 0.02, vol: 0.65, extra: true });
          L.flat().slice(1).forEach((w) => sfx.push({ f: "kick.mp3", at: w.t - 0.01, vol: 0.32, extra: true }));
          groups.push({ k: first, kind: "gap", ks: [] });
        }
      }
      if (v.ghost && behindLayer) {
        const k = inShot.find((q) => ws[q].w === norm(v.ghost));
        capsBack.push({ kind: "ghost", word: v.ghost, at: r3(at + FADE), end: r3(end - FADE) });
        if (k !== undefined) sfx.push({ f: "swell.mp3", at: wt(k) - 0.6, vol: 0.4 });
      }
      let accentK = v.accent ? inShot.find((q) => ws[q].w === norm(v.accent) && !used.has(q)) : undefined;
      let cur = [];
      const flush = () => { if (cur.length) groups.push({ k: cur[0], kind: "quiet", ks: cur }); cur = []; };
      for (const k of inShot) {
        if (used.has(k)) { flush(); continue; }
        if (k === accentK) { flush(); cur = [k]; continue; }
        cur.push(k);
        const n = cur.length, isAcc = cur[0] === accentK;
        if ((!isAcc && (n >= 3 || /[.;:?!,]$/.test(raw[k]))) || (isAcc && (n >= 3 || /[.;:?!,]$/.test(raw[k])))) flush();
      }
      flush();
      groups.sort((a, b) => a.k - b.k);
      groups.forEach((g, i) => {
        if (g.kind !== "quiet") return;
        const nxt = i + 1 < groups.length ? wt(groups[i + 1].k) - 0.02 : end - 0.1;
        const gEnd = r3(Math.min(nxt, end - 0.1, wend(g.ks[g.ks.length - 1]) + 1.1));
        const acc = g.ks[0] === accentK;
        const words = g.ks.map((k, j) => ({ x: clean(k).toLowerCase(), t: wt(k), c: acc && j === 0 ? "scr" : "" }));
        if (acc) sfx.push({ f: "tick.mp3", at: words[0].t, vol: 0.4, extra: true });
        caps.push({ kind: "quiet", pos: v.pos || "l", at: wt(g.ks[0]), end: gEnd, acc, words });
      });
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
fs.writeFileSync(path.join(ROOT, "captions.html"), tpl("captions").replaceAll("{{head}}", HEAD).replace("{{data}}", JSON.stringify(caps)));
fs.writeFileSync(path.join(ROOT, "captions-back.html"), tpl("captions").replaceAll("{{head}}", HEAD).replace("{{data}}", JSON.stringify(capsBack)));
for (const n of ["grain", "leak"]) fs.writeFileSync(path.join(ROOT, n + ".html"), tpl(n).replaceAll("{{head}}", HEAD));

// ---- sound effects at story moments (scene, word or offset) ----
const S = Object.fromEntries(cfg.scenes.map((s) => [s.id, s]));
const atWord = (id, key, d = 0) => S[id]._voAt + cueTime(S[id]._ws, key) + d;
for (const x of sfx) x.len = x.len || dur("assets/sfx/" + x.f);
sfx.sort((a, b) => a.at - b.at);
const sfxTracks = [];
for (const x of sfx) {
  let tr = sfxTracks.find((tk) => tk.end <= x.at + 0.001);
  if (!tr) sfxTracks.push((tr = { end: 0, clips: [] }));
  tr.clips.push(x); tr.end = x.at + x.len;
}

const end = S.end._t;
const MUSIC_VOL = JSON.parse(fs.readFileSync(path.join(ROOT, "src/music-vol.json"), "utf8"));
// ---- music: Satie and Debussy piano pieces (Felted Classics), well under the voice
const music = [
  // calm solo piano: "New Hope" under chapters I and II, "At the Edge of Hope" from chapter III
  { id: "music-new-hope", src: "assets/music/new-hope-instr.mp3", in: 0, at: 0, len: Math.min(271.9, S.ch3._t + 3), vol: MUSIC_VOL["new-hope-instr"], fade: [2.0, 4.0] },
  { id: "music-edge-of-hope", src: "assets/music/edge-of-hope.mp3", in: 0, at: S.ch3._t - 1, len: Math.min(182.7, FILM - S.ch3._t + 1), vol: MUSIC_VOL["edge-of-hope"], fade: [3.0, 5.0] },
];

// ---- photos: their look and their slow move ----
const PRINTS = new Set(["market-scene"]);  // engravings and a daguerreotype; everything else is a painting
const ext = (p) => fs.existsSync(path.join(ROOT, "assets/photos", p + ".png")) ? ".png" : ".jpg";

const ov = (fade) => ` overrides='[{"fade":[${fade[0]},${fade[1]}]}]'`;
const L = [];
L.push(`<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1920, height=1080">
<title>Rise Above the Ordinary</title>
<style>
  /* Photographs fill the frame; a slow move over each (Ken Burns), timed to the clip with --clip-length. */
  .photo { object-fit: cover; }
  .print { object-fit: cover; border: 14px solid #e9e2d2; box-shadow: 0 30px 80px rgba(0,0,0,.6); }
  .archival { filter: grayscale(1) sepia(.42) contrast(1.08) brightness(.84); }
  .archival.faded { filter: grayscale(1) brightness(.6) contrast(2) sepia(.42); }
  .painted { filter: saturate(.9) sepia(.06) contrast(1.06) brightness(.82); }
  .colour { filter: saturate(.7) sepia(.15) contrast(1.05); }
  @keyframes kb-in { from { scale: 1.0 } to { scale: 1.06 } }
  @keyframes kb-out { from { scale: 1.06 } to { scale: 1.0 } }
  @keyframes kb-left { from { scale: 1.05; translate: 1.4% 0 } to { scale: 1.05; translate: -1.4% 0 } }
  @keyframes kb-right { from { scale: 1.05; translate: -1.4% 0 } to { scale: 1.05; translate: 1.4% 0 } }
  @keyframes kb-up { from { scale: 1.06; translate: 0 1.6% } to { scale: 1.06; translate: 0 -1.6% } }
  @keyframes kb-down { from { scale: 1.06; translate: 0 -1.6% } to { scale: 1.06; translate: 0 1.6% } }
  .kb-in { animation: kb-in var(--clip-length) linear both; }
  @keyframes kb-detail { from { scale: 1.34 } to { scale: 1.42 } }
  .kb-detail { animation: kb-detail var(--clip-length) linear both; }
  /* a tall work shown whole: the picture at full height over a dark, blurred copy of itself */
  .fit { object-fit: contain; }
  .blurbg { object-fit: cover; filter: blur(36px) brightness(.38) saturate(.8); scale: 1.15; }
  @keyframes kb-fit { from { scale: 1.0 } to { scale: 1.05 } }
  .kb-fit { animation: kb-fit var(--clip-length) linear both; }
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
L.push(`<section>\n  <iframe id="captions" src="captions.html#t=0,${FILM}"></iframe>\n</section>`);
L.push(`<section>\n${shots.filter((x) => x.cutout).map((x) => `  <img id="${x.id}-cutout" src="assets/cutouts169/${x.photo}.png#t=0,${r3(x.len)}" at="${r3(x.at)}" class="photo painted ${x.fit ? "fit kb-fit" : "kb-" + x.kb}" style="object-position: ${x.fit ? "50% 50%" : x.focus}"${ov([FADE, FADE])}>`).join("\n")}\n</section>`);
L.push(`<section>\n  <iframe id="captions-back" src="captions-back.html#t=0,${FILM}"></iframe>\n</section>`);
L.push(`<section>\n${lts.map((x) => `  <iframe id="${x.id}" src="${x.src}" at="${r3(x.at)}"></iframe>`).join("\n")}\n</section>`);
L.push(`<section>\n${pages.map((x) => `  <iframe id="${x.id}" src="${x.src}${x.src.startsWith("ch") || ["title.html", "end.html"].includes(x.src) ? "" : `#t=0,${r3(x.len)}`}" at="${r3(x.at)}"${ov(x.fade)}></iframe>`).join("\n")}\n</section>`);
L.push(`<section>\n${shots.map((x) => {
  const look = "painted";
  if (x.framed) {
    // a small original: shown as a print on the dark ground rather than stretched to fill the frame
    const [w, h] = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0",
      path.join(ROOT, "assets/photos", x.photo + ext(x.photo))]).toString().trim().split(",").map(Number);
    const H = 760, W = Math.round((H * w) / h);
    return `  <img id="${x.id}" src="assets/photos169/${x.photo}${ext(x.photo)}#t=0,${r3(x.len)}" at="${r3(x.at)}" class="print ${look} kb-in" style="left: ${960 - W / 2}px; top: ${540 - H / 2}px; width: ${W}px; height: ${H}px"${ov([FADE, FADE])}>`;
  }
  if (x.fit) return `  <img id="${x.id}-bg" src="assets/photos169/${x.photo}${ext(x.photo)}#t=0,${r3(x.len)}" at="${r3(x.at)}" class="photo painted blurbg"${ov([FADE, FADE])}>\n  <img id="${x.id}" src="assets/photos169/${x.photo}${ext(x.photo)}#t=0,${r3(x.len)}" at="${r3(x.at)}" class="photo ${look} fit kb-fit"${ov([FADE, FADE])}>`;
  return `  <img id="${x.id}" src="assets/photos169/${x.photo}${ext(x.photo)}#t=0,${r3(x.len)}" at="${r3(x.at)}" class="photo ${look} kb-${x.kb}" style="object-position: ${x.focus}"${ov([FADE, FADE])}>`;
}).join("\n")}\n</section>`);
L.push(`<section>\n${vo.map((x) => `  <audio id="vo-${x.id}" src="assets/vo/${x.id}.mp3" at="${r3(x.at)}"></audio>`).join("\n")}\n</section>`);
// two music tracks, alternating, so each piece can fade across the next
for (const x of music) if (!fs.existsSync(path.join(ROOT, x.src))) { console.warn("music missing, left out for now:", x.src); x.skip = true; }
const mclip = (x) => `  <audio id="${x.id}" src="${x.src}#t=${r3(x.in)},${r3(x.in + x.len)}" at="${r3(x.at)}" volume="${x.vol}"${ov(x.fade)}></audio>`;
for (const k of [0, 1]) L.push(`<section>\n${music.filter((x, i) => i % 2 === k && !x.skip).map(mclip).join("\n")}\n</section>`);
sfxTracks.forEach((tr) => L.push(`<section>\n${tr.clips.map((x) => `  <audio src="assets/sfx/${x.f}${x.in != null ? `#t=${x.in},${x.in + x.len}` : ""}" at="${r3(x.at)}" volume="${x.vol}"${x.in != null ? ov([1.5, 2.0]) : ""}></audio>`).join("\n")}\n</section>`));
L.push(`</body>\n</html>\n`);
fs.writeFileSync(path.join(ROOT, "film.html"), L.join("\n"));
fs.mkdirSync(path.join(ROOT, ".film"), { recursive: true });
fs.writeFileSync(path.join(ROOT, ".film/sfx-extra.json"), JSON.stringify(sfx.filter((x) => x.extra).map((x) => ({ f: x.f, at: r3(x.at), vol: x.vol }))));

const mmss = (x) => `${Math.floor(x / 60)}:${String(Math.round(x % 60)).padStart(2, "0")}`;
console.log(`film.html: ${mmss(FILM)} (${FILM} s), ${shots.length} photographs, ${pages.length} pages, ${lts.length} lower thirds, ${vo.length} voice clips, ${sfx.length} sounds on ${sfxTracks.length} tracks`);
console.log("chapters at", chapters.map(mmss).join(", "));
for (const x of lts) console.log(`  ${x.synced ? "synced " : "at shot"}  ${mmss(x.at).padStart(5)}  ${x.len.toFixed(1)}s  ${x.id}  “${fs.readFileSync(path.join(ROOT, x.src), "utf8").match(/<title>(.*?)<\/title>/)[1]}”`);
