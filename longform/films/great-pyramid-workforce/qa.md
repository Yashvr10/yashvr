# QA: pre-flight checklist (lesson 28), out/great-pyramid-workforce.mp4 v2 (7:38), 20 Oct 2026
Signed off by Claude under the owner's instruction to finish without asking. The owner should still watch it once.

| check | how | result |
|---|---|---|
| Structure | node validate.mjs | "35 scenes, 1186 words, ~7.9 min of narration" / manifest OK |
| Layout | node render.mjs --stills, 4 contact sheets (contact-sheet-1..4.jpg) read cell by cell | clean: no overflow, no overlap, nothing below y 860; map labels inside the safe box |
| Facts | every narrated/on-screen number traced to ledger rows L01-L60 (+ Rome ledger 476/1453); two narration lines tightened to match sources (s093, s126) | PASS. Weakest rows are attributed on screen: L21 cattle (press), L15/L16 (magazine), L41 AP |
| Names and spelling | read all 187 cues of the .srt | PASS; names consistent (Herodotus, Diodorus, Hawass, Lehner, Merer, Tura, Aswan, Ankh-haf, Menkaure) |
| Sync | build/report.json | planned 458.133 s, file 458.066 s (0.067 s apart) |
| Loudness | ebur128 on the final file | I -14.1 LUFS, LRA 2.5 LU, true peak -1.3 dBTP |
| Dead air | silencedetect n=-45dB:d=1.5 | 0 |
| Black or frozen frames | blackdetect d=0.5:pix_th=0.05; freezedetect n=-60dB:d=4 | 0 / 0 |
| Join | lesson 27 check on the 35 joined scene files (build/video.list) | 35 h264,1920,1080,yuv420p,30/1 |
| Rights | ledger L35 + package.md | Inter (SIL OFL) + DejaVu Sans Mono; generated music; maps drawn from Natural Earth (public domain); Herodotus via Godley 1920 (US public domain); Lehner, Hawass and AP quotes short and attributed |
| The ending | last 20 s transcribed + level | full closing line and "Next" line; final 1.5 s music fading (mean -31.2 dB) |
| Chapters | node chapters.mjs | exit 0, 7 chapters, shortest 28 s (4:21-4:49) |
| Effects | sfx per minute | 5 effects in 7.6 min, at most 2 in any 60 s; none above gain 0.6 |
