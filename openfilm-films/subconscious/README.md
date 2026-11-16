# Your Mind Is Not On Your Side

A 4:17 film made with OpenFilm from the user's self-hypnosis script (narrated word for word; "on my Substack" became "on this channel", "these letters" became "these lessons", and a typo was fixed). Style rules in `style.md`.

- Voice (v2, after the user's note that v1 was too fast): Kokoro bm_george at speed 1.1 with natural pauses, 0.5 s between sentences: about 157 words a minute. Opens on black with the heading INVISIBLE / FORCE.
- Pictures: 219 CC0 works from the Cleveland Museum of Art, cropped to 16:9 with the figure's head kept (`src/crop169.py`), graded almost black and white. A cut every 1.3–1.9 s on a word start, 2–3-frame bursts at three moments, a 2-frame negative or a flat grey/white rectangle at many cuts.
- Grey paper cards for questions, and grid collages where pictures pop in one per beat around the caption.
- Captions: Inter Tight, sentence case, words spread across one centred line, each popping on as spoken (black on the grey cards).
- Emphasis words: huge white Bebas Neue on black, one at a time. Chapters: small white Bebas word in front of a huge red one, letters fading in at random.
- Music: "capsule hotel love" by Bod (CC BY-SA 3.0), about 60 bpm (v1 used a faster techno track). Sounds from earshot's bank.

Rebuild: `python3 src/script.py && /root/kokoro/.venv/bin/python src/tts.py $PWD /root/kokoro && python3 src/align_whisper.py $PWD && python3 src/fetch.py 4 && python3 src/crop169.py && node src/build.mjs`, then `npx -y openfilm@latest render --workers 3 --loudness=-14`.
