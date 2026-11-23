# invideo edit operations for the metacognition video (16:9, 1920x1080, 30 fps), from src/timing.json, src/shots.json
# and the word times in assets/vo/<id>.words.json.
#   python3 src/iv_ops.py <iv-assets.json> <out-dir>  -> ops-place.json, ops-text.json
# Pictures on V1 (one moving clip per shot); narration on A1; music bed on A2 (three calm tracks, about -36 LUFS under the
# voice). Text: yellow phrase captions (as in Y) on V2; chapter titles, sub-headings, quotes and the sign-off on V3-V6.
import json, re, sys
FPS = 30
ids = json.load(open(sys.argv[1])); out = sys.argv[2]
T = json.load(open("src/timing.json")); shots = json.load(open("src/shots.json"))
END_F = round(T["total"] * FPS); F = lambda s: round(s * FPS)

# ---- pictures, frame-exact and contiguous within each stretch
place = []
for i, s in enumerate(shots):
    f0 = F(s["at"]); f1 = F(s["at"] + s["dur"])
    place.append(dict(op="place_media", asset=ids[f"shot-{i:03d}"], track="V1", at_f=f0, source_start_seconds=0,
                      source_end_seconds=round((f1 - f0) / FPS, 4), mode="overwrite", linked_audio=False))
# ---- sound
place.append(dict(op="place_media", asset=ids["narration"], track="A1", at_f=0, source_start_seconds=0, source_end_seconds=T["total"], mode="overwrite", linked_audio=False))
music = [("meditation-3", 400.0), ("reverie", 321.0), ("full-moon", 439.0), ("gymnopedie-1", 210.0)]
t = 0.0
for name, L in music:
    if t >= T["total"]: break
    d = min(L, T["total"] - t)
    place.append(dict(op="place_media", asset=ids[name], track="A2", at_f=F(t), source_start_seconds=0, source_end_seconds=round(d, 3), mode="overwrite", linked_audio=False))
    t += d

# ---- captions: phrases of up to 6 words / about 30 characters, split at punctuation, timed by Whisper's word times
slides = []
for it in T["items"]:
    if it["kind"] != "sentence" or "quote" in it: continue
    W = json.load(open(f"assets/vo/{it['id']}.words.json"))
    items = [(w["word"], it["at"] + w["start"], it["at"] + w["end"]) for w in W]
    clauses, cur = [], []
    for x in items:
        cur.append(x)
        if re.search(r"[,.;:?!…]['’]?$", x[0]): clauses.append(cur); cur = []
    if cur: clauses.append(cur)
    for cl in clauses:
        chars = len(" ".join(x[0] for x in cl)); n = max(-(-len(cl) // 6), -(-chars // 30), 1); k = len(cl) / n
        for j in range(n):
            part = cl[round(j * k):round((j + 1) * k)]
            if part: slides.append(part)
cap = []
for i, ph in enumerate(slides):
    a = ph[0][1]; b = ph[-1][2]
    nxt = slides[i + 1][0][1] if i + 1 < len(slides) else b + 1.0
    b2 = min(max(b + 0.3, a + 0.7), nxt - 0.02)
    f0 = F(a); f1 = max(f0 + 6, F(b2))
    cap.append(dict(text=" ".join(x[0] for x in ph).rstrip(",.;:"), start_f=f0, end_f=f1))
for i in range(1, len(cap)):
    if cap[i]["start_f"] < cap[i - 1]["end_f"]: cap[i - 1]["end_f"] = cap[i]["start_f"]
cap = [c for c in cap if c["end_f"] > c["start_f"]]

# ---- cards
def wrap(s, n):
    words, lines, cur = s.split(), [], ""
    for w in words:
        if cur and len(cur) + 1 + len(w) > n: lines.append(cur); cur = w
        else: cur = (cur + " " + w).strip()
    return "\n".join(lines + [cur])
titles, subs, heads, quotes, bys = [], [], [], [], []
for it in T["items"]:
    a, b = F(it["at"]), F(it["at"] + it.get("dur", 0))
    if it["kind"] == "chapter":
        titles.append(dict(text=it["title"], start_f=a + 6, end_f=b - 4))
        if it["sub"]: subs.append(dict(text=it["sub"], start_f=a + 14, end_f=b - 4))
    elif it["kind"] in ("sub", "sign"):
        heads.append(dict(text=it["title"], start_f=a + 4, end_f=b - 4))
    elif it["kind"] == "sentence" and "quote" in it:
        e = F(it["at"] + it["dur"] + it["gap"]) - 2
        quotes.append(dict(text=wrap(it["quote"]["text"], 46), start_f=F(it["at"]) - 8, end_f=e))
        bys.append(dict(text=it["quote"]["by"], start_f=F(it["at"]) + 10, end_f=e))
font = lambda k: ids[f"font-{k}"]
text = [
    dict(op="add_captions", track="V2", slides=cap, style=dict(font=font("inter-mi"), font_size=52, font_weight=500, color="#F2D33B", align="center", shadow=True, shadow_color="#000000c0", shadow_blur=12)),
    dict(op="add_captions", track="V3", slides=titles, style=dict(font=font("instrument"), font_size=104, font_weight=400, color="#F2EDE4", align="center")),
    dict(op="add_captions", track="V4", slides=subs, style=dict(font=font("garamond"), font_size=40, font_weight=400, color="#E2B45E", align="center")),
    dict(op="add_captions", track="V5", slides=heads, style=dict(font=font("instrument"), font_size=84, font_weight=400, color="#E2B45E", align="center")),
    dict(op="add_captions", track="V6", slides=quotes, style=dict(font=font("garamond"), font_size=52, font_weight=400, color="#F7F2E8", align="center", shadow=True, shadow_color="#000000e0", shadow_blur=24)),
    dict(op="add_captions", track="V7", slides=bys, style=dict(font=font("garamond"), font_size=34, font_weight=400, color="#E2B45E", align="center", shadow=True, shadow_color="#000000e0", shadow_blur=16)),
]
text = [x for x in text if x["slides"]]
json.dump(place, open(f"{out}/ops-place.json", "w")); json.dump(text, open(f"{out}/ops-text.json", "w"), ensure_ascii=False)
print(len(place), "placements;", len(cap), "caption phrases;", len(titles), "chapters;", len(heads), "sub-headings;", len(quotes), "quotes; end", END_F / FPS, "s")
# where each text clip goes (applied after the clips exist): captions low, quote mid, attribution under it, subtitle under the title
json.dump(dict(V2=(0, 390), V3=(0, -20), V4=(0, 80), V5=(0, 0), V6=(0, -60), V7=(0, 150)), open(f"{out}/positions.json", "w"))
