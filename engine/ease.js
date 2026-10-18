export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const win = (t, a, b) => clamp01((t - a) / (b - a));
export const lerp = (a, b, u) => a + (b - a) * u;

export const outCubic = (x) => 1 - (1 - x) ** 3;
export const inOutCubic = (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2);
export const inOutQuint = (x) => (x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2);
export const outExpo = (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x));
export const outBack = (x, s = 1.70158) => 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2;

// Step response of a unit-mass damped spring going from 0 to 1, in closed form.
// x = seconds since release, k = stiffness, z = damping ratio (<1 bouncy, 1 critical, >1 sluggish).
export function spring(x, k, z) {
  if (x <= 0) return 0;
  const w = Math.sqrt(k);
  if (z < 1) {
    const wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-z * w * x) * (Math.cos(wd * x) + ((z * w) / wd) * Math.sin(wd * x));
  }
  if (z === 1) return 1 - Math.exp(-w * x) * (1 + w * x);
  const r = w * Math.sqrt(z * z - 1), r1 = -z * w + r, r2 = -z * w - r;
  return 1 - (r2 * Math.exp(r1 * x) - r1 * Math.exp(r2 * x)) / (r2 - r1);
}
