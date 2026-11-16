# Your Mind Is Not On Your Side

A 3:16 film made with OpenFilm from the user's self-hypnosis script (narrated word for word; "on my Substack" became "on this channel", "these letters" became "these lessons", and a typo was fixed). Style rules in `style.md`.

- Voice: Kokoro bm_george at speed 1.33, internal pauses shortened, 0.15 s between sentences: about 206 words a minute (the reference reel: 212).
- Pictures: 219 CC0 works from the Cleveland Museum of Art, cropped to 16:9 with the figure's head kept (`src/crop169.py`), graded almost black and white. A cut every 1.0–1.5 s on a word start, 2–3-frame bursts at three moments, a 2-frame negative or a flat grey/white rectangle at many cuts.
- Grey paper cards for questions, and grid collages where pictures pop in one per beat around the caption.
- Captions: Inter Tight, sentence case, words spread across one centred line, each popping on as spoken (black on the grey cards).
- Emphasis words: huge white Bebas Neue on black, one at a time. Chapters: small white Bebas word in front of a huge red one, letters fading in at random.
- Music: "Electron Wake [techno]" by Hardcore Scm (CC BY 3.0). Sounds from earshot's bank.

Rebuild: `python3 src/script.py && /root/kokoro/.venv/bin/python src/tts.py $PWD /root/kokoro && python3 src/align_whisper.py $PWD && python3 src/fetch.py 4 && python3 src/crop169.py && node src/build.mjs`, then `npx -y openfilm@latest render --workers 3 --loudness=-14`.
