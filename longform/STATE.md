# STATE
Film: How many people actually built the Great Pyramid?     Slug: great-pyramid-workforce
Stage: 7 (stills) - in progress. Owner away 5-6 h and delegated every gate to Claude ("choose whatever you feel like is right"); each delegated call is marked [delegated] below.
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
Open issues: none yet for this film
