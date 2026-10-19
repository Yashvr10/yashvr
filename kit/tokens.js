// The token dispatcher. Engine modules and templates import '../tokens.js' (unchanged from the
// projects they came from); this module loads the chosen look from kit/tokens/<name>.js and
// re-exports its keys. The look is the job's (globalThis.KIT.tokens, set by player.html before it
// imports anything) or ?tokens=<name>; default night-amber. Every look has the same keys.
export const LOOKS = ['night-amber', 'paper-red', 'chrome-blue'];
const query = new URLSearchParams(globalThis.location?.search ?? '');
export const LOOK = globalThis.KIT?.tokens ?? query.get('tokens') ?? 'night-amber';
if (!LOOKS.includes(LOOK)) throw new Error(`unknown tokens "${LOOK}": the looks are ${LOOKS.join(', ')}`);
const T = await import(`./tokens/${LOOK}.js`);
export const {
  ASPECT, W, H, TYPE, TH, SS, FPS, DURATION, colors, fields, fonts, capEm, weights, sizes, tracking, safe, titleSafe, cropSafe, captionBand, hold, motion, post, background, collage, stroke, radius, shadowAlpha, surface, fontLoads,
} = T;
