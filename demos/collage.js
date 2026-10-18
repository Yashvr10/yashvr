// engine/collage.js: cutouts (torn paper with halftone, rounded card with the QR tile), tape,
// a marker loop and underline drawing on, a field.
import { cutout, tornRect, rect, halftone, tape, loop, underline, marker, qrTile } from '../engine/collage.js';
import { measure } from '../engine/draw.js';
import { L } from '../engine/layout.js';
import { colors, fields } from '../tokens.js';
import { frame, label } from './_kit.js';

export const dur = 1, T = 0.5, captions = [];
const TORN = tornRect(420, 300, { seed: 3 }), CARD = rect(300, 300);
const A = { x: L.col(0, 2) + 20, y: L.top + 330 }, B = { x: L.col(1, 2), y: L.top + 330 };
const RING = loop(B.x, B.y, 230, 220, { seed: 5 }), LINE = underline(L.left, L.right - 120, L.top + 1000, { seed: 2 });
export async function load() { [RING, LINE].forEach(measure); }

export function draw(ctx) {
  frame(ctx, 'engine/collage.js', fields.yellow);
  cutout(ctx, TORN, { ...A, r: -0.06, fill: colors.coral, paint: (c) => halftone(c, [-210, -150, 210, 150], { color: colors.ink, from: 0.1, to: 0.8 }) });
  tape(ctx, A.x - 120, A.y - 150, -0.5, { seed: 1 });
  label(ctx, 'cutout(tornRect) + halftone + tape', L.left, L.top + 590);
  cutout(ctx, CARD, { ...B, r: 0.05, fill: colors.white, paint: (c) => qrTile(c, 0, 0, 280, { seed: 9 }) });
  marker(ctx, RING, 0.75);
  label(ctx, 'cutout(rect) + qrTile + marker(loop) at 0.75', L.right, L.top + 640, { align: 'right' });
  [0.25, 0.6, 1].forEach((rv, k) => qrTile(ctx, L.col(k, 3), L.top + 830, 200, { seed: 4, reveal: rv }));
  label(ctx, 'qrTile reveal 0.25 / 0.6 / 1', L.left, L.top + 970);
  marker(ctx, LINE, 1, { color: colors.ink });
  label(ctx, 'marker(underline)', L.left, L.top + 1070);
}
