# Why the Greatest Minds Chose Solitude (8:00)

An essay film made with **OpenFilm** after a rea-video breakdown of "The Highest State a Human Can Reach" (Bygone Philosophy).
It borrows that video's *form*, not its content: paintings with slow camera moves, dissolves, centred serif captions,
pages from old books with the quoted lines highlighted, roman-numeral chapter cards, a calm male narrator over a quiet
ambient bed (about 15 dB under the voice), and a practical last chapter. Topic, script, sources, pictures, music and
thumbnail are all its own.

- `src/scenes.json`: the script (32 narrated scenes, an opening and six chapters) and the visuals per scene
  (`cap` caption, `label` small-caps name, `step` numbered card, `framed` portrait, `cut` the word a shot changes on).
- `src/quotes.json`: each quotation with its surrounding passage, source and the words highlighted as they are read.
- Rebuild: `/root/kokoro/.venv/bin/python src/tts.py . /root/kokoro && /root/kokoro/.venv/bin/python src/align.py . && node src/build.mjs`
- `thumbnail.html` renders `thumbnail.jpg` (1280×720).

## Sources

Every quotation is taken word for word from the Project Gutenberg text of the edition named:

| Source | Quoted |
|---|---|
| Blaise Pascal, Pensées, §139 · translated by W. F. Trotter | “I have discovered that all the unhappiness of men arises from one single fact, that they c…” |
| Marcus Aurelius, Meditations, IV.3 · translated by Meric Casaubon (1634) | “They seek for themselves private retiring places, as country villages, the sea-shore, moun…” |
| René Descartes, Discourse on the Method (1637), Part II · translated by John Veitch | “I remained the whole day in seclusion, with full opportunity to occupy my attention with m…” |
| Michel de Montaigne, Essays, I.38, “Of Solitude” · translated by Charles Cotton | “we must reserve a backshop, wholly our own and entirely free, wherein to settle our true l…” |
| Henry David Thoreau, Walden (1854) | “I went to the woods because I wished to live deliberately, to front only the essential fac…” |
| Henry David Thoreau, Walden (1854), “Visitors” | “I had three chairs in my house; one for solitude, two for friendship, three for society.…” |
| Friedrich Nietzsche, Thus Spake Zarathustra, Part I · translated by Thomas Common | “Flee, my friend, into thy solitude! I see thee deafened with the noise of the great men, a…” |

Other facts:
- The 2014 study: Wilson, Reinhard, Westgate, Gilbert et al., “Just think: The challenges of the disengaged mind”, *Science* (2014).
  The abstract: participants “typically did not enjoy spending 6 to 15 minutes in a room by themselves with nothing to do but think”
  and “many preferred to administer electric shocks to themselves”. (Per-sex percentages often quoted in the press were not
  checked and are not used.)
- Marcus Aurelius wrote parts of the Meditations on campaign: Book I ends “among the Quadi”, Book II “Whilst I was at Carnuntum”.
- Descartes: winter in Germany, Discourse Part II; the Discourse was published in 1637.
- Montaigne: in his 38th year (1571) he resolved to dedicate himself to study (Hazlitt's notes); his library is “in the third storey
  of a tower” (Essays III.3); “as I walk to and fro … I record and dictate”.
- Thoreau: moved in on the Fourth of July 1845; lived there two years and two months; materials “In all, $28.12½”;
  “Every day or two I strolled to the village”.
- Pascal: the Memorial of 23 November 1654, found after his death sewn into his coat (T. S. Eliot's introduction to the Pensées).
- **Not re-checked online:** Newton's 1665–66 plague years at Woolsthorpe (standard history; Wikipedia and Britannica were
  rate-limiting this session), and Pascal's calculating machine.

## Pictures

Paintings: The Metropolitan Museum of Art and the Art Institute of Chicago open-access collections (public domain, CC0).
Portraits: Openverse (public domain marks / CC0) and Wikimedia Commons (Maxham's 1856 daguerreotype of Thoreau).

| File | Title | Artist | Licence | Source |
|---|---|---|---|---|
| `beers-river.jpg` | Looking upon the River | Julie Hart Beers | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/262794 |
| `cole-newengland.jpg` | New England Scenery | Thomas Cole | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/57163 |
| `corot-reading.jpg` | Interrupted Reading | Jean Baptiste Camille Corot | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/81512 |
| `corot-tower.jpg` | River with a Distant Tower | Camille Corot | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/435983 |
| `courbet-alpine.jpg` | An Alpine Scene | Gustave Courbet | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/39554 |
| `dahl-elbe.jpg` | The River Elbe in Moonlight | Johan Christian Dahl | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/359382 |
| `dahl-waterfall.jpg` | Two Men before a Waterfall at Sunset | Johan Christian Dahl | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/439344 |
| `descartes.jpg` | Portrait René Descartes (1596-1650), Frans |  | CC0 (via Openverse) | https://www.rawpixel.com/image/8921175/portrait-rene-descartes-1596-1650 |
| `diaz-pond.jpg` | Pond in the Woods | Narcisse Virgile Diaz de la Peña | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/95993 |
| `friedrich-moon.jpg` | Two Men Contemplating the Moon | Caspar David Friedrich | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/438417 |
| `hammershoi-moonlight.jpg` | Moonlight, Strandgade 30 | Vilhelm Hammershøi | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/441933 |
| `hammershoi-reading.jpg` | Figure Reading at a Table in an Interior at Night | Vilhelm Hammershøi | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/406969 |
| `hammershoi-self.jpg` | Self-Portrait at Spurveskjul | Vilhelm Hammershøi | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/698749 |
| `inness-catskill.jpg` | Catskill Mountains | George Inness | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/68388 |
| `inness-heron.jpg` | The Home of the Heron | George Inness | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/64724 |
| `inness-old-mill.jpg` | The Old Mill | George Inness | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/30701 |
| `jerome.jpg` | Saint Jerome in Penitence | Master of the Lille Adoration | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/236975 |
| `mola-homer.jpg` | Homer Dictating | Pier Francesco Mola | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/5304 |
| `monks-landscape.jpg` | Two Monks in a Landscape | Italian | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/27309 |
| `newton.jpg` | Sir Isaac Newton. Mezzotint T |  | CC0 (via Openverse) | https://www.rawpixel.com/image/13990771/sir-isaac-newton-mezzotint-barlow-1868-after-sir-kneller-1689 |
| `pascal.jpg` | 21 Anonyme, d'après François Quesnel II, Portrait de Blaise Pascal,  | DCHNwam | PDM (via Openverse) | https://www.flickr.com/photos/57179180@N07/54685893301 |
| `robert-arches.jpg` | Arches in Ruins | Hubert Robert | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/437472 |
| `robert-colonnade.jpg` | A Colonnade in Ruins | Hubert Robert | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/437475 |
| `robert-marcus.jpg` | Equestrian Statue of Marcus Aurelius | Hubert Robert | Public domain (The Met Open Access, CC0) | https://www.metmuseum.org/art/collection/search/459379 |
| `schreyer-snow.jpg` | Man with Lance Riding through the Snow | Adolphe Schreyer | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/895 |
| `thoreau.jpg` | Henry David Thoreau, daguerreotype by Benjamin D. Maxham, 1856 | Benjamin D. Maxham | Public domain | https://commons.wikimedia.org/wiki/File:Henry_David_Thoreau.jpg |
| `twachtman-icebound.jpg` | Icebound | John Henry Twachtman | Public domain (Art Institute of Chicago, CC0) | https://www.artic.edu/artworks/72801 |

## Sound

- Music (CC BY 3.0, credit required): “Free BGM For Meditation #3” by Ambient Samurai - Ichiro NAKAGAWA (https://www.jamendo.com/track/1074586); “Meditation at the Full Moon” by Mark Subbotin (https://www.jamendo.com/track/1446225).
- Sound effects (CC0, Freesound via Openverse): Page Turn by davidbain; winter wind in trees.wav by lwdickens; WoodThrushinMorningShawneeForestMay272012.wav by kvgarlic; Fire in the stove by mcmikai; Clock Ticking by unfa; plus OpenFilm and HyperFrames library sounds.
- Narration: Kokoro 82M, voice `bm_george`, speed 0.86.
- Fonts: EB Garamond and Cormorant Garamond (SIL OFL), plus Playfair Display, Inter (OFL).
