# Render contract

- `window.renderFrame(t)`: t is in seconds. It clears and redraws the whole canvas on every call.
- It reads only `t` and constants. It never uses `Date`, `performance.now`, `Math.random`,
  timers, CSS animations or transitions, or state that changes between calls.
- Randomness: use `hash(i, seed)` from `engine/rng.js`. `mulberry32` is for load time only.
- Stateful motion: use `fixedSim` from `engine/sim.js` (120 Hz, replayed from 0, cached by step).
- `window.READY` is set only after every face in `tokens.fontLoads` loads (it throws if one is missing),
  then `document.fonts.ready`, then each scene's `load()`.
- The preview loop runs only when the URL has no `?render`.

# Frame pipeline

Scenes draw with Canvas2D into an offscreen layer. `engine/post.js` then, on the WebGL2 canvas #c:
fbm background (`shaders/bg.frag`) → layer composited over it in linear light → bloom (13-tap
down, tent up, 5 levels) → exposure → ACES fitted → grade → radial CA → vignette → grain → sRGB.
Scenes leave transparent wherever the background should show. `window.POST`
({ bloom, thresh, ca, grain, vig, exposure }) resets to `POST_DEFAULTS` every frame; a scene may
override values while drawing. Add `&nopost` to the URL for background + composite only.
WebGL2 with EXT_color_buffer_float is required; the page throws without it.

# Edit

`timeline.js` lists scenes and transitions in order. Each scene entry plays its scene from local
time `from` for `dur`; each transition is centred on a cut (flash starts on it). The cuts are one
array: moving a cut is editing one number. `?solo=<scene id>` plays a scene alone from 0.
Transitions (`engine/transitions.js`) draw both scenes into scratch layers and composite them on
the 2D layer; GL and 3D layers come from A until the cut, then B. `node qa-transitions.mjs`
renders every transition frame to qa/tr_<name>/ with a strip, and checks for blank frames, both
scenes at full opacity in the same pixels, and blur direction (whip: x, zoomThrough: radial).

# Camera

Every scene draws through `withCamera` (`engine/camera.js`) with `defaultPush` or its own camera,
and every layer declares its depth via `layerScale(cam, Z.far | Z.subject | Z.fore)`. Particles
take `particleCam(cam)` and parallax per particle. s05 is all 3D and frames itself with wallDolly.

# Scenes

Each `scenes/sNN_*.js` exports `dur`, `draw(ctx, t, dur)` (t local to the scene) and optionally
`load()`, `draw3D(t, dur)` and `drawGL(gl, t, dur)`. Register them in `timeline.js`. Design values live in `tokens.js`.
Shared drawing: `engine/type.js` (kinetic type moves),
`engine/draw.js` (lighting, grain, boil, shadows, draw-on, pulses) and `engine/props.js` (lit props).
`engine/particles.js` (closed-form motes, bursts, confetti, glyph sparks and GPU point sprites).
`engine/three3d.js` (three.js stage, cards, tiles, shadows and motion helpers; three r186 vendored in
`engine/vendor/`). A scene may export draw3D(t, dur) returning the three canvas; post composites it
between the background and the 2D layer. three's tone mapping stays off: post applies ACES.
`engine/layer.js` hands out the full-frame scratch layers (0–1 type.js, 2 draw.js, 3 particles.js).

Particles: no per-frame state. Each is a pure function of (i, t) with attributes from hash(i, k),
and every drawer takes cam = { dx, dy, z } for parallax. A scene may export drawGL(gl, t, dur) to
draw into the GL background target (behind the 2D layer, before post). A scene that uses particles
exports alphas(t), and `node test-particles.mjs <scene>` fails if any alpha steps more than 0.2
between frames. Fades that touch particles should be linear or eased in: outCubic starts at 3× speed.

Illustration rules: only the stroke, radius, shadowAlpha and hue tokens; at most 4 hues plus
neutrals. Outlines are a darker tone of each piece's own fill, never a shared black keyline.
The rim light sits on the right edge only, drawn over the outline.

# Commands

- `node render.mjs` writes frames/, then encode with ffmpeg (see README).
- `node still.mjs 0.4 1.2` writes qa/t0.40.png, qa/t1.20.png, ...
- `node sheet.mjs` renders s02 stills at the middle of each entrance, hold and exit, then tiles them into qa/type_sheet.png.
- `node ab.mjs 1 3` renders post off/on pairs into qa/post_ab.png.
- `node test-determinism.mjs [frames…] [--scene name]` checks the contract (frames relative to the scene).
- `node time.mjs [scene]` times renderFrame and PNG readback per frame.
- `PORT=8091 node …` runs any script on another port, so two can run at once.
- `node test-particles.mjs [scene]` scans particle alphas for frame-to-frame jumps.

Fonts: Inter Tight, Inter and JetBrains Mono, under the SIL OFL (licenses in fonts/).
