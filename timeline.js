// The edit. Scenes play back to back; each transition sits on the cut between two of them.
// A scene entry shows its scene from local time `from` for `dur` seconds, so transitions can
// skip a scene's own entrance and exit. Cuts are on frame boundaries.
import * as s01 from './scenes/s01_title.js';
import * as s02 from './scenes/s02_type_demo.js';
import * as s03 from './scenes/s03_diagram.js';
import * as s04 from './scenes/s04_particles.js';
import * as s05 from './scenes/s05_cards.js';
import * as s06 from './scenes/s06_ledger.js';
import { whip, zoomThrough, glitch, matchCut } from './engine/transitions.js';
import { FPS, ASPECT } from './tokens.js';

export const SCENES = { s01_title: s01, s02_type_demo: s02, s03_diagram: s03, s04_particles: s04, s05_cards: s05, s06_ledger: s06 };

// The edit, in order. Each scene plays from its in-point `from` to its `end` (where its last
// caption's hold ends, sized by holdFor from copy.json), plus an optional `trim` in seconds.
// Cuts follow from those lengths, snapped to frames: moving a cut is editing one `trim`.
// Each transition sits on the cut between its neighbours.
export const FULL = [
  { scene: 's01_title', from: 0 },
  { tr: whip },
  { scene: 's02_type_demo', from: 0.6 },
  { tr: zoomThrough },
  { scene: 's03_diagram', from: 0.5 },
  { tr: glitch },
  { scene: 's04_particles', from: 1.15 },
  {
    // From the s04 total at its last frame to s05's chart card, landed in its slot.
    tr: matchCut, opts: { from: s04.totalRect, to: s05.landedRect },
  },
  { scene: 's05_cards', from: 1.0 },
  // Hard cut (no transition entry), the reference's most common transition.
  { scene: 's06_ledger', from: 0 },
];

// The vertical edit (17.5 s): title, the counter, the ledger. It drops s02 (11.7 s of type
// demos, too long for the format), s03 (generic props with small mono labels) and s05 (card
// text set at 18–26 px, unreadable on a phone, and the costliest scene to render). It ends on
// s06's exit to bare paper, which is also s01's first frame, so the loop is seamless.
export const SHORT = [
  { scene: 's01_title', from: 0 },
  { tr: whip },
  { scene: 's04_particles', from: 1.15 },
  { tr: glitch },
  { scene: 's06_ledger', from: 0, trim: s06.dur - s06.end },
];

const snap = (s) => Math.round(s * FPS) / FPS;
function place(order) {
  let t = 0;
  return order.map((x) => {
    if (!x.scene) return { ...x, at: t };
    const start = t;
    t = snap(t + SCENES[x.scene].end - x.from + (x.trim ?? 0));
    return { ...x, start, dur: t - start };
  });
}
// ?edit=full|short picks the edit; by default 9:16 plays the short one.
const EDIT = new URLSearchParams(globalThis.location?.search ?? '').get('edit') ?? (ASPECT === '9x16' ? 'short' : 'full');
export const TIMELINE = place(EDIT === 'short' ? SHORT : FULL);

// Builds the lookup for a timeline. resolve(t) returns either { entry } or, inside a
// transition window, { tr, t0, dur, A, B }; `primary` is the scene that owns the GL and 3D
// layers at t (A until the cut, then B).
export function build(list) {
  const scenes = list.filter((e) => e.scene).map((e) => ({ ...e, mod: SCENES[e.scene] }));
  const trs = list.filter((e) => e.tr).map((x) => {
    const dur = x.dur ?? x.tr.dur, t0 = x.at - (x.tr.anchor ?? 0.5) * dur;
    const f0 = Math.round(t0 * FPS), at = Math.round(x.at * FPS);
    return {
      ...x, dur, t0, f0, f1: f0 + Math.round(dur * FPS),
      A: scenes.find((e) => Math.round((e.start + e.dur) * FPS) === at),
      B: scenes.find((e) => Math.round(e.start * FPS) === at),
    };
  });
  for (const x of trs) if (!x.A || !x.B) throw new Error(`no scenes meet at the cut at ${x.at}s`);
  const last = scenes.at(-1);

  const local = (e, t) => t - e.start + (e.from ?? 0);
  return {
    scenes,
    transitions: trs,
    DURATION: last.start + last.dur,
    local,
    // Draws scene entry e at global time t, at its local time.
    drawer: (e, t) => (ctx) => e.mod.draw(ctx, local(e, t), e.mod.dur),
    // Every caption in global time, clipped to its scene's window: { scene, text, in, at, out }.
    captions: scenes.flatMap((e) => (e.mod.captions ?? []).map((c) => {
      const g = (s) => e.start + s - (e.from ?? 0), end = e.start + e.dur;
      return { scene: e.scene, text: c.text, in: Math.max(g(c.in), e.start), at: g(c.at), out: Math.min(g(c.out), end) };
    }).filter((c) => c.out > c.in && c.at < c.out)),
    resolve(t) {
      const f = Math.round(t * FPS);
      const x = trs.find((x) => f >= x.f0 && f < x.f1);
      if (x) return { tr: x, primary: f < Math.round(x.at * FPS) ? x.A : x.B };
      const e = scenes.findLast((e) => f >= Math.round(e.start * FPS)) ?? scenes[0];
      return { entry: e, primary: e };
    },
  };
}

export const main = build(TIMELINE);
// One scene alone from its local time 0, for QA tools (index.html?solo=<id>).
export const solo = (id) => build([{ scene: id, start: 0, dur: SCENES[id].dur, from: 0 }]);
// A scene's entry in the main timeline.
export const entryOf = (id) => main.scenes.find((e) => e.scene === id);
