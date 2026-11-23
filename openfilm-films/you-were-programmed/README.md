# You Were Programmed: How Your Subconscious Was Written, and How to Rewrite It

16:9, 22:02, rendered with OpenFilm in the look of Becoming and The Battle of Thoughts.

- Script: the user's own script (`src/script-original.txt`), narrated word for word except "this article" -> "this video". Its 14 headings are chapter cards (I-XIV). `src/script.py` splits it into 141 sentences and picks picture themes and the key word shown in script by rules.
- Clips: the user asked for clips from getyarn.io matched to lines of the script. getyarn.io blocks this machine (Cloudflare "you have been blocked"), so no clips were fetched; the film uses paintings only. Clips the user downloads and sends can be cut in later. Note: Yarn clips are excerpts of copyrighted films and TV, likely to draw Content ID claims.
- Voice: free Kokoro "Lewis older" (bm_lewis, speed 0.84, pitched down 7%), word times from Whisper.
- Pictures: public-domain (CC0) works from the Cleveland Museum of Art and the Art Institute of Chicago (`src/museums.py`), hand-picked (nudes, objects and off-topic religious scenes removed), plus non-religious pictures reused from The Battle of Thoughts (keys `b-...`); 196 in `src/images.json`, 154 used.
- Film: `src/build.mjs` -> `film.html` + `captions.html` (long chapter titles wrap in a narrower column). Music: four CC BY tracks, crossfaded.
- Deliverables: `video/You-Were-Programmed.mp4` (720p), `thumbnail.jpg`, `description.md` (title, description, chapters, tags, credits).
