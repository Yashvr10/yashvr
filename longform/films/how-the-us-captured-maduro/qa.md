# QA: pre-flight checklist (lesson 28), how-the-us-captured-maduro, 24 Oct 2026
Signed off by Claude (hands-off run). The owner should watch it once before upload.

| check | how | result |
|---|---|---|
| Structure | node validate.mjs | "36 scenes, 1185 words, ~7.9 min of narration" / manifest OK |
| Layout | node render.mjs --stills, 4 contact sheets read cell by cell | clean after 2 fixes (s165 label to one line; s190 map re-centred as map-caracas-v2) |
| Facts | every narrated number/claim traced to ledger V01-V43; official claims and anonymous-source reporting attributed in narration | PASS. Weakest: V17-V19 (anonymous sources), V24 (open-source video analysis), V27 (Trump's blackout claim) - all attributed |
| Names and spelling | read all 188 cues of the .srt | PASS |
| Sync | build/report.json | planned 478.667 s, file 478.633 s (0.034 s apart) |
| Loudness | ebur128 | -14.1 LUFS, true peak -1.3 dBTP (hits lowered to gain 0.3; draft peaked at -0.7) |
| Dead air / black / frozen | silencedetect, blackdetect, freezedetect | 0 / 0 / 0 |
| Join | lesson 27 check on the 36 joined scenes | 36 h264,1920,1080,yuv420p,30/1 |
| Delivery file | out/how-the-us-captured-maduro.single.mp4 | one pass, CFR 30, 14,356 frames 1/30 s apart, same audio |
| Rights | ledger "Images" table | Navy/Army photos public domain; Caracas photo CC0; Maduro photo CC BY 4.0 credited on screen and in description; maps from Natural Earth; quotes short and attributed |
| The ending | last 20 s transcribed + level | full closing lines; music fades (mean -31.4 dB in the last 1.5 s) |
| Chapters | node chapters.mjs | exit 0, 10 chapters, shortest 13 s (6:53-7:06); description matches |
| Effects | sfx | 2 hits (gain 0.3, before the voice) + 7 chapter whooshes (0.35) in 8 min; none above 0.6 |
