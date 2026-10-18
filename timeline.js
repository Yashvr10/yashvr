// The edit. Scenes play back to back; each transition sits on the cut between two of them.
// A scene entry shows its scene from local time `from` for `dur` seconds, so transitions can
// skip a scene's own entrance and exit. Cuts are on frame boundaries.
import * as s01 from './scenes/s01_hook.js';
import * as s02 from './scenes/s02_growth.js';
import * as s03 from './scenes/s03_reveal.js';
import * as s04 from './scenes/s04_answer.js';
import { whip, flash } from './engine/transitions.js';
import { FPS } from './tokens.js';

export const SCENES = { s01_hook: s01, s02_growth: s02, s03_reveal: s03, s04_answer: s04 };

// The edit, in order. Each scene plays from its in-point `from` to its `end` (where its last
// caption's hold ends, sized by holdFor from copy.json), plus an optional `trim` in seconds.
// Cuts follow from those lengths, snapped to frames: moving a cut is editing one `trim`.
// Each transition ({ tr: whip }, …) sits on the cut between its neighbours.
export const ORDER = [
  { scene: 's01_hook', from: 0 },
  { tr: whip },
  // In at 0.15 s: the whip lands on the baseline and the first tile, not on bare paper.
  { scene: 's02_growth', from: 0.15 },
  // Hard cut into navy (no transition entry), in at 0.1 s so the first frame already has tiles in flight.
  { scene: 's03_reveal', from: 0.1 },
  // A 0.1 s accent flash on the cut into the answer; s04 plays from its start to its end (no trim).
  { tr: flash, dur: 0.1 },
  { scene: 's04_answer', from: 0 },
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
export const TIMELINE = place(ORDER);
// Builds the lookup for a timeline. resolve(t) returns either { entry } or, inside a
// transition window, { tr, t0, dur, A, B }; `primary` is the scene that owns the GL and 3D
// layers at t (A until the cut, then B).
export function build(list) {
  const scenes = list.filter((e) => e.scene).map((e) => ({ ...e, mod: e.mod ?? SCENES[e.scene] }));
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
// A module that isn't in SCENES (an engine demo) as a one-scene timeline (index.html?demo=<name>).
export const single = (id, mod) => build([{ scene: id, mod, start: 0, dur: mod.dur, from: 0 }]);
// A scene's entry in the main timeline.
export const entryOf = (id) => main.scenes.find((e) => e.scene === id);
