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
Shared drawing: `engine/backdrop.js` (background), `engine/type.js` (kinetic type moves),
`engine/draw.js` (lighting, grain, boil, shadows, draw-on, pulses) and `engine/props.js` (lit props).
`engine/layer.js` hands out the full-frame scratch layers (0–1 type.js, 2 draw.js).

Illustration rules: only the stroke, radius, shadowAlpha and hue tokens; at most 4 hues plus
neutrals. Outlines are a darker tone of each piece's own fill, never a shared black keyline.
The rim light sits on the right edge only, drawn over the outline.

# Commands

- `node render.mjs` writes frames/, then encode with ffmpeg (see README).
- `node still.mjs 0.4 1.2` writes qa/t0.40.png, qa/t1.20.png, ...
- `node sheet.mjs` renders s02 stills at the middle of each entrance, hold and exit, then tiles them into qa/type_sheet.png.
- `node test-determinism.mjs` checks the contract.

Fonts: Inter Tight, Inter and JetBrains Mono, under the SIL OFL (licenses in fonts/).
