# QA: pre-flight checklist (lesson 28), out/great-pyramid-workforce.mp4, 20 Oct 2026
Signed off by Claude under the owner's delegation; the owner should re-check "Facts" and "The ending" personally.

| check | how | result |
|---|---|---|
| Structure | node validate.mjs | "18 scenes, 522 words, ~3.5 min of narration" / manifest OK |
| Layout | node render.mjs --stills, both contact sheets read | clean after 3 fixes (s070, s100, s140) and map re-layout (s020, s080, s120) |
| Facts | every on-screen/narrated number traced to ledger rows L01-L36 (+ Rome ledger for 476/1453); COMPUTED rows redone by the fact-checker and by me (L10 315.07; L11 1.90-2.67 min; L15 20,000; ratios 2.5 and 9; L33 0.00359 deg; L34 18.10 km) | PASS. Weakest: L21 (cattle/sheep, press, no method), L15/L16 (magazine summary) - all attributed on screen |
| Names and spelling | read all 84 cues of out/great-pyramid-workforce.srt | PASS. UK spelling throughout; "honorably" kept as in Hawass's quote |
| Sync | build/report.json | planned 208.1 s, file 208.1 s (0.0 s apart) |
| Loudness | ebur128 on the final file | I -14.2 LUFS, LRA 2.3 LU, true peak -1.1 dBTP (<= -1) |
| Dead air | silencedetect n=-45dB:d=1.5 | 0 |
| Black or frozen frames | blackdetect d=0.5:pix_th=0.05; freezedetect n=-60dB:d=4 | 0 / 0 |
| Join | lesson 27 format check on the 18 current scene files | 18 h264,1920,1080,yuv420p,30/1 |
| Rights | ledger L35 + package.md | fonts Inter (SIL OFL) + DejaVu Sans Mono (free licence); music generated; maps drawn from Natural Earth (public domain); Herodotus quote: Godley 1920 (US public domain); Hawass and Lehner: short attributed quotes |
| The ending | last 20 s transcribed (whisper tiny.en) + 3 frames | speech ends at 18.8 of 20 s with the full "Next" line; last 1.5 s music fading (mean -33.8 dB); outro visible, dips to background in the final 0.2 s |
| Chapters | node chapters.mjs | exit 0, 6 chapters, shortest 21 s (0:44-1:05) |
