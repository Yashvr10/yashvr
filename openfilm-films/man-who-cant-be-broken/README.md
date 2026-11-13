# The Man Who Can't Be Broken

A 15:03 essay film on resilience, made with OpenFilm. It follows the arc and core idea of a reference video ("The Unbreakable Man"): unbreakable doesn't mean unhurt; a failure is an event, not an identity; walls are not strength; confidence is built from evidence; bend instead of snapping; build from what remains; do the next thing. The script is new, and it tells different stories: Horatius at the bridge (Livy), Lincoln's 1841 letter and 1858 defeat, Roosevelt's "Man in the Arena", Odysseus's "Endure, my heart", Aesop's Oak and the Reeds, Defoe and Robinson Crusoe's account book, and Marcus Aurelius's promontory.

- `src/scenes.json`: the script, scene by scene, with the picture for each scene
- `src/quotes.json`: every quotation, with the text around it from the Gutenberg edition it came from
- `src/build.mjs`: builds `film.html` from the scenes, the narration and the Whisper word timings
- `src/tts.py`: Kokoro narration (voice bm_george, speed 0.86)
- `src/align_whisper.py`: word timing used to sync the captions and the quote highlights
- `thumbnail.html` → `thumbnail.jpg` (1280×720)
- `description.md`: the YouTube title, description, chapters and tags

Rebuild: `/root/kokoro/.venv/bin/python src/tts.py $PWD /root/kokoro && python3 src/align_whisper.py $PWD && node src/build.mjs`, then `npx -y openfilm@latest render --workers 3 --loudness=-14`.

Notes and caveats:
- Every quotation was checked word for word against its Gutenberg text. The Livy quote leaves out one "and", as the narration does.
- Defoe's biography is told in round terms: bankrupt in his early thirties (1692), pilloried in 1703 for a pamphlet, Robinson Crusoe in 1719 when he was about 59.
- The Rowlandson print shows the pillory at Charing Cross in 1809. It illustrates the punishment; it is not Defoe.
- The Horatius story is legend as much as history, and the film says "the story goes".
- The paintings are public domain (Met and AIC CC0). The music is CC BY 3.0 and needs the credit in `description.md`.
- The narration is synthetic. Listen to the mix before publishing.
