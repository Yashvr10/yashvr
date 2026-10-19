# Israel–Hamas war: a 30 s silent explainer

A self-contained project in `promo/`. It uses a copy of the UPI video's engine (`engine/`, `shaders/`, render and QA tools), restores `engine/three3d.js` and three.js from `archive/engine/`, and has its own `tokens.js`, `copy.json`, `timeline.js` and `scenes/`. The UPI video at the repo root is untouched. Run every command from `promo/`. Puppeteer needs `CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` in this container.

## Brief and rules
- 30.0 s, 900 frames at 30 fps. The 16:9 master is recomposed (not cropped) for 9:16 (`?aspect=9x16`).
- Style: near-black ground, off-white type (Inter Tight 700), one muted amber accent, grain and slow pushes. Fast whips were dropped as wrong for the subject.
- **No numbers on screen.** No figures were supplied, and casualty counts are disputed. That rule includes dates.
- Neutral wording: documented events in past tense, with attribution where a claim is a party's own ("stated aim").
- No graphic imagery and no land borders: the map shows only the coast and the Gaza Strip.

## Shot list (as built)

| id | start | dur | type | copy | out |
|---|---|---|---|---|---|
| s01_open | 0.0 | 3.4 | type | It began with an attack. / On Israel, led by Hamas. | match cut 0.3 s (the amber rule becomes the coastline) |
| s02_map | 3.4 | 4.0 | illustration (map) | Israel · Gaza · Hostages were taken into Gaza. | hard cut |
| s03_response | 7.4 | 3.4 | type | Israel launched a military campaign. / Its stated aim: destroy Hamas. | dip 0.3 s |
| s04_cost | 10.8 | 4.6 | 3D cards | Civilians killed. · Families displaced. · Hostages taken. | zoomThrough 0.25 s |
| s05_crisis | 15.4 | 4.4 | 3D wall | A humanitarian crisis in Gaza. | hard cut |
| s06_talks | 19.8 | 3.8 | illustration (map) | Talks. Pauses. Ceasefires. | dip 0.3 s |
| s07_now | 23.6 | 3.0 | type | The search for peace continues. | dip 0.3 s |
| s08_end | 26.6 | 3.4 | end card | Israel–Hamas war / Sources: UN OCHA, UN News | end |

Copy changed from the approved list:
- s03 line 2 now reads "Its stated aim: destroy Hamas." instead of "Its target: Hamas, in Gaza.". The new line attributes the aim to Israel instead of asserting what was targeted.
- s04 card 3 now reads "Hostages taken." instead of "Hostages held.". Most hostages have since been released, so "held" is no longer true.

Slots are fixed. `timeline.js` build() throws if any caption's holdFor would run past the point where its scene is covered (its cut, or the start of a dip or zoom leaving it).

## Facts: each line and its source (checked 19 Oct 2026)
- **s01 and s02.** On 7 Oct 2023, Hamas-led gunmen attacked communities and a music festival in southern Israel and took hostages into Gaza. Sources: UN OCHA, "Hostilities in the Gaza Strip and Israel" flash updates (ochaopt.org), and AP's hostage tallies as reported in the press. The dotted arcs on the map start at Kfar Aza, Be'eri, the Nova festival site near Re'im, and Nir Oz.
- **s03.** Israel's stated war aims were to eliminate Hamas, return the hostages, and ensure Gaza is no longer a threat. These are Netanyahu's own words, widely reported (e.g. thejc.com, "Netanyahu vows to stick to the goals of the war").
- **s04.**
  - "Civilians killed": civilians were killed both in Israel and in Gaza (OCHA).
  - "Families displaced": OCHA reported up to about 80% of Gaza's population displaced by late 2023 (OCHA flash updates, Nov 2023).
  - "Hostages taken": see s01.
- **s05.** The UN describes the situation in Gaza as a humanitarian crisis (OCHA; UN News). Famine was confirmed in Gaza City in August 2025. A year into the ceasefire, about 65% of Gazans still live in tents or makeshift shelters (UN Shelter Cluster, Oct 2026).
- **s06.** Each of these was negotiated through mediators:
  - a humanitarian pause from 24 Nov 2023, which lasted seven days (OCHA);
  - a ceasefire from 19 Jan 2025;
  - a ceasefire from 10 Oct 2025, under a US-brokered plan endorsed by UN Security Council resolution 2803.
- **s07.** As of Oct 2026, the October 2025 ceasefire holds in name, but strikes continue and talks on its second phase have stalled. Sources: UN Security Council, 15 Oct 2026 (press.un.org, SC/16478); Amnesty International and 100+ NGOs, 9 Oct 2026; Al Jazeera, 13 Oct 2026; Times of Israel, Oct 2026.
- **The map** is hand-placed and approximate, at roughly 0.02° accuracy. It is not survey data. The Gaza Strip outline is its boundary with Israel and Egypt; no other borders are drawn.

## Scenes and engine notes
- `scenes/_kit.js` holds what the scenes share:
  - type blocks that break into rows (in either aspect) and shrink to fit;
  - `settles()`, which always allows for one row break;
  - the map's projection, coast, strip and arcs;
  - the s01 rule, which is the match cut's shape.
- The 3D scenes (s04, s05) render with three.js and **draw the 3D canvas into the 2D layer**, not into post's three slot. That way the zoomThrough carries both scenes.
- s05's tile backs use Lambert, with no specular: a glossy sheen greyed the dark type.
- matchCut runs 0.3 s; the engine default of 0.4 s is over the ceiling. Its shape is the rule rect, so its outline lands on the rule s02 starts from.

## QA and renders (19 Oct 2026, SwiftShader, 4 cores)
- **Holds:** timeline build() passes in both aspects: every caption holds at least holdFor before its scene is covered.
- **Contrast:** every 2D caption measured 14.1–16.0:1 (qa/stills.mjs). Card and wall text is drawn in 3D and isn't measured; by eye it reads near-white on dark and near-black on white.
- **Determinism** (qa/determinism.mjs): **PASS**. Tested on 12 frames in 16:9 and 6 frames in 9:16, covering every scene and transition; the cold, in-order, reverse and repeat renders were byte-identical.
- **Flicker** (qa/flicker.mjs, 16:9): **PASS**. No frame jumps away and back.
  - Most of the 202 spikes are motion: the wall turning, the zoom and the dips.
  - Isolated single-pair bumps at 59, 128 and 265 come from text edges stepping by about 1 px under the slow camera push (text rendering snaps sub-pixel positions). They're minor; ss=2 halves them.
- **Render time:**
  - ss=1: 900 frames in 524 s on 3 workers, about 1.7 s per frame per worker. A single page takes 0.7–1.9 s per frame, slowest on the 3D scenes.
  - ss=2: 16:9 took 1730 s and 9:16 took 1664 s on 3 workers, about 5.6–5.8 s per frame per worker.
  - Encodes of final1080ss and final2160: 438 s.
- **Outputs**, all verified by verify.mjs at 30 fps with nb_frames 900:

| file | size | resolution | bitrate |
|---|---|---|---|
| out/final_1080_ss.mp4 | 14.5 MiB | 1920×1080 | 4.06 Mb/s |
| out/final_2160.mp4 | 163 MiB | 3840×2160 | 45.7 Mb/s |
| out/final_9x16.mp4 | 15.7 MiB | 1080×1920 | 4.38 Mb/s, recomposed from `--aspect 9x16` frames, not cropped |
| out/draft.mp4 | 2.35 MiB | 1920×1080 | 0.66 Mb/s, the ss=1 draft |

## Upload package (out/, git-ignored)
- The masters were renamed to final_2160.mp4, final_1080_ss.mp4 and final_9x16.mp4. They were already encoded with libx264 `-preset slow -crf 18 -pix_fmt yuv420p -movflags +faststart`, so nothing was re-encoded.
- The `*_a.mp4` copies add a silent 48 kHz stereo AAC track (anullsrc, `-shortest`, `-c:v copy`).
- **Thumbnail:**
  - `scenes/thumb.js`, reached with `index.html?thumb` (not in the timeline). Run `node qa/thumb.mjs`.
  - The page renders at a whole-number SS, so the thumbnail is rendered at ss=2 (3840×2160) and downscaled with lanczos to 2560×1440 (`qa/thumb_2560.png`), then to `out/thumb.jpg` (1280×720) and `out/thumb_320.jpg`.
  - The words are the video's title (copy.json s08_end), because `{{THUMB_WORDS}}` arrived unfilled.
- **Cover:** `out/cover_9x16.jpg` is frame 57 (1.9 s) of the 9:16 cut, taken from its ss=2 PNG: both opening lines are settled and the rule has finished drawing.
- **Captions:** `out/captions.srt` comes from `node qa/export-srt.mjs`. Captions that are on screen together merge into one cue, so cues never overlap.
- **Probe:** `node qa/probe-all.mjs` asserts codec, pix_fmt, size, fps, duration and frame count of every video against the timeline.
