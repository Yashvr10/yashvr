# STYLE.md: Vox-style Mixed Media collage (this video)

The look from the brief (`vox-motion-graphics` skill, Mixed Media house style), rebuilt in code:
a motion-designed magazine spread, never a filmed scene. Every value lives in `tokens.js`.

## Palette and contrast
| Token | Hex | Use |
|---|---|---|
| yellow | #F5C842 | field (s01), marker fill under ink text |
| paper | #F2EDE3 | field (s02, s04), text on navy |
| navy | #1D2B4F | field (s03) |
| coral | #EE6352 | marks only: marker loops, underlines, accents. Never text, never a text background |
| ink | #141414 | text on yellow / paper / white, QR modules |
| white | #FFFFFF | cutout borders, QR tile ground, paper strips under text |
| dim | #5E5A52 | thin rules and diagram lines only. Never text |

Text pairs (WCAG, measured): ink on yellow 11.6, ink on paper 15.8, ink on white 18.4, paper on
navy 11.9, white on navy 13.9. Every caption must stay at 7:1 or above (`sheet.mjs` prints it).
`fields.<name>` pairs each field with its text colour. One dominant field per scene.

## Type
Anton for everything loud (captions, numbers, questions), Inter Tight 700 caps for small labels,
Inter for the source line. Sizes come from cap heights in % of the 16:9 frame (`sizes.giant` to
`sizes.small`); 9:16 type is 90% of that. No more than about 6 words on screen at once.

## Pieces
Paper cutouts with a 14 px white border and one soft drop shadow (`collage.cutout`), torn paper
strips (`tornRect`), tape, halftone dots, hand-drawn coral marker loops and underlines, and the QR
tile (`collage.qrTile`, seed `collage.tile.seed`): the one object that runs through every scene.
Decorative, never scannable. No photos, logos or real UI.

## Texture
Paper texture (mottle and fibre) is multiplied over every layer by post (`post.paper = 1`), so
fields and cutouts read as printed. Light vignette (0.12), grain (0.012). No bloom, no chromatic
aberration, no tone mapping.

## Motion
Snappy: entrances 0.3–0.6 s easing out (`outExpo`; pops use `outBack(u, motion.overshoot)`),
exits 0.15–0.3 s, transitions 0.1–0.3 s, holds at least `hold` (1.2 s) and as long as
`holdFor(text)`. One loud thing at a time. An impact (a landing, a slam, a punch) about every 2–3 s.
The camera always drifts and pushes (`defaultPush`); impacts `punch` it.
