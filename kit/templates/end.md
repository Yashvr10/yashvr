# end: End card: the title fades up, a short accent rule draws, an optional small line rises in; then it holds.
From: explainer s08_end. Call `await prepare(params, tokens)` once, then `tpl(ctx, t, dur, params, tokens)`.
| param | type | required (default) | notes |
|---|---|---|---|
| `title` | string | yes | 1–4 words, one row |
| `line` | string | no ('') | sources, a name or a URL |
Timing: title 0.2–0.6 s, rule 0.45–0.95 s, line 0.5 s. Typical dur 3.0–3.4 s.
Job scene: `{ "tpl": "end", "dur": s, "tr"?: "cut"|"dip"|…, ...params }`; the player checks params and holds.
Still: `stills/end.png`, from the job `stills/jobs/end.json`.
All copy and numbers come from params; colours, type and motion from the tokens (any look).
