# Rise Above the Ordinary

A 4:39 film made with OpenFilm from the user's own script (narrated word for word). Scenes in `src/script.py`.

Style, from the user's earlier instructions:
- A caption on every spoken line, in the sans + script style (`tools/caption-style/`), word by word as it is spoken, never across a cut.
- Three words placed huge behind a figure, whose cut-out hides the middle letters (`tools/cutout.py`, `src/behind.py`).
- Sound effects from earshot, rendered from its bank and checked by its audio models: a whoosh (z +5.1 as "fast whoosh") and an impact on big and behind words, a soft tick on script words, a swell on chapter cards, a hit under each "rise" on the title.
- Art from the Cleveland Museum of Art Open Access collection (CC0), in a light painterly grade.

Rebuild: `python3 src/script.py && /root/kokoro/.venv/bin/python src/tts.py $PWD /root/kokoro && python3 src/align_whisper.py $PWD && python3 src/behind.py && node src/build.mjs`, then render with `npx -y openfilm@latest render --workers 3 --loudness=-14` and add the caption sounds with `python3 src/mix_extra.py <render>.mp4 out.wav`.

The narration is synthetic: listen before publishing.

Version 2 (after the user's notes):
- Captions in two reel styles: quiet lowercase EB Garamond beside the subject, one to three words at a time, with a Pinyon Script accent word; emphasis lines in huge red Instrument Serif capitals, narrowed to 62%, filling the frame, behind the figure where there is a cut-out.
- Faster narration (Kokoro speed 1.1, shorter pauses) and driving music: "Antihero" (Hyperreal), then "Wild Horses" (Jakubowski Epic Music) from chapter III.
- Tall works shown whole over a blurred copy of themselves, so no statue or portrait is cropped.
- Chapter cards: a Roman numeral, then the title typed letter by letter over keyboard sounds (earshot).
- All sound effects are rendered once in film.html (the separate "extra" mix is no longer used: it doubled them).

Version 3 (after the user's notes):
- Every picture cropped to exactly 16:9 (src/crop169.py: the figure is found with Robust Video Matting and the crop keeps the head; four crops set by hand), shown with a gentle push (at most 6%) and no cut to a detail.
- Every caption in the middle of the frame.
- Calm solo-piano music: "New Hope Instrumental" (Jim Gaven), then "At The Edge Of Hope" (Hillaby) from chapter III.
- The redo also lives in invideo (project "Rise Above the Ordinary (redo)"), uploaded and laid on a timeline with free commands only.
