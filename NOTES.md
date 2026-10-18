# Render contract

- `window.renderFrame(t)`: t is in seconds. It clears and redraws the whole canvas on every call.
- It reads only `t` and constants. It never uses `Date`, `performance.now`, `Math.random`,
  timers, CSS animations or transitions, or state that changes between calls.
- Randomness: use `hash(i, seed)` from `engine/rng.js`. `mulberry32` is for load time only.
- Stateful motion: use `fixedSim` from `engine/sim.js` (120 Hz, replayed from 0, cached by step).
- `window.READY` is set only after the fonts in `FONTS`, `document.fonts.ready` and the scene's `load()` have all resolved.
- The preview loop runs only when the URL has no `?render`.

Commands: `node render.mjs` writes frames/, then run ffmpeg (see README). `node test-determinism.mjs` checks the contract.
