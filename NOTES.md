# NOTES.md: handoff

## 1. Goal
A silent 10.0 s vertical (1080×1920, 30 fps, 300 frames) Vox-style Mixed Media explainer: **how
India's UPI went from about 1 million payments a month (Aug 2016) to 21.6 billion (Dec 2025)**.
Rendered from code: `renderFrame(t)` in `index.html` draws each frame; headless Chrome captures it;
ffmpeg encodes. 16:9 comes from the same scenes (`?aspect=16x9`). Look: `STYLE.md`.
Through-line object: one QR tile (`collage.qrTile`, seed `collage.tile.seed`) in every scene.
Story: s01 states 2016, s02 asks "how many now?", s03 is the reveal (tiles form ₹), s04 answers.

Facts (only these; nothing else is a number on screen):
- About 1 million UPI transactions a month in Aug 2016, its first live month. Sources: YourStory,
  "UPI crosses 10 million transactions in less than a year" (2017-07), and Millennium Post, "NPCI
  crosses 1 crore transactions in June", both reporting NPCI's July 2017 release.
- 21.63 billion transactions in Dec 2025, the record month. Sources: Business Today, "UPI ends 2025
  on a high…" (2026-01-03); Punjab Kesari, "Record UPI Transaction 2025" (citing NPCI data).
- So about 20,000× (21.63 billion ÷ about 1 million ≈ 21,600). Say "≈20,000×", never more precise.
- s02's bars between 2016 and 2025 are an ILLUSTRATIVE curve and stay unlabelled.

## 2. Frozen files (read-only)
Every file whose first line (second in a shader) says `// FROZEN`:
`engine/*.js`, `shaders/*.frag`, `tokens.js`, `scenes/s01_hook.js`, `scenes/s02_growth.js`.
Also leave alone: `index.html`, `render.mjs`, `encode.sh`, `verify.mjs`, the QA tools, `fonts/`.
A scene task touches only `scenes/sNN_*.js`, `timeline.js` and `copy.json`. If the engine lacks
something, write it locally in the scene file and list it under Known issues.

## 3. Engine API (signatures; positions are frame px, times are seconds)
**tokens.js**: `W, H` (1080×1920; 1920×1080 with ?aspect=16x9), `FPS` 30, `DURATION` 10,
`colors` {yellow, paper, navy, coral, ink, white, dim}, `fields` {yellow, paper, navy}: {fill, text},
`fonts` {display: Anton, label: Inter Tight, small: Inter}, `sizes` {giant, hero, h1, h2, body,
label, small}, `tracking`, `hold` 1.2, `motion` {enter 0.35, overshoot 1.4, stagger 0.06,
drawOn 0.4, push 0.04, impact 0.06}, `collage` {border, shadow, halftone, tape, tile {size, seed}},
`stroke` {outline, detail, annotate}, `safe`, `titleSafe`, `captionBand`.

**layout.js**: `L.left/right/top/bottom/width/height`, `L.cx()`, `L.cy()` (safe band centre),
`L.col(i, n)`, `L.row(i, n)`, `L.slot(i, n)` ({x, y}: columns in 16:9, a stack in 9:16),
`L.stack` (H > W), `L.textTop`, `L.textBottom` (where text may start and end), `L.type(px)`,
`L.cap(pct)`; `rowsOf(ctx, text, maxW, max = 3)` (re-breaks only when stacked);
`baselines(n, y, lineH)`; `column(heights, gaps, y = L.cy())` → tops of a centred stack.

**ease.js**: `clamp01, win(t, a, b), lerp`, `outExpo` (entrances), `outBack(u, s)` (pops, s =
motion.overshoot), `outCubic` (exits), `inOutCubic`, `inOutQuint`, `spring(x, k, z)`.
**rng.js**: `hash(i, seed)` → 0..1, stateless. (`mulberry32` is load-time only.)

**type.js**: every move is `move(ctx, t, opts)`, t = seconds since the move began; opts: text, x,
y (baseline), align, size, family ('display' | 'label' | 'small'), weight, track, color, stagger,
label (copy line it belongs to). `riseIn` (per-glyph rise + blur; settles stagger·(n−1) + 0.25),
`scramble`, `typeOn`, `odometer` ({from, to, prefix, suffix, dur}), `markerWipe` ({word, accent,
on}: a marker bar behind one word), `splitExit`, `fade(ctx, alpha, dy, fn)` (fades a group as one),
`fontOf(o)`, `base(o)`, `glyphsOf`, `scrambleLocks`.
**copy.js**: `lines(id)` (copy.json), `holdFor(text)` = max(1.2, 0.35 + words/3.2),
`windows(id, [{ lines, in, at }])` → captions with `out = at + holdFor`, `caption(ctx, t, text, o)`,
`parseNumber(text)`, `registerText`, `registerBox`.

**collage.js**: `field(ctx, color)`, `rect(w, h, r)`, `tornRect(w, h, { seed, amp, step })`,
`poly(ctx, pts)`, `cutout(ctx, pts, { x, y, s, r, fill, border, shadow, alpha, paint })`,
`halftone(ctx, [x0, y0, x1, y1], { color, cell, angle, from, to, dir })`,
`tape(ctx, x, y, r, { seed, alpha })`, `loop(cx, cy, rx, ry, { seed })` and
`underline(x0, x1, y, { seed })` (marker paths: call `measure(pts)` once in load()),
`marker(ctx, pts, p, { color, width })`, `qrTile(ctx, x, y, size, { seed, fg, bg, reveal })`.
**draw.js**: `measure(pts)`, `drawOn(ctx, pts, p)`, `pointAt`, `pulseAlong`, `boilPath`,
`contactShadow`, `shade(hex, dl)`.
**particles.js**: `burst(ctx, t, { t0, x, y, n, speed, gravity, life, width, colors, op })`,
`confetti`, `motes`, `assemble(ctx, t, targets, { t0, dur, spread, dist, turn, overshoot, draw })`
with `draw(ctx, p, i)` getting p = {x, y, r, s, a}, `assembleEnd(opts)`,
`targetsFromText(text, font, { step, x, y })` (load time only). `op` 'source-over' paints (light
fields); 'lighter' adds (navy).
**camera.js**: `withCamera(ctx, cam, draw)`, `defaultPush(t, dur)`, `layerScale(cam, Z.subject)`,
`punch(t, tImpact)` (multiply into cam.s), `inPush(x, y)` (pull edge-anchored text in so the push
never carries it past the edge), `Z` {far, subject, fore}.
**transitions.js**: used from timeline.js only: `whip` 0.2, `zoomThrough` 0.25, `glitch` 0.133,
`dip` 0.3, `flash` (pass `dur: 0.1`; its default 0.067 is under the 0.1 floor). Not `matchCut`
(0.4 s, over the ceiling). In 9:16 the whip is vertical.
**post / gl / layer / textboxes / sim**: internal. A scene may set `window.POST` keys for its
frames (they reset every frame); nothing in this video needs to.

## 4. Conventions (the renderFrame(t) contract)
- `draw(ctx, t, dur)` is a pure function of t: no Math.random, Date, performance.now, timers or
  state carried between calls (render.mjs and test-determinism.mjs catch them). Randomness is
  `hash(i, seed)`. Build paths once in `load()`; call `measure()` on every marker path there.
- Copy comes from `copy.json` via `lines(ID)`. No string literals on screen.
- Values come from `tokens.js` and positions from `layout.js`. No new colours, fonts, sizes,
  easing curves or timings. Scene-local layout ratios (gaps in px, fractions of L.width) are fine.
- Every caption: `windows(ID, [{ lines, in, at }])`, with `at` = when its type settles. Marks
  (underlines, loops) don't delay `at`. `end` = the last caption's `out`; `dur = end + EXIT`.
- Entrances 0.3–0.6 s (`outExpo`, or `outBack(u, motion.overshoot)` for pops); exits 0.15–0.3 s
  (`outCubic`); holds ≥ 1.2 s via holdFor; transitions 0.1–0.3 s.
- Impact time of an outBack pop: `t0 + d × (1 − s / (s + 1))`, s = motion.overshoot (see s01).
- Text stays inside `L.textTop..L.textBottom` and `L.left..L.right`, through the camera push
  (`inPush` for edge-anchored text; don't punch layers whose text sits on an edge).
- Draw the field (`field(ctx, F.fill)`) outside any fade, so exits fade the content, not the paper.
- Scene files stay under 300 lines.

## 5. Scene status
| id | file | in edit | dur in edit | type | status |
|---|---|---|---|---|---|
| s01_hook | scenes/s01_hook.js | 0.000 | 2.700 | kinetic type over collage | done, EXEMPLAR, frozen |
| s02_growth | scenes/s02_growth.js | 2.700 | 2.533 (from 0.15) | chart built from pieces | done, EXEMPLAR, frozen |
| s03_reveal | scenes/s03_reveal.js | 5.233 | ≈2.100 | tiles assemble into ₹ (navy) | TODO (task 1) |
| s04_answer | scenes/s04_answer.js | ≈7.333 | ≈2.667 (trimmed to end at 10.000) | the answer: number + marks | TODO (task 2) |

## 6. Exemplar scenes
- `scenes/s01_hook.js`: the pattern every scene follows (its header lists the 5 steps): copy via
  lines, a BEATS block, captions via windows/holdFor, load() once, pure draw through withCamera.
  Shows: a cutout dropping in with an outBack impact + punch + burst, tape, riseIn type in a
  `column()` layout, a marker underline, the exit, the 9:16 / 16:9 split (`L.stack`).
- `scenes/s02_growth.js`: pieces built over time in a world layer under the camera, with a
  screen layer on top (the question on a torn strip that slams in), and edge text via `inPush`.
- Engine demos (`demos/*.js`, `node demo.mjs` → `qa/demo_*.png`): one still per module.
  `demos/particles.js` shows assemble() + targetsFromText('₹') with qrTile pieces: s03's pattern.

## 7. Next tasks (in order; one scene per task)
**Task 1: s03_reveal.** Copy the structure of `s02_growth.js`; the assemble pattern is
`demos/particles.js`.
- Field `fields.navy`. No copy: `captions = []`, no copy.json entry.
- load(): `TARGETS = targetsFromText('₹', `400 ${S}px ${fonts.display}`, { step, x: L.cx(), y: L.cy() })`
  with S = L.height × 0.8 and step = L.width / 28 (rounded).
- `FLY = { t0: 0, dur: 0.5, spread: 0.4, dist: L.height, overshoot: motion.overshoot }`; draw each
  piece as `qrTile(c, 0, 0, step × 0.9 × p.s, { seed: collage.tile.seed + i })` under
  translate/rotate/globalAlpha, exactly like `demos/particles.js`.
- LAND = `assembleEnd(FLY)` (0.9 s): the impact. `punch(t, LAND)` on the camera, plus a burst of
  paper bits (`colors: [colors.white, colors.paper]`, n 40) at the glyph's bottom edge.
- Camera: a pull-back, cam.s from 1.12 to 1 over [0, LAND] with `inOutCubic`, times defaultPush.
- `end = LAND + hold` (no text, so the hold is `hold` from tokens); `dur = end + 0.2` (exit as s01).
- timeline.js: after s02, add `{ tr: zoomThrough }` then `{ scene: 's03_reveal', from: 0 }`.
- Stills: `node compare.mjs s03_reveal s02_growth`; determinism on frames 10 and 40.

**Task 2: s04_answer.** Copy the structure of `s01_hook.js` (type over collage).
- Field `fields.paper`. copy.json `"s04_answer": ["21.6 BILLION", "A MONTH, DEC 2025",
  "≈20,000× SINCE 2016", "SOURCE: NPCI"]`.
- Layout `column()`: the QR tile (callback to s01, at 0.6 scale) / number (`sizes.giant`, fit to
  the column exactly like s01's numberSize) / line (`sizes.h1`) / kicker (`sizes.h2`) / source
  (`fonts.small`, `sizes.small`, ink).
- Beats: the tile drops as in s01 (0–0.35, impact + punch); number riseIn at 0.1; line at 0.2;
  coral `marker(loop(...))` around the number over [0.5, 0.5 + motion.drawOn]; kicker as
  `markerWipe` (accent colors.yellow, on colors.ink, word 0) at 0.7; source riseIn at 0.6.
- Captions: four separate windows (number, line, kicker, source), so no hold runs past ~2.4 s.
- No exit beyond the edit's end: the video ends on this hold. Keep `dur = end + EXIT` anyway.
- timeline.js: `{ tr: flash, dur: 0.1 }` then `{ scene: 's04_answer', from: 0, trim: X }` with X
  chosen so `node render.mjs info` prints `"DURATION":10` and `"frames":300`.
- Stills: `node compare.mjs s04_answer s01_hook`; determinism on frames 15 and 60.

**Task 3: final render.** `node render.mjs video --workers 2`, `./encode.sh final1080`,
`node verify.mjs out/final1080.mp4`; the same with `--aspect 16x9` (frames into frames_16x9).
`node qa-aspects.mjs` must print "no text crosses a safe line". Update this table.

## 8. Self-check (report pass or fail for each, honestly)
1. Only `scenes/sNN_*.js`, `timeline.js`, `copy.json` changed (`git diff --stat`).
2. No hex colours, font names, px font sizes, easing formulas or new timing constants in the
   scene (grep the file for `#`, `px`, `Math.pow`, `**`): tokens and engine only.
3. Every on-screen string comes from copy.json via lines().
4. captions via windows(); end = the last caption's out; dur = end + EXIT.
5. Entrances 0.3–0.6 s (outExpo / outBack), exits 0.15–0.3 s, transitions 0.1–0.3 s.
6. `node test-determinism.mjs <f1> <f2> --scene <id>` prints PASS.
7. `node sheet.mjs <id>`: every caption at 7:1 or above.
8. `node qa-aspects.mjs`: no text crosses a safe line (both aspects).
9. `node sheet.mjs <id> --aspect 16x9` composes (nothing cut off, no overlaps).
10. The scene file is under 300 lines.
11. `qa/sNN_vs_exemplar.png` made with compare.mjs and looked at against the exemplar.
12. The status table and Next tasks above are updated.

## 9. Known issues
- s01's burst isn't covered by `test-particles.mjs` (needs an `alphas(t)` export); its fade-in is
  the engine's linear ramp, inside the 0.2/frame limit.
- The s01→s02 whip: at the frame after the cut, s02 is still mostly motion blur (one near-blank
  paper frame); by +3 frames its baseline and tiles are in. Acceptable at 30 fps.
- Paper mottle (`background.amount` 0.35) shows a faint large blotch on flat fields.
- `?nopost` skips only the final pass; the paper texture (composite) still applies. Anything a
  scene draws with drawGL multiplies under the paper texture instead of adding.
- `qa-transitions.mjs` reports whip blur as an x/y ratio (vertical whips in 9:16 read low) and
  tiles its strip at 16:9 thumbnails.
- `qrTile` is decorative (random modules, real finder squares); never present it as scannable.
- SwiftShader renders at about 0.85 frames/s per worker (300 frames ≈ 3 min with --workers 2).

## 10. Commands
- `node render.mjs video [from] [to] [--workers N] [--aspect 16x9] [--out DIR] [--ss 2]`;
  `stills 0.5,2`; `preview --every 3`; `pipe out/x.mp4`; `info [--solo ID]`.
- `./encode.sh draft|final1080|final1080ss|final2160|upscale2160|capped|addsilence [--aspect 16x9] [--in DIR] [--out FILE]`
  (verifies with verify.mjs). `node verify.mjs out/x.mp4 [--solo ID] [--aspect 16x9]`.
- `node test-determinism.mjs [frames…] [--scene ID]` (frames relative to the scene).
- `node sheet.mjs [ID…] [--aspect 16x9]` → qa/sheet_<ID>.png at each key moment, with contrast.
- `node compare.mjs <ID> [exemplar] [--aspect 16x9]` → qa/<sNN>_vs_exemplar.png.
- `node qa-aspects.mjs && python3 qa-sheet.py` → safe-line crossings, qa/sheet_9x16.png / 16x9.
- `node demo.mjs` → qa/demo_*.png and the 300-line check on engine/.
- Page flags: `?solo=ID`, `?demo=NAME`, `?aspect=16x9`, `?ss=2`, `?check`, `?guides`, `?nopost`, `?render`.
- `PORT=8091 node …` runs a tool on another port so two can run at once.
