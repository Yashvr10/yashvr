# Carl Jung: The Light in the Darkness

16:9, 20:40, rendered with OpenFilm in the look of The Art of LARPING, framed as an old TV (rounded corners) with heavy grain.

- Brief: a 20-minute film on the same topic as Eternalised's "Carl Jung: A Journey into the Depths of the Soul", with similar visuals. That video's text is Jung's own (Memories, Dreams, Reflections and late interviews, still in copyright), so the narration (`src/narration.txt`) is an original script telling the same life in the same order, with a few short attributed quotations (see `NOTES.md`). `src/script.py` splits it into 217 lines (six chapters with epigraphs) and picks picture themes and key words.
- Voice: the user's own cloned voice ("My Voice"), made in the user's VoiceStudio session and handed over through git (branch claude/stoic-franklin-f6px0a, handoff/jung-myvoice); loudness-normalised; word times from Whisper (`src/align_whisper.py`).
- Pictures: public-domain (CC0) works from the Cleveland Museum of Art and the Art Institute of Chicago (dreams, alchemy, mandalas, storms, caves, sages, Symbolist prints; `src/museums.py`, `src/qj.json`, `src/qj2.json`), hand-picked (`src/rejected.json`), plus some reused from The Art of LARPING; 135 used. `src/look.py` frames each one for 16:9 without cutting faces (YuNet face detector in `src/models`, MIT licence), tall pictures shown whole on a blurred copy; `src/framing.json` records how. `src/refetch.py` re-downloads the originals.
- Look: grain over everything and the rounded old-TV frame (`src/grain.html`). Music: the same four CC BY tracks as The Art of LARPING.
- Film: `src/build.mjs` -> `film.html` + `captions.html`.
- Thumbnail: `thumbnail.jpg` (strip + "CARL JUNG / the light in the darkness"), `thumbnail-clean.jpg` (no title); all three pictures are public-domain museum works (Cleveland / Chicago).
- Deliverables: `video/Carl-Jung-The-Light-In-The-Darkness.mp4` (720p), `thumbnail.jpg`, `description.md` (title, description, chapters, tags, credits).
