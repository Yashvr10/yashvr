# The Second World War (7:54)

A narrated documentary, 1920×1080 at 30 fps, made with **OpenFilm**. It is built the same way as `../first-world-war`
(see that README), with motion graphics ported from the **HyperFrames registry** (`lt-kicker-name` lower thirds,
`world-map` maps, `count-up` numbers, `organic-light-leak-overlay`, `grain-overlay`).

- `src/scenes.json`: the script (35 narrated scenes, six chapters) and the visuals for each.
- Rebuild: `/root/kokoro/.venv/bin/python src/tts.py . /root/kokoro && /root/kokoro/.venv/bin/python src/align.py . && node src/build.mjs`
- Watch and edit: `npx -y openfilm@latest open .`. Export: `npx -y openfilm@latest render --loudness=-14`.

The maps cover the 1938 to 1939 road to war, Poland, the fall of the West, Barbarossa, Japan's empire, 1943 and the
Normandy beaches. Two small originals (Paris 1940, the Ardennes 1944) are shown as framed prints rather than stretched.
The Holocaust scene has no music on purpose.

## Sources for the facts (Wikipedia, checked November 2026)

| Claim | Source says |
|---|---|
| 60 to 75 million dead, about 3% of the 1940 population | "An estimated total of 60–75 million deaths … about 3% of the estimated global population of 2.3 billion in 1940" (WWII casualties) |
| Hitler appointed chancellor 30 January 1933; Enabling Act 23 March | Adolf Hitler |
| Rhineland 7 March 1936; Austria 12 March 1938; Munich 30 September 1938 | the three articles |
| "peace for our time"; Prague seized 15 March 1939 | Neville Chamberlain |
| Pact with a secret protocol to partition Poland, 23 August 1939 | Molotov–Ribbentrop Pact |
| Poland: 1 September; Britain and France declare war 3 September; Soviet invasion 17 September; over by 6 October | Invasion of Poland |
| Denmark and Norway April 1940; Low Countries and France from 10 May | World War II; Battle of France |
| Dunkirk: 338,226 evacuated, 26 May to 4 June | Dunkirk evacuation |
| Paris fell 14 June; armistice eight days later (22 June) | World War II; Battle of France |
| Battle of Britain 10 July to 31 October 1940; Blitz 7 September 1940 to 11 May 1941; more than 40,000 civilians killed | Battle of Britain; The Blitz |
| Barbarossa 22 June 1941: more than 3.8 million Axis troops, 2,900 km front | Operation Barbarossa |
| Soviet counter-offensive at Moscow from 5 December 1941 | Battle of Moscow |
| Pearl Harbor: 2,403 Americans killed; US declares war 8 December; Germany and Italy declare war on the US 11 December | Attack on Pearl Harbor |
| Around six million Jews murdered, about two thirds of Europe's Jews; at Auschwitz at least 1.1 million died | The Holocaust; Auschwitz |
| Midway: all four Japanese fleet carriers sunk | Battle of Midway |
| El Alamein 23 October to 4 November 1942 | Second Battle of El Alamein |
| Stalingrad: 6th Army surrendered 2 February 1943; about 91,000 prisoners, most of whom perished | Battle of Stalingrad |
| Kursk from 5 July 1943 | Battle of Kursk |
| D-Day: largest seaborne invasion in history, nearly 160,000 troops | Normandy landings |
| Bagration: 28 divisions of Army Group Centre destroyed | Operation Bagration |
| Paris liberated 25 August 1944; Bulge from 16 December 1944 | the two articles |
| Hitler's suicide 30 April 1945; German surrender in force 8 May (9 May in Moscow) | Adolf Hitler; VE Day |
| Hiroshima 6 August, Soviet declaration of war 8 August, Nagasaki 9 August; 150,000 to 246,000 killed | Atomic bombings; Surrender of Japan |
| Surrender announced 15 August, signed 2 September aboard USS Missouri | Surrender of Japan |
| UN Charter signed 26 June 1945 | United Nations |

The maps use today's borders and simplified routes, and say so on screen.

## Pictures (Wikimedia Commons)

3 of 26 are Creative Commons and are credited here; the rest are public domain.

| File | Licence | Source |
|---|---|---|
| `auschwitz.jpg` | Public domain | [Gate of Auschwitz II, 28 November 2007.jpg](https://commons.wikimedia.org/wiki/File:Gate_of_Auschwitz_II%2C_28_November_2007.jpg) |
| `b17.jpg` | Public domain | [B-17 group in formation.jpg](https://commons.wikimedia.org/wiki/File:B-17_group_in_formation.jpg) |
| `berlin-1945.jpg` | Public domain | [Ruins of the Reichstag in Berlin, 3 June 1945. BU8573.jpg](https://commons.wikimedia.org/wiki/File:Ruins_of_the_Reichstag_in_Berlin%2C_3_June_1945._BU8573.jpg) |
| `breadline.jpg` | Public domain | [Unemployed men queued outside a depression soup kitchen opened in Chic](https://commons.wikimedia.org/wiki/File:Unemployed_men_queued_outside_a_depression_soup_kitchen_opened_in_Chicago_by_Al_Capone%2C_02-1931_-_NARA_-_541927.jpg) |
| `bulge.jpg` | Public domain | [26th Infantry Regiment near Butgenbach.jpg](https://commons.wikimedia.org/wiki/File:26th_Infantry_Regiment_near_Butgenbach.jpg) |
| `cemetery.jpg` | CC BY-SA 3.0 | [Cimetiere americain Colleville-sur-Mer.jpg](https://commons.wikimedia.org/wiki/File:Cimetiere_americain_Colleville-sur-Mer.jpg) |
| `chamberlain.jpg` | Public domain | [MunichAgreement.jpg](https://commons.wikimedia.org/wiki/File:MunichAgreement.jpg) |
| `dday.jpg` | Public domain | [Into the Jaws of Death 23-0455M edit.jpg](https://commons.wikimedia.org/wiki/File:Into_the_Jaws_of_Death_23-0455M_edit.jpg) |
| `dunkirk.jpg` | Public domain | [Dunkirk 26-29 May 1940 NYP68075.jpg](https://commons.wikimedia.org/wiki/File:Dunkirk_26-29_May_1940_NYP68075.jpg) |
| `eastern-front.jpg` | Public domain | [Piechota niemiecka szturmuje płonącą wieś na froncie wschodnim (2-1009](https://commons.wikimedia.org/wiki/File:Piechota_niemiecka_szturmuje_p%C5%82on%C4%85c%C4%85_wie%C5%9B_na_froncie_wschodnim_%282-1009%29.jpg) |
| `el-alamein.jpg` | Public domain | [El Alamein 1942 - British tanks.jpg](https://commons.wikimedia.org/wiki/File:El_Alamein_1942_-_British_tanks.jpg) |
| `hiroshima.jpg` | Public domain | [Atomic cloud over Hiroshima - NARA 542192 - Edit.jpg](https://commons.wikimedia.org/wiki/File:Atomic_cloud_over_Hiroshima_-_NARA_542192_-_Edit.jpg) |
| `hitler-1933.jpg` | Public domain | [Entrevue Hitler-Hindenburg - l'auto dans laquelle se trouve Hitler, so](https://commons.wikimedia.org/wiki/File:Entrevue_Hitler-Hindenburg_-_l%27auto_dans_laquelle_se_trouve_Hitler%2C_sortant_du_Palais_-_btv1b90493949.jpg) |
| `midway.jpg` | Public domain | [Douglas SBD-3 Dauntless bombers of VS-8 over the burning Japanese crui](https://commons.wikimedia.org/wiki/File:Douglas_SBD-3_Dauntless_bombers_of_VS-8_over_the_burning_Japanese_cruiser_Mikuma_on_6_June_1942.jpg) |
| `missouri.jpg` | Public domain | [Surrender of Japan - USS Missouri (restored).jpg](https://commons.wikimedia.org/wiki/File:Surrender_of_Japan_-_USS_Missouri_%28restored%29.jpg) |
| `okinawa.jpg` | Public domain | [FG-1D Corsairs of VMF-323 over Okinawa 1945.jpeg](https://commons.wikimedia.org/wiki/File:FG-1D_Corsairs_of_VMF-323_over_Okinawa_1945.jpeg) |
| `paris-1940.jpg` | CC BY-SA 3.0 | [German soldiers before Arc du Carrousel 1940.jpg](https://commons.wikimedia.org/wiki/File:German_soldiers_before_Arc_du_Carrousel_1940.jpg) |
| `paris-1944.jpg` | Public domain | [Paris1944-improved.jpg](https://commons.wikimedia.org/wiki/File:Paris1944-improved.jpg) |
| `pearl-harbor.jpg` | Public domain | [USS Arizona (BB-39) burning at Pearl Harbor 1941.jpg](https://commons.wikimedia.org/wiki/File:USS_Arizona_%28BB-39%29_burning_at_Pearl_Harbor_1941.jpg) |
| `poland-1939.png` | CC BY 2.0 | [German soldiers remove the Polish border crossing in Sopot during the ](https://commons.wikimedia.org/wiki/File:German_soldiers_remove_the_Polish_border_crossing_in_Sopot_during_the_first_stages_of_the_Invasion_of_Poland_%2848661789227%29.png) |
| `spitfire.jpg` | Public domain | [Pilots of No. 19 Squadron RAF stage a mock 'scramble' from the back of](https://commons.wikimedia.org/wiki/File:Pilots_of_No._19_Squadron_RAF_stage_a_mock_%27scramble%27_from_the_back_of_a_truck_at_Fowlmere_near_Duxford%2C_September_1940._CH1398.jpg) |
| `st-pauls.jpg` | Public domain | [St Paul's Survives.jpg](https://commons.wikimedia.org/wiki/File:St_Paul%27s_Survives.jpg) |
| `stalingrad.jpg` | Public domain | [Field Marshal Paulus, General Heitz and other German officers of the 6](https://commons.wikimedia.org/wiki/File:Field_Marshal_Paulus%2C_General_Heitz_and_other_German_officers_of_the_6th_Army_after_its_surrender.jpg) |
| `un.jpg` | Public domain | [Charter of the United Nations - DPLA - 545d720f0991d8f4e0994182ac386e2](https://commons.wikimedia.org/wiki/File:Charter_of_the_United_Nations_-_DPLA_-_545d720f0991d8f4e0994182ac386e20_%28page_39%29.jpg) |
| `ve-day.jpg` | Public domain | [Ve Day Celebrations in London, 8 May 1945 TR2876.jpg](https://commons.wikimedia.org/wiki/File:Ve_Day_Celebrations_in_London%2C_8_May_1945_TR2876.jpg) |
| `warsaw-ruins.jpg` | Public domain | [Warsaw Ghetto after the war and St Augustine Church.jpg](https://commons.wikimedia.org/wiki/File:Warsaw_Ghetto_after_the_war_and_St_Augustine_Church.jpg) |

## Sound

- Music (public domain, Wikimedia Commons): Grieg - Peer Gynt Suite No. 1, Op. 46 - II. The Death of Aase (Musopen Symphony).flac, Holst- mars.ogg, Last Post bugle call.ogg.
- Narration: Kokoro 82M, voice `bm_george`. Sound effects: OpenFilm library (CC0) and HyperFrames `media-use` (Pixabay).
  The air-raid siren was synthesised with ffmpeg.
