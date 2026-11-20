# VOX style (video category)

Use this whenever the user asks for a "vox style" video.
Reference: Instagram reel Df73uILi3W8 (25.5 s, 1440x1080 4:3, 24 fps, by TheFallenPoet).
Frames are in `reference/`.

## Look: an animated antique engraving book
- **Background:** aged cream paper texture (#e9e1cc to #d9cfb5), with soft vignette and grain.
  Some scenes flip to a **night-black ink background** (#0d0f1e) for the "dark" beat, with drawings in white line.
- **Art:** 18th–19th-century public-domain scientific plates and engravings, cut out and layered as flat paper pieces with a soft drop shadow.
  Examples: hand-coloured insects and butterflies, cross-hatched engraved hands, a portrait engraving.
  Sources: Biodiversity Heritage Library, Wikimedia Commons, Old Book Illustrations.
  Colour comes only from the coloured plates (ochre, cobalt blue, rust orange). Everything else is sepia or ink.
- **Plate layout:** some shots are a book plate with a thin ruled border and "Fig. 1 / Fig. 2" labels in tiny italic serif.

## Motion: cut-out animation, 2D
- **Puppet moves:** the hand slides in, closes and presses, with simple 2D transforms and a slight overshoot.
- **Stop-motion feel:** some elements step at 12 fps.
- **Burst:** engraved rays pop out around an action on the key word ("hero"). Little hands/fists pop in at the corners.
- **Morph swaps:** pieces swap state in place (cockroach to butterfly, a butterfly wing replaced by a cockroach wing, "Fig." creatures swapping colours) to show an idea.
- **Particles:** blue and yellow paint flecks drift on the dark scenes.
- **Push-ins:** slow push-in on a portrait (Nietzsche engraving) as a butterfly flies past.
- **Transitions:**
  - a **torn-paper wipe** (a jagged paper edge slides up to reveal the next scene);
  - an **ink-blot iris** (a black blot grows from the centre to fill the frame, then opens on a paper texture);
  - hard cuts on phrase changes.
- **Pacing:** about one visual idea per spoken phrase (2.5–4 s). The art reacts on the stressed word.

## Captions
- One spoken phrase at a time, **bottom centre**, about 4.5% of frame height, with generous letter spacing.
- Font: **hand-lettered small caps**, dark ink (#2a2420) on paper and off-white (#f2ecdf) on dark scenes.
  Free match: *Patrick Hand SC* (Google Fonts, OFL). Alternatives: *Gochi Hand* or *Architects Daughter* in uppercase.
- Captions appear on a hard cut, with no animation, and stay for the whole phrase.
- End card: a small typewriter italic line (credit / CTA) at the bottom centre, then the scene fades to a darker paper.
  Font: *Special Elite* or *Courier Prime Italic*.

## Sound
- **Voice:** calm, deep male narration, slow, with clear pauses between phrases. Use the Kokoro voice bm_george or an invideo stock voice. Never clone a real person.
- **Music:** soft cinematic bed under the voice, which swells to full level after the last line and over the end card. The mix is about -17 LUFS integrated.
  Use CC/royalty-free tracks (Jamendo, Free Music Archive, invideo library).
- Light paper / whoosh sound effects on wipes and swaps are optional.

## Script shape
- Short philosophy quote or idea (for example "How true it was when Nietzsche said…"), then two contrasting examples, then the principle, then the punchline lesson.
- Reels: 20–60 s, in 4:3 (1440x1080) like the reference, or 9:16 if asked.

## How to build it
- OpenFilm or HyperFrames HTML: layered PNG cut-outs (RVM or rembg for engravings), GSAP-style transforms, a paper-texture background, SVG torn-edge and ink-blot masks, and the caption track from Whisper word timings.
- If the user asks for invideo, generate the voice and music there. The art and animation still come from cut-outs.
- Show a style frame and a 5–10 s preview before rendering the full video.
