// Stateless: the same (i, seed) always gives the same value in 0..1. Safe inside renderFrame.
export function hash(i, seed = 0) {
  let x = (i | 0) ^ Math.imul(seed | 0, 0x9e3779b9);
  x ^= x >>> 16; x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15; x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

// Stateful sequence generator. Load time only, never inside renderFrame.
export function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let x = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
