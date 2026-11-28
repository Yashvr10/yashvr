# Writes src/scenes.json and src/lines.json for "Delusional Until It Becomes Real", from src/narration.txt (the user's own
# script, lightly edited for speech; see NOTES.md).
# "# ..." lines become chapter cards (I-III); "> ..." lines are the chapter epigraphs (one clip each, shown as a quote).
#   python3 src/script.py
import json, hashlib, re
ROMAN = "I II III IV V VI VII".split()
RULES = [
 (r"stare|look(ed|s)? (down|at)|smirk|eyebrow|judg|eyes|envy|who does he", "judge"),
 (r"crowd|people|everyone|friends?|them\b|their|sane", "crowd"),
 (r"mask|smiled|react|gave them nothing", "mask"),
 (r"mirror|my own voice|talk to myself|answer back", "mirror"),
 (r"alone|only he|one person|nobody clapping|lost almost|lonely|quiet life", "alone"),
 (r"dream|vision|world that only|picture|wake|sleep|night", "dream"),
 (r"fire|burn|hungry|obsession|fanatical|stubborn", "fire"),
 (r"war|fight|battle|training|game|survive|bounce back|quit", "war"),
 (r"empire|build|founder|top|money|success|reward|employ|machine|song|building", "empire"),
 (r"faith|religion|believe|belief|hope|pray", "faith"),
 (r"mother|family|love you|closest|worry", "family"),
 (r"crazy|delusion|madness|insane|mad\b", "madness"),
 (r"road|years|months|long|path|staircase|keep going|catches up|reality", "road"),
 (r"glass|door|open|changed|tapping", "door"),
 (r"Lawrence|Emerson|Aristotle|Laërtius", "sage"),
]
KEYS = ("delusional crazy delusion faith religion doubted mask envy self-defence archive balance stares "
        "founder empires zero war price mirror quit glass everything realistic employs dream wake fanatical "
        "picture reality madness vision").split()
def theme(t):
    th = [n for p, n in RULES if re.search(p, t, re.I if n != "sage" else 0)]
    return th[:2] or ["road"]
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
