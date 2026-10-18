// s03_reveal: the reveal shot. Scene type: PIECES ASSEMBLE INTO A SHAPE.
// Navy field, no copy. QR tiles (the through-line object) fly in from every side and snap into
// a giant ₹ while the camera pulls back from 1.12 to 1; the last tile lands on the impact (punch
// and a puff of paper bits), then the shape holds.
//
// Same pattern as s01_hook and s02_growth (BEATS, end and dur, load once, pure draw); the pieces
// follow demos/particles.js (assemble + targetsFromText). No copy, so no captions: the hold is
// tokens.hold.
import { win, outCubic, inOutCubic } from '../engine/ease.js';
import { fade } from '../engine/type.js';
import { withCamera, defaultPush, layerScale, punch, Z } from '../engine/camera.js';
import { field, qrTile } from '../engine/collage.js';
import { assemble, assembleEnd, burst, targetsFromText } from '../engine/particles.js';
import { L } from '../engine/layout.js';
import { colors, fields, fonts, motion, hold, collage } from '../tokens.js';

const F = fields.navy;

// The glyph is as big as fits 75% of the band's width and 85% of its height (Anton is condensed,
// so its width usually decides); tiles sit on a grid of 1/26 of the font size. Measured in load().
const FIT = { w: 0.75, h: 0.85 }, GRID = 26;

// Beats, local seconds. Each tile flies for FLY.dur after a hashed delay of up to FLY.spread and
// lands with the token overshoot; the last one down (LAND) is the impact.
const FLY = { t0: 0, dur: 0.5, spread: 0.4, dist: L.height, overshoot: motion.overshoot };
const LAND = assembleEnd(FLY), PULL = [0, LAND], EXIT = 0.2;

export const captions = [];
export const end = LAND + hold;
export const dur = end + EXIT;

let targets, bottom, STEP;
export async function load() {
  const probe = new OffscreenCanvas(1, 1).getContext('2d');
  probe.font = `400 100px ${fonts.display}`;
  const m = probe.measureText('₹'), w = m.width, h = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  const size = Math.floor(100 * Math.min((FIT.w * L.width) / w, (FIT.h * L.height) / h));
  STEP = Math.round(size / GRID);
  targets = targetsFromText('₹', `400 ${size}px ${fonts.display}`, { step: STEP, x: L.cx(), y: L.cy() });
  bottom = Math.max(...targets.map(([, y]) => y)) + STEP / 2;
}

// One tile at an assemble() state p: translated, turned, faded and scaled as it flies.
const tile = (c, p, i) => {
  c.save();
  c.globalAlpha = p.a;
  c.translate(p.x, p.y);
  c.rotate(p.r);
  qrTile(c, 0, 0, STEP * 0.9 * p.s, { seed: collage.tile.seed + i });
  c.restore();
};

function content(ctx, t) {
  assemble(ctx, t, targets, { ...FLY, draw: tile });
  // Impact: paper bits kicked out from under the glyph as the last tile lands.
  burst(ctx, t, { t0: LAND, x: L.cx(), y: bottom, n: 40, speed: 520, gravity: 1400, life: [0.3, 0.6], width: 4, colors: [colors.white, colors.paper] });
}

// The field; the pieces through the default push times the pull-back, punched on the landing.
// Exit: lift and fade over EXIT after `end` (the flash cut usually covers it).
export function draw(ctx, t, d = dur) {
  field(ctx, F.fill);
  const cam = defaultPush(t, d), pull = 1.12 - 0.12 * inOutCubic(win(t, ...PULL)), x = outCubic(win(t, end, end + EXIT));
  withCamera(ctx, layerScale({ ...cam, s: cam.s * pull * punch(t, LAND) }, Z.subject), (c) => fade(c, 1 - x, -40 * x, (l) => content(l, t)));
}
