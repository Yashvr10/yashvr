# Delusional Until It Becomes Real

16:9, 7:23, rendered with OpenFilm in the same look as the Jung and Believe films: grain, a rounded old-TV frame, and
word-timed captions.

- Script: `src/narration.txt` is the user's own text, lightly edited for speech, with swearing removed. It has three chapters,
  each with a short epigraph. `src/script.py` turns it into 106 lines (`src/scenes.json`).
- Voice: the user's own "My Voice", made in the VoiceStudio session (handoff/delusional-myvoice). Word times come from
  Whisper (`src/align_whisper.py`).
- Pictures: public-domain (CC0) museum works. 35 are new (knights, empires, fire, dreams, faith, Don Quixote; `src/qd.json`).
  The rest are reused from the Believe film (`b-` keys) and the Jung film (`j-` keys). 105 are used.
- Music: three mysterious, suspenseful Kevin MacLeod tracks, CC BY 4.0, one per chapter: Hiding Your Reality, Interloper and
  Crypto (`src/music-credits.json`).
- Thumbnail: `thumbnail.jpg`, the user's lone-rider picture extended to 16:9 (`thumb/rider.jpg`), with the title.
- Deliverables: `video/Delusional-Until-It-Becomes-Real.mp4` (720p), `thumbnail.jpg`, and `description.md`.
