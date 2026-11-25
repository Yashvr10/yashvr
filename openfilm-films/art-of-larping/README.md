# The Art of LARPING: How to Act Your Ideal Self Into Existence

16:9, 22:39, rendered with OpenFilm in the look of You Were Programmed and The Battle of Thoughts.

- Script: the user's own script (`src/script-original.txt`). The narration (`src/narration.txt`) follows it word for word, except: softened swearing (see `NOTES.md`); "this piece / this publication / read / what you just read" -> "this video / this channel / watch / what you just heard"; numbers, citations and the "&" written out for speech; capitals added. The five headings are chapter cards (I-V); the chapter epigraphs are narrated with their authors. `src/script.py` splits it into 207 lines and picks picture themes and key words.
- Voice: the user's own cloned voice ("My Voice", VoiceStudio/OmniVoice), made in the user's VoiceStudio session and handed over through git (branch claude/stoic-franklin-f6px0a, handoff/larp-myvoice); loudness-normalised; word times from Whisper (`src/align_whisper.py`).
- Pictures: public-domain (CC0) works from the Cleveland Museum of Art and the Art Institute of Chicago, hand-picked (objects, masks as artefacts, text pages and off-topic works removed; `src/rejected.json`), plus pictures reused from You Were Programmed; 142 used. New themes: Alexander, Rome (Mantegna's Triumphs of Caesar), theatre, myth, builders (`src/q2.json`, `src/q3.json`).
- Film: `src/build.mjs` -> `film.html` + `captions.html`. Music: four CC BY tracks, crossfaded.
- Thumbnail: three-image strip, "THE ART OF / larping", made in the user's VoiceStudio session (`thumbnail.jpg`, clean version `thumbnail-clean.jpg`). Its pictures are third-party artwork; rights not checked.
- Deliverables: `video/The-Art-Of-Larping.mp4` (720p), `thumbnail.jpg`, `description.md` (title, description, chapters, tags, credits).
