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
