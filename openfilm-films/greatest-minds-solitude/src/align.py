# Word timings for each narration file -> assets/vo/<id>.vtt (one cue per line of up to ~7 words, a timestamp tag at each word).
# Script words are kept; whisper supplies the times (difflib alignment, gaps interpolated).
import json, sys, re, difflib, subprocess
import numpy as np
from faster_whisper import WhisperModel
P = sys.argv[1]
cfg = json.load(open(f"{P}/src/scenes.json"))
m = WhisperModel("base.en", device="cpu", compute_type="int8")
def norm(w): return re.sub(r"[^a-z0-9]", "", w.lower())
def ts(t): h=int(t//3600); mi=int(t%3600//60); s=t%60; return f"{h:02d}:{mi:02d}:{s:06.3f}"
report = {}
for s in cfg["scenes"]:
    if "text" not in s: continue
    pcm = subprocess.run(["ffmpeg","-loglevel","error","-i",f"{P}/assets/vo/{s['id']}.mp3","-f","s16le","-ac","1","-ar","16000","-"],capture_output=True,check=True).stdout
    segs, _ = m.transcribe(np.frombuffer(pcm,np.int16).astype(np.float32)/32768, word_timestamps=True, language="en")
    heard = [w for seg in segs for w in seg.words]
    script = s["text"].split()
    a = [norm(w) for w in script]; b = [norm(w.word) for w in heard]
    times = [None]*len(script)
    for blk in difflib.SequenceMatcher(None, a, b, autojunk=False).get_matching_blocks():
        for i in range(blk.size): times[blk.a+i] = (heard[blk.b+i].start, heard[blk.b+i].end)
    # interpolate unmatched words
    end_all = heard[-1].end if heard else 1.0
    for i in range(len(times)):
        if times[i] is None:
            prev = next((times[j][1] for j in range(i-1,-1,-1) if times[j]), 0.0)
            nxt_i = next((j for j in range(i+1,len(times)) if times[j]), None)
            nxt = times[nxt_i][0] if nxt_i is not None else end_all
            n = (nxt_i if nxt_i is not None else len(times)) - i
            # spread the unmatched run evenly
            for k in range(n):
                st = prev + (nxt-prev)*k/n; times[i+k] = (st, prev + (nxt-prev)*(k+1)/n)
    report[s["id"]] = {"heard": " ".join(w.word.strip() for w in heard), "matched": sum(1 for x in difflib.SequenceMatcher(None,a,b,autojunk=False).get_matching_blocks() for _ in range(x.size))/max(1,len(a))}
    # cues: break at sentence ends / commas, max 7 words
    cues, cur = [], []
    for i, w in enumerate(script):
        cur.append(i)
        if len(cur) >= 7 or re.search(r"[.?!:]$", w) or (re.search(r",$", w) and len(cur) >= 4):
            cues.append(cur); cur = []
    if cur: cues.append(cur)
    out = ["WEBVTT", ""]
    for c in cues:
        st, en = times[c[0]][0], times[c[-1]][1]
        words = [script[c[0]]] + [f"<{ts(times[i][0])}>{script[i]}" for i in c[1:]]
        out += [f"{ts(st)} --> {ts(en)}", " ".join(words), ""]
    open(f"{P}/assets/vo/{s['id']}.vtt", "w").write("\n".join(out))
json.dump(report, open(f"{P}/src/align-report.json","w"), indent=1)
for k,v in report.items(): print(k, round(v["matched"],2), "|", v["heard"][:150])
