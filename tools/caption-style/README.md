# Caption style: "sans + script" kinetic captions

Taken from the reference "This Video Will Find You When You Need It" (2:54, about 130 cuts). Use this for the next video.

## Fonts
| Role | Reference look | Open font used here |
|---|---|---|
| Main words | Heavy grotesque sans (Helvetica Neue Heavy style), lowercase, very tight tracking | `fonts/InterTight.ttf` at weight 900, letter-spacing -0.045em |
| Accent word | Tall, narrow copperplate script with a swash capital I | `fonts/HerrVonMuellerhoff.ttf`, about 1.75× the sans size, squeezed to 80% width, with a 0.6px white stroke to match the reference's weight |
| Subtitles | The same sans, small, weight 700 | Inter Tight 700 |

Both fonts are SIL Open Font License.

## Rules
1. **Two modes.** Talking-head and interview shots get a small, single-line subtitle, centred at about 55–60% of the frame height, that builds word by word. B-roll and highlight shots get the big mixed-font stack.
2. **One script word per stack, at most two.** The script goes on the soft or emotional word: "came", "city", "you", "champion", "wins". The sans carries the hard words: "back", "today", "world title".
3. **Stack shape.** 2–3 short lines, line-height about 0.8, each line indented a little differently so the block steps diagonally. The script word tucks under or overlaps the sans word next to it.
4. **Size ladder.** Lead-in words about 5% of frame height, normal words 9–11%, punch word 14–16%, hero word 25–30% (edge to edge).
5. **Placement.** In the empty side of the frame, at about the subject's eye or chest height, never on the bottom line. A long phrase splits into two blocks in opposite corners (top-left then bottom-right), and the eye crosses the subject between them.
6. **Timing.** Each word pops on the frame it is spoken (no slide, no fade longer than 2 frames). The stack holds until the cut and never crosses it.
7. **Hero words go behind the subject.** One word, huge, with the subject cut out on top so the head hides 1–2 middle letters ("Cle▮eland", "wi▮ning"). Use `tools/matte.py` for the cut-out.
8. **Finish.** White text only, with a soft white glow (about 14px, 35% opacity) and no outline or box. Black cards with one line of white sans for a hard stop.
