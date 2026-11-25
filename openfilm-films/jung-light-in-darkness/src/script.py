# Writes src/scenes.json and src/lines.json for "Carl Jung: The Light in the Darkness", from src/narration.txt, an original
# script (see NOTES.md). Numbers and citations are written out for speech.
# "# ..." lines become chapter cards (I-VI); "> ..." lines are the chapter epigraphs (one clip each, shown as a quote).
#   python3 src/script.py
import json, hashlib, re
ROMAN = "I II III IV V VI".split()
RULES = [
 (r"stairway|hole|underground|under the ground|chamber|curtain|cave|depths|descent|going down|went down", "cave"),
 (r"throne|man-eater|ritual|idol|god of the earth|eye", "idol"),
 (r"stone|rock|tower|Bollingen|cottages|castle|village|building blocks", "stone"),
 (r"boy|child|little|school|parents|mother|father|parsonage", "child"),
 (r"two people|personality number|personalities|opposites|split|shadow", "double"),
 (r"light|flame|lamp|kindle|consciousness|fire", "light"),
 (r"fog|wind|storm|lightning|night|dark", "storm"),
 (r"dream|vision|visions|fantas|images|asleep|sleep", "dream"),
 (r"patient|asylum|Burghölzli|doctor|psychiatr|physician|medicine|\bmad\b|neurosis|\bill\b", "doctor"),
 (r"moon|stars|universe|space|cosmos|globe|earth below|infinite|void", "cosmos"),
 (r"Freud|crown prince|mentor|colleagues|Nietzsche", "portrait"),
 (r"flood|sea|blood|war|drowned|waves|lake|water|pool", "flood"),
 (r"book|notebook|wrote|words|paper|textbook|preface|letter|carved", "book"),
 (r"Philemon|kingfisher|horns|figures|old man|sage|temple|Indian", "sage"),
 (r"mandala|circle|centre|Self|wholeness|round", "mandala"),
 (r"alchem|lead into gold|kings and queens|dragons|vessel|Gnostic", "alchemy"),
 (r"tree|forest|woods|roots|rhizome|plant|flower|garden|nature|meadow|animals|clouds", "nature"),
 (r"death|died|grave|dying|heart attack|life and death", "death"),
 (r"God|Jesus|divine|deus|sacred|soul|faith", "god"),
]
KEYS = ("rhizome underneath man-eater throne eye initiation stone two shadow light flame fog psychiatry moon listened wounded "
        "freud crown descent unconscious flood blood war red philemon kingfisher mandala self alchemy gold bollingen tower womb "
        "simple temple history doctor boxes infinite calling unlived kinship roots lightning vocatus root").split()
def theme(t):
    th = [n for p, n in RULES if re.search(p, t, re.I if n not in ("god","sage") else 0)]
    return th[:2] or ["dream"]
def big(t):
    ws = [w.strip('.,;:?!"“”()\'‘’…').lower() for w in t.split()]
    for k in KEYS:
        if k in ws: return k
    return None
S, ch = [], 0
for para in open("src/narration.txt").read().strip().split("\n"):
    para = para.strip()
    if not para: continue
    if para.startswith("#"):
        S.append(dict(id=f"ch{ch + 1}", card="chapter", num=ROMAN[ch], title=para.lstrip("# ").strip(), len=4.4)); ch += 1; continue
    if para.startswith(">"):
        t = para.lstrip("> ").strip()
        S.append(dict(id="q" + hashlib.sha1(t.encode()).hexdigest()[:10], text=t, quote=True, th=theme(t), big=None, red=False, gap=1.6)); continue
    sents = re.split(r'(?<=[.?!])["”\']?\s+(?=["“\'A-Z])', para)
    for i, t in enumerate(sents):
        t = t.strip()
        if not t: continue
        last = i == len(sents) - 1
        S.append(dict(id="s" + hashlib.sha1(t.encode()).hexdigest()[:10], text=t, th=theme(t), big=big(t), red=False,
                      gap=round((1.35 if last else 0.75) * 1.15, 2)))
json.dump(dict(scenes=S), open("src/scenes.json", "w"), indent=1, ensure_ascii=False)
lines = {x["id"]: x["text"] for x in S if "text" in x}
json.dump(lines, open("src/lines.json", "w"), indent=1, ensure_ascii=False)
print(len(lines), "lines,", sum(len(t.split()) for t in lines.values()), "words,", ch, "chapters,", len(set(lines)) == len(lines))
import collections; print(sorted(collections.Counter(t for x in S if "th" in x for t in x["th"]).items(), key=lambda z: -z[1]))
