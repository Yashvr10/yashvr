# STATE
Film: How many people actually built the Great Pyramid?     Slug: great-pyramid-workforce
Stage: 11 (QA) done for v2 (7:38, 35 scenes) - waiting for the OWNER to watch it, pick the title and upload. Owner said: finish without asking.
Approved so far:
  stage 0 setup (owner); brief (owner, films/great-pyramid-workforce/brief.md); ledger v1 25 rows (owner)
  stage 3 fact-check: fresh helper agent, packet only -> 20 confirmed, L25 wrong source, L17 cannot check; resolved in ledger.md v2 + L26, L27 [delegated]
  stage 4 outline (films/.../outline.md) [delegated]; stage 5 script, 18 scenes, 522 words (films/.../script.md) [delegated]
  stage 6 manifest: node validate.mjs -> "18 scenes, 522 words, ~3.5 min of narration" / manifest OK
Decisions:
  Film runs ~4 min against the brief's 6-8 min: the ledger does not support more without padding (director rule) [delegated]
  meta.pronounce: Diodorus=Dye-uh-dorus, Hawass=Ha-wass, Tura=Toora, Merer=Meh-rer (checked with kokoro phonemize) [delegated]
  meta.musicGain 0.8 (audit: the bed sat ~22 LU under the voice at 0.55) [delegated]
  style.sans "Inter, sans-serif", style.mono "'DejaVu Sans Mono', monospace": open-licence fonts, the ones this machine already used [delegated]
  sfx: 4 whooshes (0.35-0.4) + 1 hit (0.5, at 0.1 s, before the voice); no effect above 0.6
  Rome film archived in films/how-rome-fell/ (video.json, timeline.json, srt)
Commands that work here:
  su builder -s /bin/bash -c 'cd /home/user/yashvr/longform && source .venv/bin/activate && <cmd>'
  validate / tts / align / sfx / plan / render --stills / build --draft --workers 4 / build; chapters.mjs; scene-at.mjs
  stage 7 stills: 3 fixes in video.json (s070 timeline end labels <=320 px; s100 flow subs; s140 bar values plain) -> sheets clean [delegated]
  stage 8 draft: plan 18 scenes, 3m 28.1s, 6243 frames; render (draft) 18 rendered in 19.0s; report 208.1/208.1 s, -14.2 LUFS, -1.1 dBTP;
    silence/black/freeze 0/0/0; whisper hears names as intended; bed 18.6 LU under voice. Approved, no changes [delegated]
  owner request mid-run: "include maps as frequently as possible" -> 3 map image scenes (s020 Egypt, s080 Giza plateau, s120 Tura-Giza) replacing title/stat/flow
    pictures; narration unchanged; ledger L29-L36; maps.py + make-maps.sh in films/great-pyramid-workforce/; Natural Earth public domain
    Maps only where the narration is about a place; the other 15 scenes are numbers, quotes or lists with no geography to show [delegated]
  draft after maps: render (draft) 3 rendered, 15 cached; report 208.1/208.1 s, -14.2 LUFS, -1.1 dBTP
  stage 9 final: render (final) 3 rendered, 15 cached; report planned 208.1 / file 208.1 s, -14.2 LUFS, -1.1 dBTP -> out/great-pyramid-workforce.mp4 (20.0 MB)
  stage 10 package: srt 84 cues; chapters 6 (exit 0); thumbnail films/.../thumbnail.jpg (s150 still); title #2 chosen [delegated] (package.md)
  stage 11 QA: films/.../qa.md, all rows pass; silence/black/freeze 0/0/0; 18 identical scene formats [delegated sign-off]
  Archived in films/great-pyramid-workforce/: srt, timeline.json, chapters.txt, contact sheets, maps.py, make-maps.sh
For the owner to decide: final title; a true "NOT 100,000" cover scene; upload (nothing was uploaded)
  v2 (owner: "make it about 8 min", then "complete without asking"): +17 scenes from new sourced beats (ledger L37-L60), 4th map (Aswan),
    plan 35 scenes 7m 38.1s; final render: --workers 4 and 3 both hit render.mjs:52 READY timeout (60 s) -> --workers 1:
    21 rendered, 14 cached, 8559 frames in 936.6 s; report 458.133 / 458.066 s, -14.1 LUFS, -1.3 dBTP; QA all pass (qa.md)
  owner: "running at 3x" -> file timing measured correct; delivered out/great-pyramid-workforce.single.mp4 (one-pass re-encode, CFR 30, timescale 30000, GOP 60) - awaiting owner's confirmation in their player
Open issues: final renders on this machine time out at 3-4 workers (READY > 60 s); use --workers 1-2 until the cause is found
  image files are not part of the scene fingerprint (NOTES.md); rename a map file when redrawing it
