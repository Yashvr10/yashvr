# Why the Greatest Men Must Suffer (8:12)

An essay film made with **OpenFilm** after a rea-video breakdown of "The Greatest Men MUST Face Entropy" (Trojanize).
It takes that video's *form*: whole paintings letterboxed on black (never cropped), very slow push-ins, long holds
(the reference averages about 13 s a shot), an old-projected-film texture (grain, dust, flicker, gate lines), no text
on screen, a calm narrator and a quiet minor-key music bed. The topic, script, sources, pictures, music and thumbnail
are its own.

- `src/script.md`, `src/scenes.json`: the script (30 narrated scenes: an opening and eight chapters) and the picture per scene.
- Rebuild: `/root/kokoro/.venv/bin/python src/tts.py . /root/kokoro && python3 src/align_whisper.py . && node src/build.mjs`
- `src/pages/grain.html`: the old-film overlay, drawn from t (deterministic).
- `thumbnail.html` renders `thumbnail.jpg` (1280×720).

## Sources (quotations are word for word from these Project Gutenberg editions)

| Who | Text |
|---|---|
| Nietzsche | Beyond Good and Evil (1886) §225, tr. Helen Zimmern; Twilight of the Idols, “Maxims and Arrows” 8, tr. A. M. Ludovici |
| Seneca | “Of Providence”, in Minor Dialogues, tr. Aubrey Stewart |
| Marcus Aurelius | Thoughts (Meditations) V.20 and VII.61, tr. George Long |
| Epictetus | The Enchiridion V and IX, tr. T. W. Higginson; his life from that edition's introduction |
| Beethoven | The Heiligenstadt letter, 6 October 1802, in Beethoven's Letters 1790–1826, tr. Lady Wallace |
| Cervantes | Don Quixote, tr. John Ormsby: the biographical introduction (Lepanto 1571, five years captive in Algiers, freed 19 September 1580, Seville prison 1597, published 1605) |
| Milton | Sonnet XVI and Paradise Lost III, in The Poetical Works of John Milton; Andrew Marvell's prefatory poem (“thy loss of sight”) |

Not re-checked online (Wikipedia and Britannica were rate-limiting): the year Beyond Good and Evil was published (1886),
Seneca as Nero's tutor and one of Rome's richest men, and Milton dictating Paradise Lost. All are standard history.

## Pictures

Paintings from The Metropolitan Museum of Art and the Art Institute of Chicago open-access collections (public domain, CC0);
portraits of Nietzsche and Beethoven via Openverse (CC0). No picture is used twice.

| File | Title | Artist | Licence | Source |
|---|---|---|---|---|
| `aic-quixote-mountains.jpg` | Don Quixote in the Mountains | Style of Honoré Victorin Daumier | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/14565 |
| `beethoven.jpg` | Beethoven portrait (1820) romanticism oil |  | CC0 (via Openverse) | https://www.rawpixel.com/image/11499593/image-face-hand-person |
| `captive-slave.jpg` | The Captive Slave (Ira Aldridge) | John Philip Simpson | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/193664 |
| `catel-colosseum.jpg` | Inside the Colosseum | Franz Ludwig Catel | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/219254 |
| `church-cotopaxi.jpg` | View of Cotopaxi | Frederic Edwin Church | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/76571 |
| `coello-donjuan.jpg` | Portrait of Don Juan of Austria | Alonso Sánchez Coello | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/80540 |
| `corenzio-battle.jpg` | Battle Scene | Belisario Corenzio | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/338534 |
| `courbet-alpine.jpg` | An Alpine Scene | Gustave Courbet | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/39554 |
| `daumier-quixote.jpg` | Don Quixote and the Dead Mule | Honoré Daumier | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/436092 |
| `david-socrates.jpg` | The Death of Socrates | Jacques Louis David | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/436105 |
| `dupre-road.jpg` | On the Road | Jules Dupré | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/890 |
| `hammershoi-music.jpg` | Interior. The Music Room, Strandgade 30 | Vilhelm Hammershøi | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/270002 |
| `hammershoi-reading.jpg` | Figure Reading at a Table in an Interior at Night | Vilhelm Hammershøi | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/406969 |
| `heade-harbor.jpg` | York Harbor, Coast of Maine | Martin Johnson Heade | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/152747 |
| `homer-herring.jpg` | The Herring Net | Winslow Homer | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/25865 |
| `inness-heron.jpg` | The Home of the Heron | George Inness | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/64724 |
| `jerome.jpg` | Saint Jerome in Penitence | Master of the Lille Adoration | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/236975 |
| `lorrain-sunrise.jpg` | Sunrise | Claude Lorrain (Claude Gellée) | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/435907 |
| `mola-homer.jpg` | Homer Dictating | Pier Francesco Mola | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/5304 |
| `momper-road.jpg` | Mountain Road with Travelers | Joos de Momper, II | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/16340 |
| `monks-landscape.jpg` | Two Monks in a Landscape | Italian | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/27309 |
| `muller-rollcall.jpg` | The Roll Call of the Last Victims of the Terror | Charles Louis-Lucien Muller | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/111730 |
| `nietzsche.jpg` | Portret van Friedrich Nietzsche, RP-F-00-10994 | Rijksmuseum | CC0 (via Openverse) | https://commons.wikimedia.org/w/index.php?curid=146894069 |
| `peyron-seneca.jpg` | The Death of Seneca | Pierre Peyron | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/370513 |
| `pille-soldiers.jpg` | Soldiers Marching in Water | Charles-Henri Pille | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/343159 |
| `potter-shepherd.jpg` | The Shepherd | Paulus Potter | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/22112 |
| `rembrandt-star.jpg` | The Star of the Kings: A Night Piece | Rembrandt van Rijn | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/49037 |
| `robert-marcus.jpg` | Equestrian Statue of Marcus Aurelius | Hubert Robert | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/459379 |
| `roman-galley.jpg` | Roman Galley | Anonymous, Italian, 16th century | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/342210 |
| `rottmayr-forge.jpg` | Venus and Cupid at the Forge of Vulcan | Johann Michael Rottmayr | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/12879 |
| `steen-merry.jpg` | Merry Company on a Terrace | Jan Steen | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/437749 |
| `vandyck-plague.jpg` | Saint Rosalie Interceding for the Plague-stricken of Palermo | Anthony van Dyck | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/436257 |
| `vedder-storm.jpg` | Storm in Umbria | Elihu Vedder | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/57215 |
| `whistler-sea.jpg` | Violet and Silver—The Deep Sea | James McNeill Whistler | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/84088 |
| `whistler-studio.jpg` | The Artist in His Studio | James McNeill Whistler | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/65709 |

## Sound

- Music (CC BY 3.0, credit required): “Cello Suite No.2 in D minor, BWV 1008. SARABANDE” performed by Ivan Dolgunov (https://www.jamendo.com/track/1545490); “Cello Suite No.2 in D minor, BWV 1008. PRELUDE” performed by Ivan Dolgunov (https://www.jamendo.com/track/1545488); “Cello Suite No.2 in D minor, BWV 1008. MENUET1 / MENUET 2” performed by Ivan Dolgunov (https://www.jamendo.com/track/1545491).
- Narration: Kokoro 82M, voice `bm_george`, speed 0.82; word timings by openai-whisper (small.en).
