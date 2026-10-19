# Template kit

The explainer's engine, its scenes turned into parameterised templates, three looks, and a player
that renders a JSON job. Run everything from `kit/`. In this container, set
`CHROME_PATH=/opt/pw-browsers/chromium-1194/chrome-linux/chrome` first.

## Layout
| path | what |
|---|---|
| `engine/`, `shaders/` | the explainer's engine, byte-for-byte (plus `engine/three3d.js`, restored for 3D) |
| `tokens.js` | the dispatcher: loads `tokens/<look>.js` (the job's `tokens`, or `?tokens=`) and re-exports it |
| `tokens/night-amber.js` | the explainer's tokens with the same values (aspect from the job; three keys added for templates) |
| `tokens/paper-red.js`, `tokens/chrome-blue.js` | the two alternate looks, with the same 29 keys (`node qa/keys.mjs`) |
| `templates/<tpl>.js`, `<tpl>.md` | title, headline, quote, stat, map, cards, wall, end: `tpl(ctx, t, dur, params, tokens)`, each with a 10-line README |
| `stills/` | one still per template, and `title_looks.png` (title in the three looks) |
| `player.html` | `player.html?job=jobs/<name>.json`: builds the timeline from the job, validates it, renders |
| `jobs/` | example jobs; `batch.sh` renders every one |
| `data/levant.json` | coastline and area data for the map template |
| `qa/` | parity, validate, stills, keys and capheights scripts |

## A job
```json
{ "tokens": "paper-red", "aspect": "16x9",
  "scenes": [
    { "tpl": "title", "dur": 3.4, "lines": ["India's phone payments", "run on UPI."] },
    { "tpl": "stat", "dur": 3.8, "value": 20, "suffix": " billion", "label": "UPI payments in August 2025" },
    { "tpl": "end", "dur": 3.0, "tr": "dip", "title": "UPI", "line": "Source: NPCI" } ] }
```
- Scenes play back to back. `dur` is rounded to whole frames.
- Each cut gets a whip (0.2 s). A scene's `"tr"` changes the cut into it: `cut` (hard), `dip`, `zoomThrough`, `matchCut` (after a title: the rule becomes the map's coast), `flash` or `glitch`. `"trDur"` sets its length.
- All copy and numbers come from params. **Every number in a job must be true.**

## Validation
The player refuses a job before drawing anything, and puts the error on the page and the console. `render.mjs` stops on it at once. It refuses:
- unknown `tokens`, aspect, `tpl` or `tr`;
- a missing, unknown or mistyped param;
- a caption whose hold (holdFor of its copy) doesn't fit before its scene is covered. The message gives the minimum `dur`.

Check jobs without rendering with `node qa/validate.mjs jobs/*.json`.

## Commands
- `./batch.sh [jobs/x.json …]`: renders and encodes every job to `out/<name>.mp4`, and skips jobs whose MP4 exists. Env: `WORKERS=3`, `SS=1|2`, `KEEP_FRAMES=1`. Per-job times go to `out/batch.log`.
- `node render.mjs video --job jobs/x.json --workers 3 --out frames_x`: render one job's frames.
- `./encode.sh final1080 --job jobs/x.json --aspect 16x9 --in frames_x --out out/x.mp4`: encode them.
- `node qa/parity.mjs`: each explainer scene against its template, three frames each, both aspects. The PNGs must be byte-identical.
- `node qa/stills.mjs`, `node qa/keys.mjs`, `node qa/validate.mjs <jobs>`.

## Templates and where they came from
| template | from | 3D |
|---|---|---|
| title | s01_open | |
| headline | s03_response | |
| quote | s07_now, plus an optional attribution | |
| stat | new: the engine's odometer | |
| map | s02_map (`intro: true`) and s06_talks (`intro: false`) | |
| cards | s04_cost | yes |
| wall | s05_crisis | yes |
| end | s08_end | |
