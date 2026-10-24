# longform: setup notes

The long-form kit from lessons 21–27 of the course, created from the lesson text exactly as written: 27 files.
- `scene-at.mjs` and `chapters.mjs` belong to lessons 28 and 29 and are not here.
- `engine/` is frozen from this point. A video only ever edits `video.json`.

## The six laws (lesson 21, in my words)

1. **The voice sets the length.** Each scene lasts as long as its narration plus a little air before and after. Pictures are never squeezed to fit a slot, and the voice is never sped up or cut to fit a picture.
2. **One scene is one job.** Each scene gets its own voice file, its own video file and its own cache entry. Changing one sentence redoes one scene and nothing else.
3. **Every output carries a fingerprint of its inputs.** If the fingerprint hasn't changed, the work is skipped. That's why a small edit to a long film takes seconds rather than a full render.
4. **Lengths are whole frames.** Each scene is rounded up to a whole number of frames, and its audio is padded to exactly that length. Fractions of a frame would otherwise add up into visible lip-sync drift over a long film.
5. **Pictures depend only on time.** The page never reads a clock or a random number; frame *t* always draws the same pixels. That's what makes rendering scenes in any order, in parallel and repeatably safe.
6. **Animate inside a scene, cut between scenes.** Every scene dips through the background colour at both ends, so scenes join with a plain cut. Joining with `-c copy` takes seconds; cross-fades would force re-encoding the whole film.

## Commands that work on this machine

The machine is Linux, x86-64, 4 cores, Node 22.22.0, ffmpeg 6.1.1 and Python 3.13. It runs everything as root, which matters for Chrome (see "What I had to change and why").

```bash
# one-time setup (run in longform/, as root, so downloads can reach the network proxy)
npm init -y && npm pkg set type=module && npm install puppeteer   # also downloads puppeteer's own Chrome 155
pip install --break-system-packages torch --index-url https://download.pytorch.org/whl/cpu
pip install --break-system-packages openai-whisper                # whisper, CPU only
useradd -m builder                                                 # Chrome needs a non-root user (see below)
su builder -s /bin/bash -c 'cd longform && python3 -m venv .venv'  # lesson 24's venv
.venv/bin/pip install kokoro-onnx soundfile                        # as root (see below)
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
python3 -c "import whisper; whisper.load_model('tiny.en', download_root='/home/builder/.cache/whisper')"
mkdir -p /home/builder/.cache && cp -r ~/.cache/puppeteer /home/builder/.cache/
chown -R builder longform /home/builder/.cache

# checks
node -v && ffmpeg -version | head -1 && whisper --help | head -1    # all three work
say -v '?'                                                          # "say: command not found" (Linux; macOS only)

# every build runs as builder, with the venv on PATH so tts.mjs's `python3` finds Kokoro
su builder -s /bin/bash -c 'cd longform && source .venv/bin/activate && node validate.mjs'
su builder -s /bin/bash -c 'cd longform && source .venv/bin/activate && node build.mjs --draft'
su builder -s /bin/bash -c 'cd longform && source .venv/bin/activate && node render.mjs --stills'
su builder -s /bin/bash -c 'cd longform && source .venv/bin/activate && node build.mjs'
su builder -s /bin/bash -c 'cd longform && node srt.mjs'   # 28 caption cues -> out/how-fast-is-light.srt
```

## Stills and final render (20 Oct 2026)

- **`node render.mjs --stills`** printed `stills + build/contact-sheet.jpg`. There is one layout bug, in **s002 (stat)**: the commas of `299,792,458` hang down into "METRES PER SECOND" under it. The cause is `engine/scenes/stat.js`, which places the unit at a fixed `S.H * 0.48 + 90` whatever size `fit()` chose for the number. It is **not fixed**, because `engine/` is frozen until the user says otherwise. Fixing it would re-render only s002. Everything else passes lesson 23's checklist.
- **`node build.mjs`** reused the cached voice, timings and timeline, then rendered 8 scenes (2,170 frames) at full quality in 127.4 s. That's about 6–8 fps per scene with 3 workers on 4 cores, against 51–91 fps for the draft. `mix.mjs` took 10.5 s.
- **Report:** planned 72.333 s, file 72.267 s (0.066 s apart), −14.4 LUFS, −1.3 dBTP.
- **Checks:** lesson 27's join check printed `8 h264,1920,1080,yuv420p,30/1`. The silence, black-frame and frozen-frame detectors found nothing.
- **Output:** `out/how-fast-is-light.mp4`, 1920×1080, H.264 with AAC 48 kHz, 6.6 MB.

## Library fix: stat unit overlap (branch `fix/stat-unit-overlap`, at the user's request)

`engine/scenes/stat.js` now places the unit line under how far the *final* number actually reaches below its baseline: `max(90, descent + 72)` px below it. The label follows 100 px below the unit, as before. A number without commas keeps the old layout exactly. Because the layout is measured from the final number, nothing moves while the digits count up.

- **Check:** the contact sheet shows a clear gap between the commas and "METRES PER SECOND", and the label stays above y = 860.
- **Re-render:** only s002 re-rendered (`render (final): 1 rendered, 7 cached, 308 frames in 33.8s`), as lesson 23's per-type fingerprint promises.
- **Report:** unchanged, 72.333 / 72.267 s, −14.4 LUFS, −1.3 dBTP. The join check still prints one line, `8 h264,1920,1080,yuv420p,30/1`.

## What each step printed (draft build, 20 Oct 2026)

```
$ node validate.mjs
8 scenes, 189 words, ~1.3 min of narration
manifest OK

$ node build.mjs --draft
tts: 8 spoken, 0 cached                              ✓ tts.mjs     22.4s
align: 8 aligned, 0 cached                           ✓ align.mjs   46.2s
sfx ready: hit.wav, rise.wav, tick.wav, whoosh.wav   ✓ sfx.mjs      0.3s
plan: 8 scenes, 1m 12.3s, 2170 frames                ✓ plan.mjs     1.2s
render (draft): 8 rendered, 0 cached, 2170 frames in 6.5s   (51–91 fps per scene, 3 workers)
                                                     ✓ render.mjs   7.1s
                                                     ✓ mix.mjs      9.0s
```

`build/report.json`:
```json
{
  "file": "/home/user/yashvr/longform/out/how-fast-is-light.draft.mp4",
  "planned": 72.333,
  "file_seconds": 72.267,
  "loudness_lufs": "-14.4",
  "true_peak_dbfs": "-1.3"
}
```

How this compares with the lesson's own run (72.567 s planned, 72.533 s in the file, −14.3 LUFS, −1.3 dBTP):
- **Length:** the file is 0.066 s off planned, inside the 0.1 s limit. The film is 0.2 s shorter than the lesson's, because Kokoro's voice runs at a different pace from macOS `say`.
- **Loudness:** −14.4 LUFS against the −14 target, and the true peak of −1.3 dBTP stays under −1.
- **Join check (lesson 27):** `8 h264,960,540,yuv420p,30/1`. All eight scenes are identical, so `-c copy` joins them cleanly. The lesson printed `yuvj420p`; this ffmpeg reports the JPEG input as `yuv420p`. Both are a single line, which is what matters.
- **Detectors (lesson 26):** silencedetect, blackdetect and freezedetect all returned nothing.

## What I had to change and why

**Kit code: nothing.** No `.mjs`, `.js` or `.py` file differs from the lessons. The changes were:

| What | Why |
|---|---|
| `video.json` `meta.voice`: `{ "engine": "say", "name": "Daniel", "rate": 178 }` → `{ "engine": "kokoro", "name": "af_heart", "speed": 1.0 }` | The first draft build stopped at `tts.mjs:37` with `say failed:`. `say` is macOS-only. Lesson 24's fix for "say: command not found" is Kokoro, and these are its exact example values. The user approved the change. |
| `package.json` rewritten by npm | The lesson's file lists `"puppeteer": "*"`. Step 2's `npm install puppeteer` pinned it to `"^25.14.0"`, and `npm init -y` added `version`, `description`, `main`, `keywords`, `author` and `license`. npm made these edits, not me. |
| The build runs as a non-root user, `builder` | This container runs as root, and Chrome refuses to start as root without `--no-sandbox` (`Running as root without --no-sandbox is not supported`). `render.mjs` launches it without that flag. Running as `builder` keeps Chrome's sandbox on, with no code change. The user chose this over editing `render.mjs`. |
| Downloads are done as root, outside the build | `builder` can't read the network proxy's certificate file (in `/root/.ccr/`), so `pip` and model downloads fail as `builder`. Root installs Kokoro into the venv, downloads the two model files, and pre-caches whisper's `tiny.en` for `builder`. After that the build needs no network. |
| Whisper installed on a CPU-only PyTorch | There's no GPU, and the CUDA build adds GBs of unused libraries. Whisper prints "FP16 is not supported on CPU", which is harmless. |
| `.gitignore` | `build/` and `out/` as step 5 says, plus `.venv/` and the two Kokoro model files (354 MB), which shouldn't go in git. `node_modules/` is already ignored at the repo root. |

**Other differences from the lessons, worth knowing:**
- **Fonts.** `video.json` asks for Helvetica Neue and Menlo, which Linux doesn't have. Chrome falls back to Inter for both, the system's closest match. Frames will look slightly different from the lesson's Mac stills.
- **ffmpeg filters.** This ffmpeg has `drawtext` and `subtitles`, unlike the one the course was tested on. The kit doesn't use them; it draws captions in the canvas.
- **Floating point (lesson 21).** The gotcha's example doesn't reproduce in Node 22: `7.2 * 30` is exactly `216`. The risk is real, though: `8.3 * 30 = 249.00000000000003`, which `Math.ceil` would turn into 250. The `- 1e-6` in `plan.mjs` guards against it.
- **Workers.** This machine has 4 cores, so the lesson's "one worker per three cores" rule suggests 1. `render.mjs` defaults to 3; the draft rendered 2,170 frames in 6.5 s with 3 workers. Try `--workers 2` on the final render if frames per second drop.
- **Temporary.** This cloud container is reclaimed when the session ends. The installs (whisper, Kokoro, the `builder` user, the model files) live only in the container, so re-run the setup block above in a new session.

## New scene type: `quote` (branch `feat/quote-scene`, merged)

`engine/scenes/quote.js` shows a quotation and who said it, following lesson 23's recipe and the seven scene rules. Its `need` keys in `validate.mjs` are `text` and `by`; `kicker` and `source` are optional.
- **Contact sheet:** on the first pass the opening quote mark touched the first letter. It is now right-aligned 18 px before the text. Rendered with `--stills --only s095`, because the 3×3 sheet shows only the first nine scenes.
- **Rome film re-render:** `render (final): 1 rendered, 10 cached, 262 frames in 29.8s`. Report: planned 106.233 s, file 106.166 s, −14.4 LUFS, −1.4 dBTP. All scenes print `h264,1920,1080,yuv420p,30/1`. The silence, black-frame and frozen-frame detectors found nothing. `srt.mjs` wrote 40 cues.

## Voice test and pronunciation fix (20 Oct 2026)

- **Engines:** `say` doesn't exist on Linux. Kokoro works only inside `.venv`; the system `python3` doesn't have it. I compared `af_heart`, `am_michael`, `bf_emma` and `bm_george` on three test sentences in `build/voice-test/`. `af_heart` stays the voice for this film.
- **Lesson learned:** Kokoro reads capitalised syllables as letters, so `"Oh-doh-AY-ser"` was spoken "Oh-doh-A-Y-ser". Write respellings in lowercase, with hyphens only (`"Odo-acer"`), and check them with `kokoro.tokenizer.phonemize(...)` before building.
- **Changes to `meta.pronounce`:** new values for Odoacer, Augustulus and Demandt; Adrianople and Theodosius removed (Kokoro says them correctly); Stilicho and Ravenna added.
- **Re-render:** s040, s060 and s090 were re-voiced and re-rendered (`3 rendered, 8 cached`). Report: planned 104.633 s, file 104.566 s, −14.3 LUFS, −1.4 dBTP. All 11 scenes print the same format line. The silence, black-frame and frozen-frame detectors found nothing. `srt.mjs` wrote 40 cues.

## Render budget (measured 20 Oct 2026)

Machine: Intel Xeon @ 2.10 GHz, **4 cores** (`nproc` = 4, 1 thread per core), 15 GB RAM.

**Draft benchmark.** Each run did the same work: `build/scenes-draft/` was deleted first, and all 11 scenes were rendered. That is 3,139 output frames, of which 1,572 are drawn because drafts draw every second frame. I ran two passes.

| `--workers` | Pass 1 | Pass 2 | Drawn fps (pass 1) | Output fps (pass 1) | vs 1 worker |
|---|---|---|---|---|---|
| 1 | 20.5 s | 19.2 s | 76.7 | 153 | 1.00× |
| 2 | 11.3 s | 11.2 s | 139.1 | 278 | 1.81× |
| 3 | 9.6 s | 9.4 s | 163.8 | 327 | 2.14× |
| **4** | **8.4 s** | **8.4 s** | **187.1** | **374** | **2.44×** |

- **Best worker count: 4 (`--workers 4`)**, one worker per core.
- Gains shrink after 2 workers: going 1→2 saves 45%, 2→3 saves 15%, and 3→4 saves 12.5%. More than 4 workers would put more work than cores on the CPU, so I didn't test it.

**Full quality, measured.** `node render.mjs --only s100` rendered 235 frames in 26.9 s, which is **8.7 fps for a single worker**. The earlier whole-film final render ran 3 workers together and reached **17.0 fps** combined (2,170 frames in 127.4 s).
- Draft at 4 workers is about 374 output fps, roughly **22× faster** than final with workers in parallel.
- Before measuring, I had assumed a draft-to-final factor of **20×**. That predicted 16.1 min for a 10-minute film.

**Expected render time, full quality, 30 fps.** Rendering the scenes only; voice, alignment and the mix come on top.

| Film length | Frames | With workers in parallel (17.0 fps) | Single worker (8.7 fps) | Draft, 4 workers (374 fps) |
|---|---|---|---|---|
| 5 min | 9,000 | ~9 min | ~17 min | ~24 s |
| 10 min | 18,000 | ~18 min | ~34 min | ~48 s |
| 30 min | 54,000 | ~53 min | ~1 h 43 min | ~2.4 min |

The "in parallel" column uses the 3-worker final-render rate. A 4-worker final render hasn't been measured: x264 also uses several threads per encoder, so the workers compete for the same 4 cores. Re-measure the next time a whole film is rendered at full quality.

**Format check (lesson 27).** `build/scenes/` held 19 files, all `h264,1920,1080,yuv420p,30/1`. `build/scenes-draft/` held 11, all `h264,960,540,yuv420p,30/1`. Each folder has a single format, so the files join cleanly.

## Maps as image scenes (great-pyramid-workforce, 20 Oct 2026)
- The long-form engine has no `map` scene type. Maps are drawn by `films/<slug>/maps.py` (SVG from Natural Earth, public domain), rasterised by puppeteer's Chrome (`make-maps.sh`) into `assets/maps/*.png`, and shown with the existing `image` scene. No engine change.
- Keep every map label inside x 260-1690, y 170-640: the image scene zooms to 1.12x, drifts 40 px left and puts its own label at y = 780.
- **Cache gap (library task, not fixed):** `sceneKey` hashes the scene's data, including the image *path*, but not the image *file*. Re-drawing a PNG under the same name will NOT re-render its scene. Until the engine hashes image bytes, change the file name (e.g. `map-tura-v2.png`) when a map changes.
- Final render at `--workers 4`: 6,243 frames in 341.2 s = 18.3 fps (vs 17.0 fps measured with 3 workers).
- **4 workers can time out on a long final render.** At `--workers 4`, the final render of the 35-scene film stopped at `render.mjs:52` with `TimeoutError: Waiting failed: 60000ms exceeded`. A new scene page took more than 60 s to load because 4 PNG-encoding workers saturated the 4 cores (the first scene ran at 6 fps). Re-ran with `--workers 3`. Use 3 workers for final renders on this machine; 4 is fine for drafts.
- **Playback-safe master.** The owner reported the 7:38 film playing "at 3x" in their player. The file measured correct: 13,740 frames 512/15360 s apart, 30 fps, video and audio both 458 s, and the content at 1:00, 3:20 and 6:40 matches the plan and captions. It is, however, 35 separately encoded clips joined with `-c copy`, which some in-app and phone players handle badly. I made a one-pass re-encode for delivery: `ffmpeg -i out/<slug>.mp4 -map 0:v -map 0:a -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p -r 30 -fps_mode cfr -g 60 -keyint_min 60 -sc_threshold 0 -profile:v high -level 4.1 -video_track_timescale 30000 -c:a copy -movflags +faststart out/<slug>.single.mp4`. Result: one continuous stream, constant 30 fps, a keyframe every 2 s, the same audio. **The owner confirmed it plays correctly. Make this the delivery file for every film.**
- **2 workers work for finals.** how-the-us-captured-maduro (36 scenes): `node build.mjs --workers 2` rendered 14,360 frames in 1026.9 s (14 fps) with no timeout. Use 2 for final renders on this machine.
- **The vox skill on this machine.** Its Higgsfield tools aren't available here, so its method runs on our engine: a question hook answered last, one through-line object (here the mission clock), real licensed photos plus drawn maps as image scenes, and an accent colour change in `style`. Download photos from Wikimedia Commons slowly: it answers HTTP 429 to bursts. kremlin.ru serves CC BY 4.0 originals directly.
