# Render contract

- `window.renderFrame(t)`: t is in seconds. It clears and redraws the whole canvas on every call.
- It reads only `t` and constants. It never uses `Date`, `performance.now`, `Math.random`,
  timers, CSS animations or transitions, or state that changes between calls.
- Randomness: use `hash(i, seed)` from `engine/rng.js`. `mulberry32` is for load time only.
- Stateful motion: use `fixedSim` from `engine/sim.js` (120 Hz, replayed from 0, cached by step).
- `window.READY` is set only after every face in `tokens.fontLoads` loads (it throws if one is missing),
  then `document.fonts.ready`, then each scene's `load()`.
- The preview loop runs only when the URL has no `?render`.

# Aspects

`?aspect=16x9|9x16` (render.mjs `--aspect`). tokens.js sets W, H, the type sizes (9:16 at 90%,
measured against TH = 1080 × TYPE) and `safe` = { x, top, bottom } (9:16: 108, 280, 560). Scenes
place everything through `engine/layout.js`: `L.cx()`, `L.cy()` (centre of the safe band), `L.col`,
`L.row`, `L.slot` (columns in 16:9, a stack in 9:16), `L.type(px)` for type-sized offsets,
`L.cap(pct)`, `L.textTop`, and `L.stack` (H > W). `rowsOf` re-breaks lines into balanced rows only
when stacked, so 16:9 stays as composed. 9:16 plays the short edit (`SHORT` in timeline.js, 17.5 s)
unless `?edit=full`. `?guides` adds the safe margins (yellow) and the 9:16 caption band (magenta).
`node qa-aspects.mjs && python3 qa-sheet.py` renders every scene in both aspects into
qa/sheet_16x9.png and qa/sheet_9x16.png and lists text crossing a safe line.

# Supersampling

`?ss=N` (render.mjs `--ss N`) sizes #c, the 2D layer, the scratch layers and the three.js canvas at
W·N × H·N. renderFrame starts the 2D context at setTransform(N, 0, 0, N, 0, 0), so scenes still lay out
in 1920×1080 units; `unit(ctx)` (engine/layer.js) resets to that layout identity, and only code that
copies whole layers uses the true identity. Canvas2D `filter` blur and `shadowBlur` ignore the
transform, so every blur radius is × SS. In GL: uRes is in real px, and the fibre cell, grain cell, CA
offset, first bloom tap spacing and particle point size are × SS. Text boxes stay in layout px.
At ss=1 frames are pixel-identical to before.

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

# Copy

All visible text lives in `copy.json`, keyed by scene id (arrays of lines); scenes read it with
`lines(id)` from `engine/copy.js` and hold no copy literals. Each scene declares `captions`
(which lines, entrance `in`, settled `at`); `holdFor(text) = max(tokens.hold, 0.35 + words/3.2)`
sets each hold, scenes derive their `end` from it, and `timeline.js` places cuts from those ends.
`caption()` draws a riseIn block with a feathered 30% black scrim and a 24 px shadow. Every text
draw registers its box; `?check` (and preview) reads the frame back and warns below 7:1.
Background particle density and bloom drop 40% while a caption is fully visible.
`?guides` (preview only) outlines `tokens.safe16x9` and `tokens.safe9x16`.
`node export-srt.mjs` writes out/captions.srt. `node qa-captions.mjs` renders one still per caption
(middle of its hold) to qa/captions/ and flags lines under 7:1 or outside safe16x9.
Captions are ink on paper; scrim and shadow take the opposite polarity to the text.
3D text (s05 cards) registers its boxes by projecting card rectangles through the camera.

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

- `node render.mjs video [from] [to]` writes frames/f%05d.png (resumable: existing frames are skipped,
  each is written as .tmp then renamed). `--workers N` splits the range across child processes,
  `--batch N` (default 60) relaunches Chrome every N frames, `--out DIR` changes the folder.
  A frame slower than 8× the running median is retried; 5+ identical frame sizes in a row warn;
  any page error or console error exits non-zero.
- `node render.mjs stills 0.5,2,4.25` writes qa/still_<t>.png.
- `node render.mjs preview --every 3` writes JPEGs to frames_preview/ and out/preview.mp4 at 10 fps.
- `node render.mjs pipe out/draft.mp4 [from] [to]` streams PNGs straight into ffmpeg (no frames on disk).
- `node render.mjs info [--solo ID] [--ss N]` prints the page's FPS, DURATION, frame count and canvas size.
- `./encode.sh <draft|final1080|final1080ss|final2160|upscale2160|capped|addsilence> [--vertical] [--capped]
  [--solo ID] [--in PATH] [--out FILE]` encodes frames/ (1×) or frames_ss2/ (2×) and runs verify.mjs.
  upscale2160 adds no detail; vertical takes the centred 9:16 crop (from 1× frames that is an upscale).
- `node verify.mjs out/x.mp4 [--size WxH] [--solo ID]` asserts size, fps and nb_frames == round(DURATION × FPS).
- `node still.mjs 0.4 1.2` writes qa/t0.40.png, qa/t1.20.png, ...
- `node sheet.mjs` renders s02 stills at the middle of each entrance, hold and exit, then tiles them into qa/type_sheet.png.
- `node ab.mjs 1 3` renders post off/on pairs into qa/post_ab.png.
- `node test-determinism.mjs [frames…] [--scene name]` checks the contract (frames relative to the scene).
- `node time.mjs [scene]` times renderFrame and PNG readback per frame.
- `PORT=8091 node …` runs any script on another port, so two can run at once.
- `node test-particles.mjs [scene]` scans particle alphas for frame-to-frame jumps.

Fonts: Inter Tight, Inter and JetBrains Mono, under the SIL OFL (licenses in fonts/).
