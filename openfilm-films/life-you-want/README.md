# How to Build Monk Focus

A 15:06 essay film on concentration, made with OpenFilm. It follows the idea of a reference script (attention is being stolen; take it back through a numbered set of practices), rewritten around monastic practice: the noonday demon, one arrow, the cell, the bell, the kitchen, the weather, the return.

It is the first film to use the caption style in `tools/caption-style/`: heavy lowercase sans with one script word per stack, placed in the empty side of the picture, each word appearing as it is spoken and the stack clearing on the cut. Quotations use the small centred subtitle mode with the source underneath.

- `src/script.py`: the script, the painting for each scene and its captions; writes `src/scenes.json`
  - caption marks: ` / ` new line, `~word~` script font, `^word^` big, `_word_` small; `pos` is l, r, tl, tr, bl, br or c
  - `sub` starts word-by-word subtitles at that word of the narration; `cite` is the source line
- `src/pages/captions.html`: the caption layer, one page for the whole film
- `src/build.mjs`: builds `film.html` and `captions.html` from the scenes, the narration and the Whisper word timings
- `src/tts.py`, `src/align_whisper.py`: narration (Kokoro, bm_george, speed 0.86) and word timing

Rebuild: `python3 src/script.py && /root/kokoro/.venv/bin/python src/tts.py $PWD /root/kokoro && python3 src/align_whisper.py $PWD && node src/build.mjs`, then `npx -y openfilm@latest render --workers 3 --loudness=-14`.

Notes:
- Every quotation was checked word for word against its Gutenberg text.
- The swish under the biggest words and the chapter cards is filtered noise made with ffmpeg, because the sound library's download host was blocked. Bells are a real recording.
- Every spoken word gets a caption. Hand-written stacks (`stack`) cover the key phrases; every other phrase is captioned automatically, at most five words, with its last strong word as the accent (script or big sans, in turn).
- Nine big words sit behind a figure (`behind="word"`). `tools/cutout.py` cuts the figure out of the painting (Robust Video Matting); `src/behind.py` places the word so the head hides its middle letters; the cut-out is laid over the word. Line captions move to the bottom of the frame while it shows.
- The narration is synthetic. Listen to the mix before publishing.
