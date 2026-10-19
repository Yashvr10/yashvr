# wall: A 3D wall of tiles; a wave turns the tiles behind the text, whose backs read the line; slow pull back.
From: explainer s05_crisis. Call `await prepare(params, tokens)` once, then `tpl(ctx, t, dur, params, tokens)`.
| param | type | required (default) | notes |
|---|---|---|---|
| `text` | string | yes | up to 6 words, two rows at most |
Timing: the wave 0.45–1.87 s, then holdFor. Typical dur 3.8–4.4 s.
Job scene: `{ "tpl": "wall", "dur": s, "tr"?: "cut"|"dip"|…, ...params }`; the player checks params and holds.
Still: `stills/wall.png`, from the job `stills/jobs/wall.json`.
All copy and numbers come from params; colours, type and motion from the tokens (any look).
3D and 2D alike draw into the 2D layer, so every transition carries them.
