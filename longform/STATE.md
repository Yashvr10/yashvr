# STATE
Film: How many people actually built the Great Pyramid?     Slug: great-pyramid-workforce
Stage: 3 (fact-check) - owner runs films/great-pyramid-workforce/factcheck-packet.md in a NEW chat and pastes the result back
Approved so far: stage 0 setup; brief; ledger (25 rows as written, 20 Oct 2026; L17 stays UNVERIFIED and unused)
Decisions: director prompt (lesson 30) in force; editable files: video.json, NOTES.md, STATE.md, films/<slug>/, assets/
  Voice kokoro af_heart 1.0; respellings lowercase only; captionStyle pill; fonts not pinned (Inter/DejaVu here)
Commands that work here:
  builds as builder: su builder -s /bin/bash -c 'cd /home/user/yashvr/longform && source .venv/bin/activate && <cmd>'
  node validate.mjs -> manifest OK (Rome film, 11 scenes)
  ffmpeg 6.1.1; whisper tiny.en (cached /home/builder/.cache/whisper); Chrome 155 via puppeteer; kokoro_onnx in .venv
  render --draft --workers 4 fastest (8.4 s for 3139 frames); final ~17 fps; chapters.mjs, scene-at.mjs installed
Previous film: how-rome-fell archived in films/how-rome-fell/ (video.json, timeline.json, .srt); out/how-rome-fell.mp4
  Open on it: ledger never fact-checked; .srt not proofread; fonts not pinned; 3 sound changes proposed, not applied
Open issues: L05-L09 rest on Wikipedia (Britannica 403); L17 UNVERIFIED (do not use); L21/L22 press-only; video.json still holds the Rome film until stage 6
