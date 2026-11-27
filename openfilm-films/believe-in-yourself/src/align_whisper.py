# Word timings with openai-whisper (word_timestamps=True) for every narration file.
# Writes assets/vo/<id>.words.json (each script word with start/end, in seconds from the voice's start) and
# assets/vo/<id>.vtt (caption cues with a timestamp at each word). The script's own words are kept; Whisper supplies
# the times (difflib alignment; words Whisper heard differently get times interpolated between their neighbours).
#   python3 src/align_whisper.py .  [model]      (default model: small.en)
import json, sys, re, difflib
import whisper
P = sys.argv[1]; MODEL = sys.argv[2] if len(sys.argv) > 2 else "small.en"
cfg = json.load(open(f"{P}/src/scenes.json"))
model = whisper.load_model(MODEL, device="cpu")
norm = lambda w: re.sub(r"[^a-z0-9]", "", w.lower())
def ts(t): h = int(t // 3600); m = int(t % 3600 // 60); return f"{h:02d}:{m:02d}:{t % 60:06.3f}"
for s in cfg["scenes"]:
    if "text" not in s: continue
    r = model.transcribe(f"{P}/assets/vo/{s['id']}.mp3", word_timestamps=True, language="en", fp16=False, condition_on_previous_text=False)
    heard = [w for seg in r["segments"] for w in seg.get("words", [])]
    script = s["text"].split()
    a = [norm(w) for w in script]; b = [norm(w["word"]) for w in heard]
    times = [None] * len(script)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for i in range(blk.size): times[blk.a + i] = (heard[blk.b + i]["start"], heard[blk.b + i]["end"])
    end_all = heard[-1]["end"] if heard else 1.0
    i = 0
    while i < len(times):
        if times[i] is None:
            j = i
            while j < len(times) and times[j] is None: j += 1
            t0 = times[i - 1][1] if i else 0.0
            t1 = times[j][0] if j < len(times) else end_all
            n = j - i
            for k in range(n): times[i + k] = (t0 + (t1 - t0) * k / n, t0 + (t1 - t0) * (k + 1) / n)
            i = j
        else: i += 1
    json.dump([{"word": w, "start": round(t[0], 3), "end": round(t[1], 3)} for w, t in zip(script, times)],
              open(f"{P}/assets/vo/{s['id']}.words.json", "w"), indent=0)
    cues, cur = [], []
    for k, w in enumerate(script):
        cur.append(k)
        if len(cur) >= 7 or re.search(r"[.?!:]$", w) or (w.endswith(",") and len(cur) >= 4): cues.append(cur); cur = []
    if cur: cues.append(cur)
    out = ["WEBVTT", ""]
    for c in cues:
        out += [f"{ts(times[c[0]][0])} --> {ts(times[c[-1]][1])}", " ".join([script[c[0]]] + [f"<{ts(times[k][0])}>{script[k]}" for k in c[1:]]), ""]
    open(f"{P}/assets/vo/{s['id']}.vtt", "w").write("\n".join(out))
    matched = sum(x.size for x in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks()) / max(1, len(a))
    print(s["id"], f"{matched:.2f}", "|", r["text"].strip()[:90], flush=True)
