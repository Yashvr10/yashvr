# STATE
Film: How the US captured Venezuela's president (Operation Absolute Resolve)     Slug: how-the-us-captured-maduro
Stage: 9 (final render) running. Owner asked for an 8-min video "using the vox skill", with images, focused on US operational strategy; run hands-off (skill's operating mode + owner's earlier "complete without asking").
Approved so far (Claude, delegated): brief, ledger V01-V43 (films/how-the-us-captured-maduro/ledger.md), script (script.md), manifest, stills, draft
Decisions:
  vox skill (Higgsfield MCP) not available here -> its method runs on our engine, as in the earlier 10-second film: question hook answered last, through-line = mission clock (22:46 -> 01:01 -> 03:29 ET), impacts/scene changes every few seconds, real photos + maps, Vox-yellow accent (#f2c94c)
  Primary source: Gen. Caine's 3 Jan 2026 briefing (transcript); anonymous-source claims and Trump's claims attributed on screen
  Images: 5 photos with recorded licences (US Navy/Army public domain, CC0, CC BY 4.0 Kremlin press service - credited on screen) + 3 maps from Natural Earth; NOT used: White House custody photo, agency photos, satellite images
  pronounce: Maduro=Madooro, Higuerote=Eega-roteh, Cilia=Seelia; musicGain 0.8; hits lowered to gain 0.3 (true peak was -0.7 dBTP)
  draft: plan 36 scenes, 7m 58.7s, 14360 frames; report 478.667/478.633 s, -14.1 LUFS, -1.3 dBTP; silence/black/freeze 0/0/0; 10 chapters pass
Previous films: films/great-pyramid-workforce/ (video.json, timeline, srt, package) - delivered; films/how-rome-fell/
Commands that work here: builds as builder; drafts --workers 4; finals --workers 1-2 (3-4 time out at render.mjs:52); deliver out/<slug>.single.mp4 (one-pass re-encode)
Open issues: image files are not in the scene fingerprint - rename a picture when it changes (map-caracas -> map-caracas-v2)
