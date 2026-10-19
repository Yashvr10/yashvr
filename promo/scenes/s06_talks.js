// s06_talks: the diplomacy. Scene type: ILLUSTRATION (the s02 map, again).
// Hard cut in from the wall. The map from s02, fully drawn and quieter (the strip's fill halved),
// held where s02's push ended and still creeping in. Three dotted arcs reach out from the strip to
// points beyond the frame (no destinations named); a small amber dot travels out and back along
// each. "Talks. Pauses. Ceasefires." rises in, top left over the sea. Leaves on a dip.
//
// Facts (NOTES.md): a humanitarian pause took effect on 24 November 2023 and lasted seven days
// (UN OCHA); ceasefires took effect in January 2025 and in October 2025 (UN News, UN Security
// Council). All were negotiated through mediators.
import { win, lerp, outCubic } from '../engine/ease.js';
import { lines, windows } from '../engine/copy.js';
import { measure, pointAt } from '../engine/draw.js';
import { L } from '../engine/layout.js';
import { W, H, colors } from '../tokens.js';
import { STYLE, settles, block, drawBlock, proj, arc, GAZA_AT, GAZA_LABEL, ISRAEL_LABEL } from './_kit.js';
import { drawMap, label, PUSH } from './s02_map.js';

const ID = 's06_talks';
const [LINE] = lines(ID);
const [ISRAEL, GAZA_NAME] = lines('s02_map');
export const dur = 3.8;

const IN = 0.45, ARCS = [0.1, 1.3];
export const captions = windows(ID, [{ lines: [0], in: IN, at: settles(IN, LINE, STYLE.h1) }]);
export const end = Math.max(...captions.map((c) => c.out));

// Out from the strip: west across the sea, south-west, and east (endpoints off the frame).
const REACH = L.stack ? [[-0.4, 0.1], [-0.2, 1.1], [1.4, 0.35]] : [[-0.25, 0.25], [0.2, 1.3], [1.3, 0.2]];
let arcs, caption;
export async function load() {
  const from = proj(GAZA_AT);
  arcs = REACH.map(([fx, fy], k) => arc(from, [fx * W, fy * H], k === 2 ? -0.18 : 0.18, 40));
  caption = block(new OffscreenCanvas(1, 1).getContext('2d'), LINE, STYLE.h1, L.stack ? 560 : 760, { max: 3 });
}

export function draw(ctx, t, d = dur) {
  const s = lerp(PUSH, PUSH + 0.04, win(t, 0, d));
  const cam = drawMap(ctx, t, s, { fill: 0.11 });
  label(ctx, 1e3, 0, ISRAEL, ISRAEL_LABEL, cam);
  label(ctx, 1e3, 0, GAZA_NAME, GAZA_LABEL, cam);
  arcs.forEach((a, k) => {
    const p = outCubic(win(t, ARCS[0] + k * 0.25, ARCS[0] + k * 0.25 + 0.7));
    if (p <= 0) return;
    const pts = a.map(cam), len = measure(pts).at(-1);
    ctx.fillStyle = colors.text;
    ctx.globalAlpha = 0.7;
    for (let dd = 0; dd <= p * len; dd += 11) {
      const [x, y] = pointAt(pts, dd);
      ctx.beginPath();
      ctx.arc(x, y, 1.8, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // The travelling dot: out and back once every 2.4 s, starting when its arc is drawn, staying
    // in the visible half of the arc.
    const age = t - (ARCS[0] + k * 0.25 + 0.7);
    if (age <= 0) return;
    const ph = (age / 2.4) % 1, q = ph < 0.5 ? ph * 2 : 2 - ph * 2;
    const [x, y] = pointAt(pts, q * len * 0.45);
    ctx.fillStyle = colors.accent;
    ctx.globalAlpha = Math.min(1, age / 0.2);
    ctx.beginPath();
    ctx.arc(x, y, 6, 0, 2 * Math.PI);
    ctx.fill();
    ctx.globalAlpha = 1;
  });
  drawBlock(ctx, t, IN, caption, L.left, L.stack ? L.textTop : L.top, { align: 'left' });
}
