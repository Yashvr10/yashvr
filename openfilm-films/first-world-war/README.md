# The First World War (about 5 min)

A narrated documentary, 1920×1080 at 30 fps, made with **OpenFilm**. Its motion graphics are ported from the
**HyperFrames registry** (installed with the `hyperframes` skills).

- `film.html`: the film. Open it in OpenFilm Studio with `npx -y openfilm@latest open .`. Export it with `npx -y openfilm@latest render`.
- `src/scenes.json`: the script, one entry per scene, with the visuals for each. Change a line here, then rebuild:
  ```bash
  /root/kokoro/.venv/bin/python src/tts.py . /root/kokoro    # narration, Kokoro (bm_george); only changed lines are redone
  /root/kokoro/.venv/bin/python src/align.py .               # word timings -> assets/vo/*.vtt (faster-whisper)
  node src/build.mjs                                          # film.html and the pages
  ```
  The voice sets the length: each scene lasts as long as its narration, plus 0.3 s of air before it and 0.4 s after.
- `src/pages/`: page templates. `{{cue:word}}` becomes the second at which the narrator says that word, so a map
  lights a country as it is named and a number counts up as it is spoken.
- `lib/fw.js`: shared code. `play()` joins a HyperFrames-style paused GSAP timeline to OpenFilm's `frame(t)`.
  `europe()` draws Natural Earth countries with D3, `countUp()` counts numbers.

## What came from where

| Piece | Source |
|---|---|
| Lower thirds (`lt-*.html`) | HyperFrames registry block `lt-kicker-name`, restyled |
| Maps (`map-*.html`) | HyperFrames registry block `world-map` (D3 + topojson + world-atlas), reprojected to Europe |
| Counting numbers (`stat-*.html`) | HyperFrames registry component `count-up` |
| Warm light over the Christmas truce and Armistice Day | HyperFrames registry block `organic-light-leak-overlay` |
| Film grain, vignette and flicker over the whole film (`grain.html`) | HyperFrames registry component `grain-overlay`, made deterministic |
| Impact, typing and whoosh sounds (`assets/sfx/hf-*`) | HyperFrames `media-use` skill, bundled sounds (Pixabay Content License) |
| Other sound effects | OpenFilm library (CC0) |
| Narration | Kokoro 82M (kokoro-onnx), voice `bm_george`, generated on this machine |
| Photographs and paintings | Wikimedia Commons, public domain (or no known restrictions): see `src/photo-credits.json` |
| Music | Wikimedia Commons, public domain: see `src/music-credits.json` |
| Fonts | Playfair Display, Inter, Inter Tight, JetBrains Mono (SIL OFL; licences in `fonts/`) |
| Libraries | GSAP 3.14.2, D3 7.9.0, topojson-client 3.1.0, world-atlas 2.0.2 (in `lib/`) |

## Sources for the facts

These were checked against Wikipedia in November 2026: "World War I", "Assassination of Archduke Franz Ferdinand",
"First Battle of the Marne", "Western Front (World War I)", "Christmas truce", "Second Battle of Ypres",
"Gallipoli campaign", "Sinking of the RMS Lusitania", "Battle of Verdun", "Battle of the Somme",
"Battle of Flers–Courcelette", "Zimmermann Telegram", "Treaty of Brest-Litovsk", "Hundred Days Offensive",
"Armistice of 11 November 1918", "World War I casualties" and "Treaty of Versailles".

| Claim in the film | Source says |
|---|---|
| 15 to 22 million dead | "estimated to be 15 to 22 million deaths" (WWI casualties) |
| 28 June 1914, Princip, at close range | "assassinated by Bosnian Serb student Gavrilo Princip in Sarajevo on 28 June 1914 … shot at close range" |
| War on Serbia 28 July; Russia mobilises; Germany on Russia then France; Belgium invaded; Britain 4 August | World War I, July Crisis section |
| Within 70 km of Paris; the Marne in September | "came within 70 km (43 mi) of Paris but at the First Battle of the Marne (6–12 September)" |
| About 600 taxis | "Gallieni commandeered about 600 taxicabs" |
| Trenches from the North Sea to Switzerland | Western Front (World War I) |
| About 100,000 in the Christmas truce; gifts, carols, football | Christmas truce |
| Chlorine gas near Ypres, April 1915 | "On 22 April 1915 … released 168 long tons of chlorine gas" |
| Gallipoli: Allied withdrawal after about 8 months | landings 25 April 1915, campaign ended 9 January 1916 |
| Lusitania: nearly 1,200 dead, about 128 American | 763 survivors of 1,960 aboard; "about 128 of the dead were American citizens" |
| Verdun lasted 302 days | "The battle lasted for 302 days" |
| Somme, 1 July: 57,470 casualties, 19,240 killed, the British Army's worst day | Battle of the Somme |
| More than a million killed or wounded at the Somme | "more than one million were either wounded or killed" |
| Tanks first used, September 1916 | Battle of Flers–Courcelette |
| US declares war 6 April 1917; Zimmermann telegram | World War I; Zimmermann Telegram |
| Brest-Litovsk, March 1918 | "signed on 3 March 1918" |
| Spring offensive advanced nearly 100 km | "moved nearly 100 kilometres (60 miles) to the west" |
| Amiens 8 August, more than 500 tanks | Hundred Days Offensive |
| Armistice signed at 5 a.m. in a railway carriage at Compiègne; fighting stopped at 11 a.m.; 2,738 died on the last day | Armistice of 11 November 1918 |
| 60 million European soldiers mobilised; 9 to 11 million soldiers dead; 6 to 13 million civilians | World War I |
| Four empires fell; Versailles signed 28 June 1919, five years to the day after Sarajevo | World War I; Treaty of Versailles |

Map lines (the Schlieffen routes, the 1914 front and the 1918 offensive) are simplified and labelled as approximate.
The maps show today's borders, and say so on screen.
