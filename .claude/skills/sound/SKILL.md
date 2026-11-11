---
name: sound
description: Use when a video Claude made needs sound effects, or a sound feels off; it finds openly licensed sounds, places real recordings on the frame, and checks them.
---

# 3 sound tools for Claude videos

## What you get
1. **Openverse**: an open API over 5.2 million openly licensed audio files (5,223,435 on Nov 9, 2026), many of them sound effects from Freesound. Claude searches and downloads them itself, no key needed.
2. **Real SFX**: a Claude Code skill that looks at your video, finds every moment that needs a sound, picks and processes real recordings from your library, places each on the exact frame, keeps your music and voice, and gives you a new MP4 plus a separate SFX track. It never synthesizes sound.
3. **earshot**: gives Claude "ears". It ranks sound files against a description by actually analysing the audio, finds the best moment in a long recording, checks real vs synthetic, measures loudness, and renders new effects from code (a bank of 252 code-made sounds, plus a forge that makes new ones) when nothing fits.

Use them together: Openverse finds real recordings, earshot picks the best by listening, Real SFX places them on the frames.

## What you'll need
- All three are free. No accounts or keys for the basic use.
- Openverse: nothing to install. Anonymous use is rate-limited; registering a free app (`POST https://api.openverse.org/v1/auth_tokens/register/`) raises the limits. Each sound keeps its own licence (CC0, CC BY and others): keep the attribution for anything that is not CC0, and filter with `license=cc0` or `license_type=commercial` when you need it.
- Real SFX: Python 3.9+, FFmpeg with ffprobe (macOS: `brew install ffmpeg-full`, first in PATH, because the plain `ffmpeg` formula lacks the `drawtext` and `rubberband` filters it uses), Node.js only for the optional UI-sound pack. It ships without a sound library beyond 78 CC0 UI sounds, so bring your own folder of sounds (or fill one from Openverse).
- earshot: uv and ffmpeg/ffprobe; CPU only. First use downloads two open models (~1.1 GB). The optional Gemini critique needs your own Gemini key and uploads audio, so it is opt-in.

## Setup

### 1. Openverse (no install)
Search:
```bash
curl "https://api.openverse.org/v1/audio/?q=whoosh&license=cc0&page_size=20"
```
Each result has `title`, `url` (direct file link), `license`, `creator`, `attribution` and `duration`. Download with `curl -L -o whoosh.mp3 "<url>"`. API docs: https://api.openverse.org/v1/

### 2. Real SFX (commands from its README)
```bash
git clone https://github.com/Clipwing/skills.git clipwing-skills
mkdir -p ~/.claude/skills
cp -R clipwing-skills/skills/real-sfx ~/.claude/skills/
```
Restart Claude Code. Then, from `~/.claude/skills/real-sfx`, point it at your sounds:
```bash
python scripts/setup.py scan "/path/to/Sounds"
python scripts/setup.py init --library main="/path/to/Sounds/SFX" --uisfx --index
python scripts/setup.py check
```
No library yet? `--uisfx` alone gives the 78 CC0 UI cues.

### 3. earshot (commands from its README)
```bash
uv tool install "earshot[mcp] @ git+https://github.com/Leonxlnx/earshot"
earshot doctor --fetch     # downloads the two models now (~1.1 GB)
claude mcp add earshot --scope user -e EARSHOT_THREADS=3 -- earshot mcp
```
Optional agent skill (how to listen with earshot): clone the repo and copy `skills/earshot` into `~/.claude/skills/`:
```bash
git clone https://github.com/Leonxlnx/earshot
cp -R earshot/skills/earshot ~/.claude/skills/
```

## How to use it
- "Find five CC0 whoosh sounds on Openverse and download them to `sfx/`."
- "Use earshot to rank the files in `sfx/` for 'fast airy whoosh' and tell me the winner and where its peak is."
- "Add sound design to this render" or "sound-design my HyperFrames project" (Real SFX). Listen to the five moments its critique lists; Claude cannot hear the final mix the way you do.
- "Nothing fits: render a short whoosh from earshot's bank, 0.8 seconds, peaking at 0.32" (earshot: `earshot sfx render whoosh_fast/crisp -o w.wav --dur 0.8 --apex 0.32`).

## Credits
- Openverse by WordPress: https://github.com/WordPress/openverse (code MIT; each sound under its own licence)
- Real SFX by Alexander Korbanov (Clipwing): https://github.com/Clipwing/skills/tree/main/skills/real-sfx (scripts MIT per its README; bundled UI sounds CC0)
- earshot by Leonxlnx: https://github.com/Leonxlnx/earshot (MIT)
- Bundle by Orbit.
