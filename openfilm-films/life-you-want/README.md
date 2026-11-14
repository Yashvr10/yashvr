# If You're Not Living the Life You Want, Watch This

A 13:06 essay film, made with OpenFilm, after a reference video on the same topic. Script in `script.md`; scenes in `src/script.py`.

Style, from the user's earlier instructions:
- A caption on every spoken line, in the sans + script style (`tools/caption-style/`), word by word as it is spoken, never across a cut.
- No captions on the book pages (the `q-` pages, highlighted as they are read) or on the study card.
- Eight words placed huge behind a figure, whose cut-out hides the middle letters (`tools/cutout.py`, `src/behind.py`).
- Sound effects on caption landings: a tick on script words, a swish and a thump on big words and behind words, a page turn on book pages, a soft "open" on quotes.
- The archival look of the reference: every photograph in a sepia grade; faded prints get a darker, stronger grade (`src/faded.json`).

Rebuild: `python3 src/script.py && /root/kokoro/.venv/bin/python src/tts.py $PWD /root/kokoro && python3 src/align_whisper.py $PWD && python3 src/behind.py && node src/build.mjs`, then render with `npx -y openfilm@latest render --workers 3 --loudness=-14` and add the caption sounds with `python3 src/mix_extra.py <render>.mp4 out.wav`.

Every quotation was checked word for word against its Project Gutenberg text, and the study against its abstract. The narration is synthetic: listen before publishing.
