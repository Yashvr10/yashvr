// The edit. Scenes play back to back; each transition sits on the cut between two of them.
// A scene entry shows its scene from local time `from` for `dur` seconds, so transitions can
// skip a scene's own entrance and exit. Cuts are on frame boundaries.
import * as s01 from './scenes/s01_title.js';
import * as s02 from './scenes/s02_type_demo.js';
import * as s03 from './scenes/s03_diagram.js';
import * as s04 from './scenes/s04_particles.js';
import * as s05 from './scenes/s05_cards.js';
import { whip, zoomThrough, glitch, matchCut } from './engine/transitions.js';
import { W, H, FPS } from './tokens.js';

export const SCENES = { s01_title: s01, s02_type_demo: s02, s03_diagram: s03, s04_particles: s04, s05_cards: s05 };

// Moving a cut is editing one number here: it ends one scene, starts the next and centres
// the transition between them.
const CUT = [0, 4.3, 11.3, 16.2, 20.6, 26.6];

export const TIMELINE = [
  { scene: 's01_title', start: CUT[0], dur: CUT[1] - CUT[0], from: 0 },
  { tr: whip, at: CUT[1] },
  { scene: 's02_type_demo', start: CUT[1], dur: CUT[2] - CUT[1], from: 0.6 },
  { tr: zoomThrough, at: CUT[2] },
  { scene: 's03_diagram', start: CUT[2], dur: CUT[3] - CUT[2], from: 0.5 },
  { tr: glitch, at: CUT[3] },
  { scene: 's04_particles', start: CUT[3], dur: CUT[4] - CUT[3], from: 1.15 },
  {
    tr: matchCut, at: CUT[4], opts: {
      from: { x: W / 2, y: H / 2 - 36, w: 760, h: 240, r: 24 }, // the s04 total, at its last frame
      to: { x: W / 2 + 60 - 0.95 * 470, y: H / 2, w: 440, h: 320, r: 24 }, // s05's chart card, landed in its slot
    },
  },
  { scene: 's05_cards', start: CUT[4], dur: CUT[5] - CUT[4], from: 1.0 },
];

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
