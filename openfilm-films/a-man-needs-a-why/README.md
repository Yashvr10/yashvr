# A Man Needs a Why

A 9:56 essay film on purpose, made with OpenFilm. It is modelled on the arc of a reference video ("Purpose: The Deepest Human Desire"), but the argument and sources here are different: Marcus Aurelius, Nietzsche, Aristotle, Seneca, Thoreau, Ecclesiastes, and the 2019 JAMA Network Open study on purpose and mortality.

- `src/scenes.json`: the script, scene by scene, with the picture for each scene
- `src/quotes.json`: every quotation, with the text around it from the Gutenberg edition it came from
- `src/build.mjs`: builds `film.html` from the scenes, the narration and the Whisper word timings
- `src/tts.py`: Kokoro narration (voice bm_george, speed 0.82)
- `src/align_whisper.py`: word timing used to sync the captions
- `thumbnail.html` → `thumbnail.jpg` (1280×720)
- `description.md`: the YouTube title, description, chapters and tags

Rebuild: `python3 src/align_whisper.py $PWD && node src/build.mjs`, then `npx -y openfilm@latest render --workers 3 --loudness=-14`.

Notes and caveats:
- Every quotation was checked word for word against its Gutenberg text. The study's figures were checked against its abstract on Europe PMC. The film says the study shows a link, not a cause.
- The paintings are public domain (Met and AIC CC0). The music is CC BY 3.0 and needs the credit in `description.md`.
- The narration is synthetic. Listen to the mix before publishing.
