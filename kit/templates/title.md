# title: One or two lines rise in at one size while the camera pushes in; an accent rule draws out under them.
From: explainer s01_open. Call `await prepare(params, tokens)` once, then `tpl(ctx, t, dur, params, tokens)`.
| param | type | required (default) | notes |
|---|---|---|---|
| `lines` | string[] | yes | 1–2 lines, 1–6 words each |
| `rule` | bool | no (true) | the accent rule (a following map can start from it) |
Timing: lines at 0.15 and 0.55 s, rule 1.2–1.8 s; holdFor each line. Typical dur 3.0–3.4 s.
Job scene: `{ "tpl": "title", "dur": s, "tr"?: "cut"|"dip"|…, ...params }`; the player checks params and holds.
Still: `stills/title.png`, from the job `stills/jobs/title.json`.
All copy and numbers come from params; colours, type and motion from the tokens (any look).
