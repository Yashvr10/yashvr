# Why Believing in Yourself Feels So Lonely: notes

- Requested (27 Nov): a 25-minute film on a script like Verse Creates' "You're running out of time (and don't know it)"
  (https://youtu.be/bwfkaEe40C0). The user pasted its transcript: self-belief seen through Jung's persona, shadow and
  individuation. They chose "keep your script, same style": the narration (`src/narration.txt`) is an ORIGINAL script on
  the same theme, in seven chapters, with short attributed Jung epigraphs. It does not reuse that video's text.
- Style: identical to Carl Jung: The Light in the Darkness (captions, grain, rounded old-TV frame, chapter cards). The
  reference video's own caption style was not copied, because the user asked for everything as before.
- Music: the user reported copyright claims on the earlier background tracks, so this film uses five Kevin MacLeod
  tracks (incompetech.com, CC BY 4.0, not in Content ID): Dreamer, Ossuary 6 - Air, Healing, Lightless Dawn and
  Bittersweet. All are loudness-matched to -19.5 LUFS before mixing. Attribution is in `description.md`.
- Voice: the user's own "My Voice", made in the VoiceStudio session (branch claude/stoic-franklin-f6px0a,
  handoff/belief-myvoice). It was pulled with a script like the Jung one and loudness-normalised. Jung is said "Yoong";
  "persona" and "individuation" are written plain. Three one-word or run-together lines were flagged as worth a listen and
  kept: s5dd573c29f "Cruelty.", sdb5566ff00 "The other sees a jury.", sb0bc318be7 "Numb people don't cause scenes."
- Length: the first build ran 27:34, so the gaps between sentences were cut (0.75 to 0.5 inside a paragraph and 1.35 to
  0.95 at the end of one, both times 1.15). It now runs 25:27.
- Pictures: 125 public-domain museum works (`src/qb.json`, `src/qb2.json`), hand-checked (`src/rejected.json`), plus 32
  `j-` pictures reused from the Jung film. Faces are never cut (`src/look.py`, `src/framing.json`); mask-c12 is shown whole
  by hand.
- `src/align_whisper.py` now takes `ONLY="id id ..."` to re-time just the clips that changed.
