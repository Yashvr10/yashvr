import { win, outCubic, outBack } from '../engine/ease.js';
import { loadDraw, grain, measure, drawOn, pulseAlong } from '../engine/draw.js';
import { drawLaptop, drawChatBubble, drawChartCard } from '../engine/props.js';
import { fade } from '../engine/type.js';
import { lines, windows, caption } from '../engine/copy.js';
import { withCamera, defaultPush, layerScale, Z } from '../engine/camera.js';
import { colors, stroke, sizes, tracking } from '../tokens.js';

const ID = 's03_diagram';
const LABELS = lines(ID); // one label per prop

const GROUND = 660, S = 1.15, POP = 0.5, EXIT = 0.4;
const PROPS = [
  { draw: drawLaptop, x: 420, enter: 0.2, label: 0 },
  { draw: drawChatBubble, x: 960, enter: 1.1, label: 1 },
  { draw: drawChartCard, x: 1500, enter: 2.0, label: 2 },
];

// Each label is a caption, settled when its rise-in finishes (0.02 s stagger, 0.3 s per glyph).
export const captions = windows(ID, PROPS.map((p) => {
  const at = p.enter + 0.2 + 0.02 * ([...LABELS[p.label]].length - 1) + 0.3;
  return { lines: [p.label], in: p.enter + 0.2, at };
}));
export const end = Math.max(...captions.map((c) => c.out));
export const dur = Math.max(6, end + 0.4);

// Gentle arcs between neighbouring props, sampled once.
function arc([x0, y0], [x1, y1], lift, n = 32) {
  const cx = (x0 + x1) / 2, cy = Math.min(y0, y1) - lift;
  return Array.from({ length: n + 1 }, (_, i) => {
    const u = i / n, v = 1 - u;
    return [v * v * x0 + 2 * v * u * cx + u * u * x1, v * v * y0 + 2 * v * u * cy + u * u * y1];
  });
}
const LINES = [
  { pts: arc([590, GROUND - 110], [810, GROUND - 130], 60), draw: [0.8, 1.4] },
  { pts: arc([1110, GROUND - 130], [1350, GROUND - 120], 60), draw: [1.7, 2.3] },
];
// Each pulse runs line 1 then line 2.
const PULSES = [[2.6, 3.8], [3.5, 4.7]];

export async function load() {
  await loadDraw();
  LINES.forEach((l) => measure(l.pts));
}

function content(ctx, t) {
  ctx.strokeStyle = colors.dim;
  ctx.lineWidth = stroke.detail;
  ctx.lineCap = 'round';
  for (const l of LINES) drawOn(ctx, l.pts, outCubic(win(t, ...l.draw)));

  for (const [a, b] of PULSES) {
    const u = win(t, a, b);
    if (u <= 0 || u >= 1) continue;
    pulseAlong(ctx, LINES[u < 0.5 ? 0 : 1].pts, (u % 0.5) * 2);
  }

  PROPS.forEach((p, i) => {
    if (t < p.enter) return;
    const u = win(t, p.enter, p.enter + POP), a = outCubic(win(t, p.enter, p.enter + POP / 2));
    const s = S * (0.85 + 0.15 * outBack(u));
    fade(ctx, a, 24 * (1 - outCubic(u)), (c) => p.draw(c, t, { x: p.x, y: GROUND, s, seed: i + 1, grow: outCubic(u) }));
    caption(ctx, t - p.enter - 0.2, LABELS[p.label], {
      x: p.x, y: GROUND + 64, family: 'mono', weight: 400, size: sizes.label,
      track: tracking.label, color: colors.dim, stagger: 0.02, dur: 0.3, rise: 16, blur: 4,
    });
  });
}

// One layer, the subject: props, lines, pulses and labels. Grain is screen-space, after it.
export function draw(ctx, t, d = dur) {
  const e = outCubic(win(t, d - EXIT, d));
  withCamera(ctx, layerScale(defaultPush(t, d), Z.subject), (c) => fade(c, 1 - e, -30 * e, (l) => content(l, t)));
  grain(ctx, t);
}
