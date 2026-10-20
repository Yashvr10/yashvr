export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const win = (t, a, b) => clamp01((t - a) / (b - a)); // 0..1 while t is inside [a, b]
export const lerp = (a, b, x) => a + (b - a) * x;
export const outCubic = (x) => 1 - Math.pow(1 - x, 3);
export const outExpo = (x) => (x === 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const inOutQuint = (x) => (x < 0.5 ? 16 * x ** 5 : 1 - Math.pow(-2 * x + 2, 5) / 2);
export const outBack = (x) => 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2);
