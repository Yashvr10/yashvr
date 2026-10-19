// The edit: eight scenes in fixed slots (the shot list), 30.0 s = 900 frames. Each transition
// sits on the cut between two scenes. Unlike the UPI video (where cuts follow from each scene's
// last hold), slots are fixed here, so build() checks the reverse: every caption's hold (holdFor,
// engine/copy.js) must end before anything covers it (the next cut, or the start of a
// transition window that hides it).
import * as s01 from './scenes/s01_open.js';
import * as s02 from './scenes/s02_map.js';
import * as s03 from './scenes/s03_response.js';
import * as s04 from './scenes/s04_cost.js';
import * as s05 from './scenes/s05_crisis.js';
import * as s06 from './scenes/s06_talks.js';
import * as s07 from './scenes/s07_now.js';
import * as s08 from './scenes/s08_end.js';
import { matchCut, dip, zoomThrough } from './engine/transitions.js';
import { ruleRect } from './scenes/_kit.js';
import { FPS, colors } from './tokens.js';

export const SCENES = {
  s01_open: s01, s02_map: s02, s03_response: s03, s04_cost: s04,
  s05_crisis: s05, s06_talks: s06, s07_now: s07, s08_end: s08,
};

// Five designed cuts (one of them the match cut), two hard cuts (s02 → s03, s05 → s06).
// The match cut runs 0.3 s (the engine default is 0.4: over this video's 0.3 s ceiling); its
// shape is the s01 rule, which is also where s02's coastline starts.
export const ORDER = [
  { scene: 's01_open' },
  { tr: matchCut, dur: 0.3, opts: { from: ruleRect(), to: ruleRect(), color: colors.accent } },
  { scene: 's02_map' },
  { scene: 's03_response' },
  { tr: dip, opts: { color: colors.ground } },
  { scene: 's04_cost' },
  { tr: zoomThrough },
  { scene: 's05_crisis' },
  { scene: 's06_talks' },
  { tr: dip, opts: { color: colors.ground } },
  { scene: 's07_now' },
  { tr: dip, opts: { color: colors.ground } },
  { scene: 's08_end' },
];

// Slots on whole frames: each scene starts where the previous one's slot ends.
function place(order) {
  let f = 0;
  return order.map((x) => {
    if (!x.scene) return { ...x, at: f / FPS };
    const n = Math.round(SCENES[x.scene].dur * FPS), start = f / FPS;
    f += n;
    return { ...x, start, dur: n / FPS, from: 0 };
  });
}
export const TIMELINE = place(ORDER);

// The lookup, as the UPI timeline's build(): resolve(t) returns { entry } or, inside a transition
// window, { tr, t0, dur, A, B }; `primary` owns the GL layers at t.
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

  // Holds: each caption, in its scene's local time, must be out before the scene is covered:
  // its slot's end, or the start of the transition window leaving it (a dip or zoom hides A
  // from its window's start; the match cut shows A unchanged up to the cut).
  for (const e of scenes) {
    const leave = trs.find((x) => x.A === e), covered = leave && leave.tr !== matchCut ? leave.f0 / FPS - e.start : e.dur;
    for (const c of e.mod.captions ?? []) {
      if (c.out > covered + 1e-6) throw new Error(`${e.scene}: "${c.text}" holds to ${c.out.toFixed(3)} s, past ${covered.toFixed(3)} s (holdFor needs ${(c.out - c.at).toFixed(2)} s)`);
    }
  }
  return {
    scenes,
    transitions: trs,
    DURATION: last.start + last.dur,
    local,
    drawer: (e, t) => (ctx) => e.mod.draw(ctx, local(e, t), e.mod.dur),
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
export const single = (id, mod) => build([{ scene: id, mod, start: 0, dur: mod.dur, from: 0 }]);
export const entryOf = (id) => main.scenes.find((e) => e.scene === id);
