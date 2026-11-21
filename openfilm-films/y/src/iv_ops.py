# Writes the invideo edit operations for Project Y (9:16, 1080x1920, 30 fps) from src/shots.json, src/timing.json and
# the invideo transcript's word times (src/words-invideo.json).
#   python3 src/iv_ops.py <asset-ids.json>  -> scratch ops-place.json, ops-captions.json
# Captions follow the reference reel: one short phrase at a time, small yellow italic sans, lower centre.
import json, re, sys
FPS = 30
ids = json.load(open(sys.argv[1]))            # clip name -> media asset id, plus narration / music URLs
out = sys.argv[2]
shots = json.load(open("src/shots.json")); T = json.load(open("src/timing.json")); W = json.load(open("src/words-invideo.json"))
END_F = round((shots[-1]["at"] + shots[-1]["dur"]) * FPS)

# ---- pictures: contiguous, frame-exact
place = []
for s in shots:
    f0 = round(s["at"] * FPS); f1 = round((s["at"] + s["dur"]) * FPS)
    place.append(dict(op="place_media", asset=ids[s["clip"]], track="V1", at_f=f0, source_start_seconds=s["src_start"],
                      source_end_seconds=round(s["src_start"] + (f1 - f0) / FPS, 4), mode="overwrite", linked_audio=False))
# ---- sound: narration from 0; music under it, two ambient tracks crossfading
place.append(dict(op="place_media", asset=ids["narration"], track="A1", at_f=0, source_start_seconds=0, source_end_seconds=T["total"], mode="overwrite", linked_audio=False))
m1 = 276.0
place.append(dict(op="place_media", asset=ids["music1"], track="A2", at_f=0, source_start_seconds=0, source_end_seconds=m1, mode="overwrite", linked_audio=False))
place.append(dict(op="place_media", asset=ids["music2"], track="A2", at_f=round(m1 * FPS), source_start_seconds=0, source_end_seconds=round(END_F / FPS - m1, 3), mode="overwrite", linked_audio=False))

# ---- captions: script words, timed by the transcript (sentence by sentence, in order)
def toks(t): return re.findall(r"[A-Za-z0-9’']+[^\sA-Za-z0-9’']*|[^\s]+", t)
def norm(w): return re.sub(r"[^a-z0-9]", "", w.lower().replace("’", "'"))
wi = 0; slides = []
for s in T["sentences"]:
    sw = toks(s["text"])
    # transcript words that fall inside this sentence's span
    span = [w for w in W if w["start_seconds"] >= s["at"] - 0.3 and w["end_seconds"] <= s["at"] + s["dur"] + 0.3]
    if len(span) == len(sw): times = [(w["start_seconds"], w["end_seconds"]) for w in span]
    else:   # spread the sentence's time over its words by length
        a = span[0]["start_seconds"] if span else s["at"]; b = span[-1]["end_seconds"] if span else s["at"] + s["dur"]
        L = sum(len(x) + 1 for x in sw); t = a; times = []
        for x in sw: d = (b - a) * (len(x) + 1) / L; times.append((t, t + d)); t += d
    # phrases: split the sentence into clauses at punctuation, then each clause into equal chunks of at most
    # 6 words / about 30 characters, so a line never ends on a dangling short word
    items = list(zip(sw, times)); clauses = []; cur = []
    for it in items:
        cur.append(it)
        if re.search(r"[,.;:?!]$", it[0]): clauses.append(cur); cur = []
    if cur: clauses.append(cur)
    for cl in clauses:
        chars = len(" ".join(x for x, _ in cl)); n = max(-(-len(cl) // 6), -(-chars // 30), 1)
        k = len(cl) / n
        for j in range(n):
            part = cl[round(j * k):round((j + 1) * k)]
            if part: slides.append([(x, a, b) for x, (a, b) in part])
cap = []
for i, ph in enumerate(slides):
    a = ph[0][1]; b = ph[-1][2]
    nxt = slides[i + 1][0][1] if i + 1 < len(slides) else b + 1.0
    b2 = min(max(b + 0.25, a + 0.6), nxt - 0.02)          # hold a moment after the last word, never into the next phrase
    f0 = round(a * FPS); f1 = max(f0 + 6, round(b2 * FPS))
    words = []
    for (x, wa, wb) in ph:
        s0 = max(f0, round(wa * FPS)); e0 = min(f1, max(s0 + 1, round(wb * FPS)))
        words.append(dict(text=x, start_f=s0, end_f=e0))
    text = " ".join(c[0] for c in ph).rstrip(",.;:")
    cap.append(dict(text=text, start_f=f0, end_f=f1))
for i in range(1, len(cap)):                                # no overlaps
    if cap[i]["start_f"] < cap[i - 1]["end_f"]: cap[i - 1]["end_f"] = cap[i]["start_f"]
cap = [c for c in cap if c["end_f"] > c["start_f"]]
style = dict(font=ids["font"], font_size=50, font_weight=500, color="#F2D33B", align="center", shadow=True, shadow_color="#000000b0", shadow_blur=10)
captions = [dict(op="add_captions", track="V2", slides=cap, style=style)]
json.dump(place, open(f"{out}/ops-place.json", "w")); json.dump(captions, open(f"{out}/ops-captions.json", "w"))
print(len(place), "placements;", len(cap), "caption phrases; end", END_F / FPS, "s")
print([c["text"] for c in cap[:12]])
