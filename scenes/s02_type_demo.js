import { win, outCubic } from '../engine/ease.js';
import { fade, riseIn, scramble, odometer, typeOn, markerWipe, splitExit } from '../engine/type.js';
import { withCamera, defaultPush, layerScale, Z } from '../engine/camera.js';
import { lines, holdFor, windows, parseNumber } from '../engine/copy.js';
import { W, H, colors } from '../tokens.js';

const ID = 's02_type_demo';
// Copy: [riseIn statement, scramble statement, odometer value, typed-then-marked line].
const T = lines(ID);
const X = 0.2; // statement exit, half overlapped by the next entrance

// Scene-time windows, built from the copy: each statement holds for holdFor(its text).
// The typed line pauses 0.3 s, then is marked; its marked state is the one that holds.
function schedule() {
  const enter = [0.03 * ([...T[0]].length - 1) + 0.25, 0.45, 0.5];
  const b = [];
  let t = 0;
  ['riseIn', 'scramble', 'odometer'].forEach((move, k) => {
    const hold0 = t + enter[k];
    b.push({ move, enter: [t, hold0], hold: [hold0, hold0 + holdFor(T[k])] });
    t = hold0 + holdFor(T[k]) + X / 2;
  });
  const typed = t + 0.45, marked = typed + 0.3 + 0.4;
  b.push({ move: 'typeOn', enter: [t, typed], hold: [typed, typed + 0.3] });
  b.push({ move: 'markerWipe', enter: [typed + 0.3, marked], hold: [marked, marked + holdFor(T[3])] });
  b.push({ move: 'splitExit', exit: [marked + holdFor(T[3]), marked + holdFor(T[3]) + 0.22] });
  return b;
}
export const BEATS = schedule();
const [B1, B2, B3, B4, B5, B6] = BEATS;
export const dur = B6.exit[1];
export const end = B6.exit[0];
export const captions = windows(ID, [
  { lines: [0], in: B1.enter[0], at: B1.hold[0] },
  { lines: [1], in: B2.enter[0], at: B2.hold[0] },
  { lines: [2], in: B3.enter[0], at: B3.hold[0] },
  { lines: [3], in: B4.enter[0], at: B5.hold[0] },
]);

const at = { x: W / 2, y: H / 2 + 50 };
const LINE = { ...at, text: T[3], size: 140 };
const LAST = T[3].split(' ').length - 1; // the word that gets marked
const NUM = parseNumber(T[2]);
// The marker is the reference's yellow with ink text (≈ 14:1), not ink-on-red (≈ 4:1).
const PAD = 0.16, MARK = { ...LINE, word: LAST, pad: PAD, accent: colors.highlight, on: colors.ink };

// Fade and lift a statement out over X seconds after its hold.
function statement(ctx, t, b, draw) {
  if (t < b.enter[0] || t >= b.hold[1] + X) return;
  const e = outCubic(win(t, b.hold[1], b.hold[1] + X));
  fade(ctx, 1 - e, -30 * e, (c) => draw(c, t - b.enter[0]));
}

// One layer, the subject.
export function draw(ctx, t, d = dur) {
  withCamera(ctx, layerScale(defaultPush(t, d), Z.subject), (c) => content(c, t));
}

function content(ctx, t) {
  statement(ctx, t, B1, (c, u) => riseIn(c, u, { ...at, text: T[0] }));
  statement(ctx, t, B2, (c, u) => scramble(c, u, {
    ...at, text: T[1], family: 'mono', weight: 400, size: 120, track: 0.02, dur: 0.45,
  }));
  statement(ctx, t, B3, (c, u) => odometer(c, u, { ...at, from: 0, to: NUM.value, prefix: NUM.prefix, suffix: NUM.suffix, size: 220 }));

  if (t >= B4.enter[0] && t < B5.enter[0]) typeOn(ctx, t - B4.enter[0], { ...LINE, dur: 0.45 });
  if (t >= B5.enter[0] && t < B6.exit[0]) markerWipe(ctx, t - B5.enter[0], { ...MARK, dur: 0.4 });
  if (t >= B6.exit[0]) splitExit(ctx, t - B6.exit[0], {
    ...LINE, dur: 0.22, room: { word: LAST, px: PAD * LINE.size }, paint: (c) => markerWipe(c, 1, MARK),
  });
}
