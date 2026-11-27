# Why Believing in Yourself Feels So Lonely

16:9, 25:27, rendered with OpenFilm in the same look as Carl Jung: The Light in the Darkness: grain, a rounded old-TV frame,
and word-timed captions.

- Script: `src/narration.txt` is an original script in seven chapters with Jung epigraphs. `src/script.py` turns it into
  359 lines (`src/scenes.json`).
- Voice: the user's own "My Voice". Word times come from Whisper (`src/align_whisper.py`).
- Pictures: public-domain (CC0) works from the Cleveland Museum of Art and the Art Institute of Chicago (`src/museums.py`),
  framed so no face is cut (`src/look.py`). 157 are used; the credits are in `src/photo-credits.json` and `description.md`.
- Music: five Kevin MacLeod tracks, CC BY 4.0 (`src/music-credits.json`).
- Film: `src/build.mjs` builds `film.html` and `captions.html`.
- Deliverables: `video/Why-Believing-In-Yourself-Feels-So-Lonely.mp4` (720p), `thumbnail.jpg`, and `description.md`
  (title, description, chapters, tags, credits).
