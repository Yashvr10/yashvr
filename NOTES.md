# Render contract

- `window.renderFrame(t)`: t is in seconds. It clears and redraws the whole canvas on every call.
- It reads only `t` and constants. It never uses `Date`, `performance.now`, `Math.random`,
  timers, CSS animations or transitions, or state that changes between calls.
- Randomness: use `hash(i, seed)` from `engine/rng.js`. `mulberry32` is for load time only.
- Stateful motion: use `fixedSim` from `engine/sim.js` (120 Hz, replayed from 0, cached by step).
- `window.READY` is set only after every face in `tokens.fontLoads` loads (it throws if one is missing),
  then `document.fonts.ready`, then each scene's `load()`.
- The preview loop runs only when the URL has no `?render`.

# Scenes

Each `scenes/sNN_*.js` exports `start`, `dur`, `draw(ctx, t, dur)` (t local to the scene) and an
optional async `load()`. Register them in `scenes/index.js`. Design values live in `tokens.js`.

# Commands

- `node render.mjs` writes frames/, then encode with ffmpeg (see README).
- `node still.mjs 0.4 1.2` writes qa/t0.40.png, qa/t1.20.png, ...
- `node test-determinism.mjs` checks the contract.

Fonts: Inter Tight, Inter and JetBrains Mono, under the SIL OFL (licenses in fonts/).
