# map: An outline map: coast, one-tone land, an accent area, labels, dotted arcs, a caption; slow push to a focus.
From: explainer s02_map (intro) and s06_talks (intro: false). Call `await prepare(params, tokens)` once, then `tpl(ctx, t, dur, params, tokens)`.
| param | type | required (default) | notes |
|---|---|---|---|
| `geo` | string | yes | JSON { lat0, coast, area } (e.g. data/levant.json) |
| `view`, `focus` | object, lonlat | yes | { "16x9": {lon, lat, k}, "9x16": {…} }; push centre |
| `caption` | string | yes | 1–6 words, top left over the sea |
| `labels, leader, arcs, reach, intro, push` | … | no | see the param comments in map.js |
Timing (intro): coast 0.1–0.9 s, labels 0.95 s + 0.1 s each, caption 1.25 s. Typical dur 3.8–4.0 s.
Job scene: `{ "tpl": "map", "dur": s, "tr"?: "cut"|"dip"|…, ...params }`; the player checks params and holds.
