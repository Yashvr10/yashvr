// FROZEN: read-only from phase 7 on. Need something it lacks? Write it in your scene file and report it (NOTES.md).
// ?trace=<id> (QA, qa/trace.mjs): a scene reports one named element's position for the current
// frame, in screen px of the W × H layout. renderFrame clears window.TRACE before drawing; trace()
// sets it when `name` is the traced id. Costs nothing otherwise. Positions are mapped through ctx's
// current transform (camera, push, punch); a fade() lift during an exit isn't included.
import { SS } from '../tokens.js';

const ID = new URLSearchParams(globalThis.location?.search ?? '').get('trace');

export function trace(ctx, name, x, y) {
  if (name !== ID) return;
  const m = ctx.getTransform();
  globalThis.TRACE = { x: (m.a * x + m.c * y + m.e) / SS, y: (m.b * x + m.d * y + m.f) / SS };
}
