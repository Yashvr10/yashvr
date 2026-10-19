# quote: A line with an accent rule drawing slowly under it; an optional attribution under the rule.
From: explainer s07_now (+ attribution). Call `await prepare(params, tokens)` once, then `tpl(ctx, t, dur, params, tokens)`.
| param | type | required (default) | notes |
|---|---|---|---|
| `text` | string | yes | the line or quotation (include quote marks) |
| `attribution` | string | no ('') | e.g. "— Name, role" |
Timing: text at 0.1 s, attribution 0.9 s, rule 0.8–3.2 s (linear, still drawing at 3 s). Typical dur 3.0–3.4 s.
Job scene: `{ "tpl": "quote", "dur": s, "tr"?: "cut"|"dip"|…, ...params }`; the player checks params and holds.
Still: `stills/quote.png`, from the job `stills/jobs/quote.json`.
All copy and numbers come from params; colours, type and motion from the tokens (any look).
