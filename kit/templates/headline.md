# headline: A headline and an optional smaller line under it, centred, with a very slow push.
From: explainer s03_response. Call `await prepare(params, tokens)` once, then `tpl(ctx, t, dur, params, tokens)`.
| param | type | required (default) | notes |
|---|---|---|---|
| `head` | string | yes | 1–6 words |
| `sub` | string | no ('') | 1–6 words at ≤76% of the head's size |
Timing: head at 0.1 s, sub at 0.5 s; holdFor each. Typical dur 3.4 s.
Job scene: `{ "tpl": "headline", "dur": s, "tr"?: "cut"|"dip"|…, ...params }`; the player checks params and holds.
Still: `stills/headline.png`, from the job `stills/jobs/headline.json`.
All copy and numbers come from params; colours, type and motion from the tokens (any look).
