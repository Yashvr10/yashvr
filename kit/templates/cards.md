# cards: Up to three 3D cards come forward one at a time and turn face-on; side by side in 16:9, stacked in 9:16.
From: explainer s04_cost. Call `await prepare(params, tokens)` once, then `tpl(ctx, t, dur, params, tokens)`.
| param | type | required (default) | notes |
|---|---|---|---|
| `cards` | string[] | yes | 1–3 lines, 1–3 words each |
Timing: cards at 0.15, 0.75, 1.35 s, face-on 0.6 s later; holdFor each. Typical dur 3.6–4.6 s.
Job scene: `{ "tpl": "cards", "dur": s, "tr"?: "cut"|"dip"|…, ...params }`; the player checks params and holds.
Still: `stills/cards.png`, from the job `stills/jobs/cards.json`.
All copy and numbers come from params; colours, type and motion from the tokens (any look).
3D and 2D alike draw into the 2D layer, so every transition carries them.
