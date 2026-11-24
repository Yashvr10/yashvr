# Writes src/scenes.json and src/lines.json for "The Art of LARPING", from src/narration.txt: the user's script
# (src/script-original.txt) narrated word for word apart from the softened swearing (see NOTES.md), "read"/"this piece"/
# "this publication" -> "watch"/"this video"/"this channel", numbers and citations written out for speech, capitals added.
# "# ..." lines become chapter cards (I-V); "> ..." lines are the chapter epigraphs (one clip each, shown as a quote).
#   python3 src/script.py
import json, hashlib, re
ROMAN = "I II III IV V VI".split()
RULES = [
 (r"Alexander|Achilles|Iliad|Zeus|Egypt", "alexander"), (r"Caesar|Rubicon|Augustus|Rome|Roman|Forum|Polybius|Sallust", "rome"),
 (r"mask|actor|role|play|playing|played|character|larp|pretend", "theatre"), (r"kid|child|stick|sword|backyard|knight|spaceship", "child"),
 (r"stonemason|bricks|house of God|building|stone|mountain", "builder"), (r"sleep|night|AM|dark|dream|asleep", "night"),
 (r"Da Vinci|sketch|wrote|write|writing|paper|script|book|lab|desk", "letter"), (r"god|God|heaven|Hermetic|Hermeticum|sacred|myth|Venus|Apollo|occult|esoteric|magic", "myth"),
 (r"mirror|self|identity|skin", "mirror"), (r"machine|gray|office|spreadsheet|paycheck|hour|job", "machine"),
 (r"influencer|Lambo|politician|approval|fake|followers|courses", "crowd"), (r"fighter|ring|hero|warrior|army|war|conquer|general", "knight"),
 (r"body|eat|train|dress|walk|clothes", "body"), (r"mind|think|thought|imagin|vision|image|memory", "thinker"),
 (r"decision|decide|will|conviction|burn|fire|ships", "fire"), (r"time|years|yesterday|tomorrow|week|month", "hourglass"),
 (r"Aristotle|Weber|Jung|Bruno|Heraclitus|James|Vonnegut|great men|ancestors", "portrait"),
]
KEYS = ("secret sleepwalking ideal mask identity larping fake myth hero alexander achilles zeus disenchantment stonemason machine "
        "disenchanted knights sword plaster script npc pattern imitative wax ancestors fire confidence competence builders asleep "
        "fighter hermetic imagination body mind spirit striking thunderbolt venus apollo creator now decision readiness rubicon cast "
        "ships play stone mountain mirror playbook").split()
def theme(t):
    th = [n for p, n in RULES if re.search(p, t, re.I if n not in ("night",) else 0)]
    return th[:2] or ["thinker"]
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
