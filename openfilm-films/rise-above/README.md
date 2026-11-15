# Rise Above the Ordinary

A 6:05 film made with OpenFilm from the user's own script (narrated word for word). Scenes in `src/script.py`.

Style, from the user's earlier instructions:
- A caption on every spoken line, in the sans + script style (`tools/caption-style/`), word by word as it is spoken, never across a cut.
- Three words placed huge behind a figure, whose cut-out hides the middle letters (`tools/cutout.py`, `src/behind.py`).
- Sound effects from earshot, rendered from its bank and checked by its audio models: a whoosh (z +5.1 as "fast whoosh") and an impact on big and behind words, a soft tick on script words, a swell on chapter cards, a hit under each "rise" on the title.
- Art from the Cleveland Museum of Art Open Access collection (CC0), in a light painterly grade.

Rebuild: `python3 src/script.py && /root/kokoro/.venv/bin/python src/tts.py $PWD /root/kokoro && python3 src/align_whisper.py $PWD && python3 src/behind.py && node src/build.mjs`, then render with `npx -y openfilm@latest render --workers 3 --loudness=-14` and add the caption sounds with `python3 src/mix_extra.py <render>.mp4 out.wav`.

The narration is synthetic: listen before publishing.
