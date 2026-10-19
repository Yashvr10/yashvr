# stat: One number rolls up on the odometer; a rule, a label and an optional source rise in. Numbers must be true.
From: new (engine/type.js odometer). Call `await prepare(params, tokens)` once, then `tpl(ctx, t, dur, params, tokens)`.
| param | type | required (default) | notes |
|---|---|---|---|
| `value`, `from` | int | value yes; from no (0) | rolls from → value; digits only, no separators |
| `prefix`, `suffix` | string | no ('') | e.g. "$", " billion" |
| `label` | string | yes | what it counts, 1–6 words |
| `source` | string | no ('') | "Source: …" |
Timing: roll 0.15–1.15 s, label 0.7 s, source 1.0 s. Typical dur 3.8 s.
Job scene: `{ "tpl": "stat", "dur": s, "tr"?: "cut"|"dip"|…, ...params }`; the player checks params and holds.
