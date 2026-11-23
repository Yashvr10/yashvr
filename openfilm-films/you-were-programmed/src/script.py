# Writes src/scenes.json for "You Were Programmed", from the user's own script (src/script-original.txt), narrated word for
# word apart from: "this article" -> "this video" (it is a video now), and headings ("# ...") become chapter cards.
# One narration clip per sentence. Picture themes and the sentence's key word (shown big in script) are chosen by rules below.
#   python3 src/script.py
import json, hashlib, re
TXT = open("src/script-original.txt").read().replace("this article", "this video").replace("this entire article", "this entire video")
ROMAN = "I II III IV V VI VII VIII IX X XI XII XIII XIV XV".split()
# theme rules: first matching pattern wins for the first theme; a second match adds a second theme
RULES = [
 (r"child|childhood|young|parent|teacher|Tuesday", "child"), (r"brain|neuron|neural|wiring|plasticity|neuroscience|Hebb", "anatomy"),
 (r"road|trail|path|walk", "road"), (r"mirror|bathroom", "mirror"), (r"sleep|drowsy|awake|night", "night"),
 (r"write|written|writing|script|record|pen|notes", "letter"), (r"fire|flames", "fire"), (r"press|hydraulic|machine|mechanic|architecture|blueprint", "machine"),
 (r"fear|dread|shame|humiliat|anxi|depress|catastroph", "fear"), (r"love|loved|friend", "love"), (r"court|testify|evidence|verdict", "judge"),
 (r"athlete|competition|arm-wrestle|wrestle", "athlete"), (r"ghost|implicit|memory|remember", "ghost"), (r"meditat|hypno|relax|calm|focus", "monk"),
 (r"heart|body|chest|organ", "body"), (r"crowd|people|culture|online|viral", "crowd"), (r"money|grocery|market", "market"),
 (r"repeat|repetition|reps|again|daily|schedule|weeks", "forge"), (r"mind|thought|think|belief|believe", "thinker"),
 (r"change|rewir|rebuil|renovat|reprogram|install", "sculptor"), (r"freeing|free|rescue|escape", "light"), (r"time|years|slow|wait", "hourglass"),
 (r"willpower|discipline|habit|fight", "knight"), (r"listen|voice|say|said", "portrait"),
]
STOP = set("that this with from your have what about which there their would could into just when they them than then been being were will only also even some most more such very where while like does doesn't isn't it's you're don't can't".split())
KEYS = "script autopilot programming mechanics installed uninstalled driving automatic willpower architecture press fires installed child absorbs blueprint pen repetition road paving grows reps neuroplasticity permit imagined rehearsal drained ghost record implicit awareness gap leverage outfit written identity prediction forecast receptive hypnosis magic ink burned fire evidence affirmation memories slow weeks rules finite protocol schedule hype repetition rescue reps listening believe".split()
S = []; ch = 0
def theme(t):
    th = [n for p, n in RULES if re.search(p, t, re.I)]
    return (th[:2] or ["thinker"])
def big(t):
    ws = [w.strip('.,;:?!"“”()').lower() for w in t.split()]
    for k in KEYS:
        if k in ws: return k
    return None
for para in TXT.strip().split("\n"):
    para = para.strip()
    if not para: continue
    if para.startswith("#"):
        S.append(dict(id=f"ch{ch + 1}", card="chapter", num=ROMAN[ch], title=para.lstrip("# ").strip(), len=4.4)); ch += 1; continue
    sents = re.split(r'(?:(?<=[.?!]["”])|(?<=[.?!]))\s+(?=[A-Z"“])', para)
    for i, t in enumerate(sents):
        t = t.strip()
        if not t: continue
        last = i == len(sents) - 1
        S.append(dict(id="s" + hashlib.sha1(t.encode()).hexdigest()[:10], text=t, th=theme(t), big=big(t), red=False,
                      gap=round((1.35 if last else 0.75) * 1.15, 2)))
json.dump(dict(voice="bm_lewis", speed=0.84, pitch=0.93, scenes=S), open("src/scenes.json", "w"), indent=1, ensure_ascii=False)
txt = [x["text"] for x in S if "text" in x]
print(len(txt), "sentences,", sum(len(t.split()) for t in txt), "words,", ch, "chapters")
import collections; print(sorted(collections.Counter(t for x in S if "th" in x for t in x["th"]).items(), key=lambda z: -z[1]))
