import { win, outCubic } from '../engine/ease.js';
import { fade, riseIn, scramble, odometer, typeOn, markerWipe, splitExit } from '../engine/type.js';
import { W, H } from '../tokens.js';

export const start = 5;
export const dur = 8;

// Scene-time windows. Each exit (0.2 s, front-loaded fade) is half over before the next
// entrance starts. The typed line is marked mid-statement, so its final, marked state is the
// one that holds 1.2 s.
export const BEATS = [
  { move: 'riseIn', enter: [0.0, 0.58], hold: [0.58, 1.78] },
  { move: 'scramble', enter: [1.88, 2.33], hold: [2.33, 3.53] },
  { move: 'odometer', enter: [3.63, 4.13], hold: [4.13, 5.33] },
  { move: 'typeOn', enter: [5.43, 5.88], hold: [5.88, 6.18] },
  { move: 'markerWipe', enter: [6.18, 6.58], hold: [6.58, 7.78] },
  { move: 'splitExit', exit: [7.78, 8.0] },
];
const [B1, B2, B3, B4, B5, B6] = BEATS, X = 0.2;

const at = { x: W / 2, y: H / 2 + 50 };
const LINE = { ...at, text: 'Typed, then marked.', size: 140 };
const PAD = 0.16, MARK = { ...LINE, word: 2, pad: PAD };

// Fade and lift a statement out over X seconds after its hold.
function statement(ctx, t, b, draw) {
  if (t < b.enter[0] || t >= b.hold[1] + X) return;
  const e = outCubic(win(t, b.hold[1], b.hold[1] + X));
  fade(ctx, 1 - e, -30 * e, (c) => draw(c, t - b.enter[0]));
}

export function draw(ctx, t) {
  statement(ctx, t, B1, (c, u) => riseIn(c, u, { ...at, text: 'Kinetic type' }));
  statement(ctx, t, B2, (c, u) => scramble(c, u, {
    ...at, text: 'SIGNAL / NOISE', family: 'mono', weight: 400, size: 120, track: 0.02, dur: 0.45,
  }));
  statement(ctx, t, B3, (c, u) => odometer(c, u, { ...at, from: 0, to: 120, prefix: '$', suffix: 'K+', size: 220 }));

  if (t >= B4.enter[0] && t < B5.enter[0]) typeOn(ctx, t - B4.enter[0], { ...LINE, dur: 0.45 });
  if (t >= B5.enter[0] && t < B6.exit[0]) markerWipe(ctx, t - B5.enter[0], { ...MARK, dur: 0.4 });
  if (t >= B6.exit[0]) splitExit(ctx, t - B6.exit[0], {
    ...LINE, dur: 0.22, room: { word: 2, px: PAD * LINE.size }, paint: (c) => markerWipe(c, 1, MARK),
  });
}
