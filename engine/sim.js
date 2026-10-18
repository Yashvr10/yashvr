export const HZ = 120;

// Fixed-timestep simulation replayed from t = 0 and cached by step index, so the state
// at time t is the same whether frames are rendered in order, out of order or alone.
// step(state, dt) gets a fresh copy and returns the next state. Treat returned states as read-only.
export function fixedSim(init, step) {
  const cache = [init()];
  return (t) => {
    const n = Math.max(0, Math.round(t * HZ));
    while (cache.length <= n) cache.push(step(structuredClone(cache.at(-1)), 1 / HZ));
    return cache[n];
  };
}
