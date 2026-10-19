import { SS } from '../tokens.js';

// Text boxes drawn this frame, in screen px of the 1920×1080 layout (whatever SS is), for the contrast and safe-area checks.
// renderFrame clears the list; type moves, caption() and hand-drawn text add to it.
export const boxes = [];
export const resetBoxes = () => { boxes.length = 0; };

// Registers a box already in screen px (e.g. projected from 3D).
export const registerBox = (x0, y0, x1, y1, color, text) => boxes.push({ x0, y0, x1, y1, color, text });

// Registers a box given in ctx's current coordinates.
export function registerText(ctx, x0, y0, x1, y1, color, text) {
  const m = new DOMMatrix().scale(1 / SS).multiply(ctx.getTransform()); // device px → layout px
  const p = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  const xs = p.map((q) => q[0]), ys = p.map((q) => q[1]);
  boxes.push({ x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys), color, text });
}
