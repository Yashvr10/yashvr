# STYLE.md: measured look of the private reference

Source: `ref/source.mp4` (private study only, never in output; `ref/` is git-ignored).
640 × 360, 23.976 fps, 45.96 s, 1,101 analysed frames. Percentages of frame width (W) or
height (H). All values measured from pixels unless marked ≈ (read by eye from the strips).
Measured with ffmpeg (2 fps frames, `select='gt(scene,0.3)',showinfo`, a 1 fps 8 × 6 contact
sheet, two 12 fps strips) and numpy (k-means on 368k pixels, per-frame mean |Δ| on
160 × 90 greyscale, phase-correlation shifts).

## Palette

k-means (k = 6) over all 92 frames at 2 fps; yellow measured separately on its pure pixels.

| Role | Hex | Coverage |
|---|---|---|
| paper | `#eae9e9` | 48.8% |
| paper shade | `#dbdad9` | 21.1% |
| ink | `#2a2725` centroid; solid core `#111111` | 10.2% |
| graphite (engraving mid-tones) | `#5d5b58` | 9.8% |
| red (annotation, labels, hero type) | `#d64647` | 4.8% |
| marker yellow | `#e8e60d` | 0.3% |

Remainder 5.3% is a light grey `#a4a09a` between paper and graphite. The ink centroid averages
solid ink with anti-aliased edges; the solid core (darkest decile of ink pixels, median over 74
paper frames) is `#111111`, which is the value to draw with. Saturated pixels
(HSV S > 110/255): 6.6% of all pixels; 2 hues in use (red 5.2%, yellow 0.3%). Imagery is
monochrome: archival engravings and newspaper scans at 0% saturation.

## Type

| Use | Family class | Weight / style | Cap height | Case | Tracking | Alignment |
|---|---|---|---|---|---|---|
| hero letters (2 glyphs) | high-contrast Didone serif | 900 roman | 81.1% H (rows 34–326 of 360) | upper | ≈ 0 em | centred, overflows W (cols 6–639) |
| name title | high-contrast serif | 700 italic | 10.8% H | title | ≈ 0 em | right edge at 88.6% W |
| subtitle under title | serif | 400 italic | ≈ 3.1% H | sentence | ≈ 0 em | right-aligned to title |
| quoted phrase | slab serif | 700 roman | 9.7% H | title, in quotes | ≈ 0 em | centred (24.7%–75.2% W) |
| two-line caption | serif | 400 roman | 8.3% H | title | ≈ 0 em | left at 21.4% W, leading ≈ 1.15 |
| place label in red box | serif | 700 italic, paper-white on red | ≈ 6.7% H | title | ≈ 0 em | left at 11.1% W |

Tracking is not measurable at 360p beyond ±0.01 em; every face reads as default spacing.

## Layout

- Margins: text left edges at 11.1–11.4% W, right edge at 88.6% W (11.4% W margin);
  top of the highest text at 11.7% H.
- Alignment per text block: 3 left, 2 centred, 1 right (6 typeset blocks measured).
- Elements per frame: 2–4, median 3 (one image or clipping, 1 text block, 1 annotation).
- Annotation stroke: 0.56–1.11% H (scales with the clipping); marker bar 6.1% H tall
  (rows 70–91), starting under the text baseline at 22% of cap height below the x-height.

## Motion (frames at 23.976 fps)

| Behaviour | Measured |
|---|---|
| title entrance | left-to-right wipe-on, ≈ 7 f, starting ≈ 2 f after the cut |
| quoted-phrase entrance | type-on, 11 characters in ≈ 8 f (0.73 f per character) |
| marker highlight | left-to-right wipe behind the text, ≈ 4–5 f, after the type-on |
| annotation draw-on (circle, underline) | 8 f (7.30–7.59 s), starting 9 f after the cut |
| camera move between items | 19–21 f, symmetric bell velocity: 10 f accelerate, 10 f decelerate; peak/mean velocity 3.4 (inOutCubic = 3.0, inOutQuart = 4.0); peak 15.5% H per frame |
| post-montage settle | 7 f scale settle, decelerating (mean \|Δ\| 9.3 → 3.2) |
| holds after entrances | 1.5–3.4 s, median 2.3 s (55 f) |
| camera during holds | locked off: mean \|Δ\| 0.00–0.03 per frame on static shots, no push, no drift |
| stagger between elements | annotation 9 f after its clipping; title 2 f after its cut |

## Transitions

| Type | Duration | Count | Frequency |
|---|---|---|---|
| hard cut | 0 f | 10 | 13.1 / min |
| montage burst: 5 clippings cut on twos, then a 7 f settle | 10 f + 7 f | 3 | every 3.0 s (20.73, 23.73, 26.74 s); 3.9 / min |
| zoom-through into a hero glyph (its red becomes the next frame's red bar) | 20 f, inOut | 1 | 1.3 / min |
| camera move to the next item on the same paper | 19 f, inOut | 1 | 1.3 / min |

No dissolves, wipes between shots, dips or flashes (0 occurrences).

## Texture

| Effect | Measured |
|---|---|
| grain | animated on paper and engraving shots: mean \|Δ\| 0.22–0.96 / 255 per frame in holds; none on maps (0.03) |
| paper texture | static, luminance std 2.2 / 255 in a flat 40 px patch (mean 231) |
| bloom | 0 (no glow around white type on dark engravings) |
| vignette | 0: corner / centre luminance 230 / 229 = 1.00 on a flat paper frame |
| blur | 0: type edges reach 221 / 255 contrast within 1 px; no depth or motion blur seen at 360p |
| chromatic aberration | 0 observed at 360p |

## Rhythm

| Measure | Value |
|---|---|
| editorial cuts (a montage counted once) | 13 in 45.96 s = 17.0 / min |
| all cuts (every montage frame counted) | 25 = 32.6 / min |
| mean shot length | 3.28 s (79 f) editorial; 1.77 s counting montage frames |
| typeset text on screen | ≈ 10.2 s = 22% of runtime (hero letters 1.7 s, quote 0.9 s, title 2.5 s, label 2.5 s, caption 2.6 s) |
| annotations on screen | ≈ 22 s = 48% of runtime |
