# Writes src/scenes.json and src/lines.json for "Why Believing in Yourself Feels So Lonely", from src/narration.txt, an original
# script (see NOTES.md) inspired by the themes of a reference video the user shared; no lines are copied from it.
# "# ..." lines become chapter cards (I-VII); "> ..." lines are the chapter epigraphs (one clip each, shown as a quote).
#   python3 src/script.py
import json, hashlib, re
ROMAN = "I II III IV V VI VII".split()
RULES = [
 (r"mask|persona|costume|role|actor|theatre|perform|rehears|image they", "mask"),
 (r"mirror|reflect|face|faces|looked? in", "mirror"),
 (r"crowd|everyone|people|social|room|friends?|friendship|relationship|partner|dinner", "crowd"),
 (r"alone|lonel|isolat|silence|silent|quiet|distance|apart|mountain", "alone"),
 (r"child|parent|mother|father|generation|heirloom|classroom|boys|girls|drawing", "child"),
 (r"shadow|dark|buried|bury|hid|envy|cruel|rage|anger|ugly", "shadow"),
 (r"light|wake|waking|awake|clarity|clear|honest|see ", "light"),
 (r"storm|thunder|weather|war\b|armour|fight|battle|rebellion", "storm"),
 (r"cage|prison|fence|trapped|tamed|imprison|edges|boundar|limit", "cage"),
 (r"gold|talent|potential|ambition|intensity|hunger|treasure|worth", "gold"),
 (r"road|path|walk|journey|passage|leave|leaves|pulling away|far side", "road"),
 (r"sleep|asleep|numb|tired|exhaust|ceiling|morning|night|grey|anaesthetic", "sleep"),
 (r"kind|kindness|patien|polite|peace|yes|service|sacrific|pleas", "kind"),
 (r"Jung|wrote|letter|individuation|insisted|believed|noticed that|soul", "sage"),
 (r"wild|tree|garden|grow|nature", "nature"),
 (r"judge|jury|criticism|verdict|respect|power|approval|accept", "judge"),
]
KEYS = ("costume permission individuation preferred doubt mask persona sorry rule numb shadow gold irritation mirror "
        "recognition kindness entitlement boundaries no lonely awareness grief prison inherited potential fate rebellion "
        "armour fear respect illusion theatre anaesthetic alignment honest wake light comments").split()
def theme(t):
    th = [n for p, n in RULES if re.search(p, t, re.I if n != "sage" else 0)]
    return th[:2] or ["alone"]
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
                      gap=round((0.95 if last else 0.5) * 1.15, 2)))
json.dump(dict(scenes=S), open("src/scenes.json", "w"), indent=1, ensure_ascii=False)
lines = {x["id"]: x["text"] for x in S if "text" in x}
json.dump(lines, open("src/lines.json", "w"), indent=1, ensure_ascii=False)
print(len(lines), "lines,", sum(len(t.split()) for t in lines.values()), "words,", ch, "chapters,", len(set(lines)) == len(lines))
import collections; print(sorted(collections.Counter(t for x in S if "th" in x for t in x["th"]).items(), key=lambda z: -z[1]))
