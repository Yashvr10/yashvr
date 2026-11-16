# Next video: caption style (from the user's reference clip "Video-43179.mov", 2026-11-16)

Black frame, one word at a time, each word cut in on the frame it is spoken (no fades, no slides), centred.

1. **Quiet lines (the build-up):** dark red (#a5090c), a tall, very narrow light sans in capitals, very widely letter-spaced (about 0.4 em), small (about 9% of frame height), in the upper third. One word on screen at a time.
   Font: Six Caps or Antonio ExtraLight (OFL), spaced.
2. **Emphasis words: large.** White, bold condensed sans in capitals (Bebas Neue, OFL), about 15–20% of frame height, one word at a time, replacing the last ("DON'T", "FORGET", "YOUR", "PLACE"). The word holds a beat after it is spoken.
3. **Chapter change ("FOOLISH PUPPET" card):** a small white Bebas Neue word ("FOOLISH") sits alone in the centre for about a second; then the next word slams in huge in bright red (#e1050a) Bebas Neue ("PUPPET", about 25% of frame height), behind the small white word, which stays on top. Two-word chapter titles: first word small and white, second word huge and red.

Fonts are in tools/caption-style/fonts: BebasNeue.ttf, SixCaps.ttf, Antonio.ttf.

## Chapter-card animation (from the user's reference clip "Video-54466.mov", "rishot4rx.")

Only for chapter changes, never for the normal captions.

- The title's letters do not appear left to right. Each letter fades in on its own, in a scattered random order: a few letters show first at low opacity, others join, and each one brightens to full over a few frames.
- The whole word resolves in about 1.2 s (about 30 frames at 25 fps); the first letters start dim (roughly 30-40%) and reach full red while later letters are still fading in. No movement, no scale, no blur: opacity only, per letter.
- In the reference the word is lowercase, a rounded geometric sans in bold (Poppins or Montserrat style), red (#d90c14), ending with a full stop ("rishot4rx."), laid over the picture in front of the subject.
- Combined with the chapter layout above: the small white word and the huge red word each assemble with this per-letter random fade-in (the white word first, then the red word).
