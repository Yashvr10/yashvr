# Lays out the metacognition video (16:9, 30 fps) from src/scenes.json and the narration clips in assets/vo.
#   python3 src/timeline.py  -> assets/narration.mp3 (the whole voice with its pauses), src/timing.json (sentences and cards
#                               with their times), src/shots.json (one painting per shot, each shot <= about 7 s)
# Cards (chapter titles, sub-headings, the sign-off) sit on black in silence; a quote card's text stays on screen over a
# painting while the quote is read.
import json, subprocess, collections
FPS = 30; LEAD = 0.8; TAIL = 3.0
cfg = json.load(open("src/scenes.json")); P = json.load(open("src/images.json"))
def dur(f): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]))
t = LEAD; items = []; parts = [f"anullsrc=r=48000:cl=mono,atrim=0:{LEAD}"]; inputs = []
quote_next = None
for x in cfg["scenes"]:
    if "card" in x:
        if x["card"] == "quote": quote_next = x; continue
        items.append(dict(kind=x["card"], title=x["title"], sub=x.get("sub", ""), at=round(t, 3), dur=x["len"]))
        inputs.append(("silence", x["len"])); t += x["len"]; continue
    d = dur(f"assets/vo/{x['id']}.mp3")
    it = dict(kind="sentence", id=x["id"], text=x["text"], th=x["th"], at=round(t, 3), dur=round(d, 3), gap=x["gap"])
    if quote_next: it["quote"] = dict(text=quote_next["title"], by=quote_next["sub"]); quote_next = None
    items.append(it); inputs.append((x["id"], d)); inputs.append(("silence", x["gap"])); t += d + x["gap"]
total = round(t + TAIL, 3)
# narration: concat clips and silences
lst = []
import os; os.makedirs(".film", exist_ok=True)
for k, d in inputs:
    if k == "silence":
        f = f".film/sil-{d:.2f}.wav"
        if not os.path.exists(f): subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", f"{d}", f], check=True)
    else:
        f = f".film/{k}.wav"
        if not os.path.exists(f): subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"assets/vo/{k}.mp3", "-ar", "48000", "-ac", "1", f], check=True)
    lst.append(f"file '{os.path.abspath(f)}'")
lead = ".film/sil-lead.wav"; subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", "anullsrc=r=48000:cl=mono", "-t", f"{LEAD}", lead], check=True)
open(".film/narr.txt", "w").write("\n".join([f"file '{os.path.abspath(lead)}'"] + lst))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", ".film/narr.txt", "-af", f"apad=whole_dur={total}", "-ar", "48000", "-ac", "2", "-b:a", "192k", "assets/narration.mp3"], check=True)
json.dump(dict(total=total, items=items), open("src/timing.json", "w"), indent=1, ensure_ascii=False)

# shots: each sentence (with its pause) is one shot, or several of about 6 s when long; paintings picked from the
# sentence's themes, least-used first, so repeats are rare and spread out
use = collections.Counter(); shots = []; last = None
segs = [it for it in items if it["kind"] == "sentence"]
for i, it in enumerate(segs):
    a = it["at"] if i else 0.0                                       # the first shot also covers the lead-in
    b = segs[i + 1]["at"] if i + 1 < len(segs) and items[items.index(it) + 1]["kind"] == "sentence" else it["at"] + it["dur"] + it["gap"]
    if i + 1 == len(segs): b = total
    n = max(1, round((b - a) / 6.5))
    for j in range(n):
        th = it["th"][j % len(it["th"])]
        pool = [k for k in P.get(th, []) if k != last] or [k for v in P.values() for k in v if k != last]
        k = min(pool, key=lambda k: (use[k], pool.index(k))); use[k] += 1; last = k
        s0 = a + (b - a) * j / n; s1 = a + (b - a) * (j + 1) / n
        shots.append(dict(img=k, at=round(s0, 3), dur=round(s1 - s0, 3), move=len(shots) % 4))
json.dump(shots, open("src/shots.json", "w"), indent=1)
print(f"total {total:.1f}s ({int(total // 60)}:{total % 60:04.1f}); {len(segs)} sentences, {len(items) - len(segs)} cards, {len(shots)} shots, {len(use)} paintings")
print("missing themes:", sorted({t for it in segs for t in it["th"] if not P.get(t)}))
