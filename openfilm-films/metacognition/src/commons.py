# Public-domain paintings from Wikimedia Commons for the metacognition video. Each query -> up to N files whose licence is public domain; saved as
# assets/photos/<theme>-c<n>.jpg (longest side 2400 px) and added to src/images.json + src/photo-credits.json.
#   python3 src/commons.py [N]
import json, os, re, subprocess, sys, io, time, urllib.parse
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
N = int(sys.argv[1]) if len(sys.argv) > 1 else 4
UA = "Mozilla/5.0 (compatible; film-research-bot/1.0)"
Q = {'thinker': ['Rembrandt philosopher in meditation', 'philosopher painting', 'pensive man portrait painting', 'man lost in thought painting', 'melancholy painting man'], 'judge': ['judge court painting', 'trial painting 19th century', 'tribunal painting', 'Last Judgement painting', 'scales of justice painting'], 'mirror': ['man looking in mirror painting', 'reflection mirror painting', 'Narcissus painting', 'vanity mirror painting'], 'child': ['child portrait painting 19th century', 'crying child painting', 'tired child painting', 'children playing painting'], 'road': ['road at dusk painting', 'carriage on road painting', 'country road painting 19th century'], 'light': ['light through window painting', 'beam of light painting', 'rays of light painting'], 'study': ['scholar in study painting', 'Saint Jerome in his study painting', 'writer at desk painting'], 'hand': ['Albrecht Dürer hands study', 'hand drawing study', 'praying hands Dürer'], 'fear': ['anxious man painting', 'fear painting', 'frightened man painting'], 'anatomy': ['Vesalius anatomy engraving', 'anatomical heart engraving', 'Leonardo da Vinci anatomy drawing'], 'letter': ['man writing letter painting', 'reading letter painting', 'journal writing painting'], 'hourglass': ['hourglass painting vanitas', 'vanitas still life hourglass'], 'crowd': ['crowd painting 19th century', 'market crowd painting'], 'night': ['candlelight painting interior', 'man at night candle painting', 'moonlight painting 19th century'], 'helm': ['ship helm painting', 'sailor at the wheel painting', 'helmsman painting'], 'sculptor': ['sculptor at work painting', 'Pygmalion painting', 'sculptor studio painting'], 'shadow': ['Plato allegory of the cave engraving', 'shadow figure painting', 'dark figure painting'], 'science': ['Wright of Derby air pump', 'laboratory painting 19th century', 'scientist experiment painting'], 'school': ['schoolroom painting', 'village school painting', 'children at school painting'], 'dream': ['Fuseli The Nightmare', 'sleeping man painting', 'Goya sleep of reason', 'dream painting'], 'chess': ['chess players painting', 'chess game painting'], 'puppet': ['marionette painting', 'puppet theatre painting', 'puppeteer engraving'], 'sea': ['calm sea painting', 'waves painting 19th century', 'stormy sea painting'], 'river': ['river current painting', 'river rapids painting', 'river landscape painting'], 'double': ['Rossetti How They Met Themselves', 'doppelganger painting', 'two identical figures painting'], 'market': ['quack doctor painting', 'charlatan painting', 'tooth puller painting'], 'door': ['Hammershoi interior door', 'open door painting interior', 'doorway painting'], 'alchemist': ['alchemist painting', 'Wright of Derby alchemist', 'alchemist laboratory painting'], 'reading': ['man reading book painting', 'asleep over book painting', 'reading by candlelight painting'], 'diagram': ['medieval manuscript diagram', 'astronomical diagram engraving', 'Leonardo da Vinci notebook'], 'greece': ['ancient Greece painting', 'Acropolis painting', 'Greek ruins painting'], 'ship': ['sailing ship painting', 'ship at sea painting'], 'machine': ['clockwork mechanism engraving', 'machine engraving 19th century', 'Leonardo machine drawing'], 'clock': ['clock painting', 'pocket watch still life painting', 'clockmaker painting'], 'forge': ['blacksmith painting', 'forge painting', 'anvil blacksmith painting'], 'temple': ['Greek temple painting', 'temple ruins painting'], 'gods': ['gods of Olympus painting', 'Zeus painting', 'Apollo painting'], 'delphi': ['Delphi painting', 'Temple of Apollo Delphi', 'Delphi ruins engraving'], 'statue': ['Greek marble statue', 'marble statue'], 'stoic': ['Epictetus engraving', 'Marcus Aurelius statue', 'Seneca bust'], 'abyss': ['Gustave Doré engraving abyss', 'Doré Dante Inferno engraving'], 'morning': ['morning window painting', 'sunrise window painting', 'waking up painting'], 'anger': ['angry man painting', 'rage painting', 'quarrel painting'], 'despair': ['despair painting', 'grief painting 19th century', 'Munch Melancholy'], 'ruins': ['ruins painting romantic', 'Hubert Robert ruins'], 'monk': ['monk meditation painting', 'monk reading painting'], 'vitruvian': ['Vitruvian Man', 'Leonardo da Vinci drawing'], 'napoleon': ['Napoleon painting', 'Napoleon crossing the Alps', 'Napoleon in his study'], 'tree': ['tree roots painting', 'old oak tree painting'], 'vision': ['vision painting saint', 'William Blake painting'], 'fool': ['fool jester painting', 'jester painting'], 'coffee': ['coffee house painting', 'coffee still life painting'], 'socrates': ['Death of Socrates David', 'Socrates painting', 'Socrates bust'], 'oracle': ['Oracle of Delphi painting', 'Priestess of Delphi Collier', 'Pythia painting'], 'harvest': ['harvest painting 19th century'], 'war': ['ancient Greek battle painting', 'battle painting'], 'vine': ['withered vine painting', 'grapevine painting'], 'fire': ['fire painting night', 'campfire painting'], 'gold': ['goldsmith painting', 'jeweller painting', 'gold coins still life painting'], 'knight': ['knight in armour painting', 'Saint George painting armour']}
def api(params):
    u = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({**params, "format": "json"})
    for i in range(4):
        try: return json.loads(subprocess.check_output(["curl", "-s", "-A", UA, "--max-time", "60", u]))
        except Exception: time.sleep(3 * (i + 1))
    return {}
P = json.load(open("src/images.json")); C = json.load(open("src/photo-credits.json"))
seen = {c.get("source") for c in C.values()}
for th, qs in Q.items():
    for q in qs:
        r = api(dict(action="query", generator="search", gsrsearch=f"{q} filetype:bitmap", gsrnamespace=6, gsrlimit=15,
                     prop="imageinfo", iiprop="url|extmetadata|size", iiurlwidth=1920))
        pages = sorted((r.get("query") or {}).get("pages", {}).values(), key=lambda p: p.get("index", 99)); got = 0
        for p in pages:
            ii = (p.get("imageinfo") or [{}])[0]; md = ii.get("extmetadata", {})
            lic = (md.get("LicenseShortName", {}).get("value", "") + " " + md.get("License", {}).get("value", "")).lower()
            if got >= N or ii.get("descriptionurl") in seen or not ("public domain" in lic or "pd" in lic.split() or lic.startswith("pd") or "cc0" in lic): continue
            if min(ii.get("width", 0), ii.get("height", 0)) < 600 or not re.search(r"\.(jpe?g|png|tif)", p["title"], re.I): continue
            k = f"{th}-c{max([int(f.rsplit('-c', 1)[1][:-4]) for f in os.listdir('assets/photos') if f.startswith(th + '-c')] or [0]) + 1}"   # next free number on disk (no collisions after removals)
            try:
                for w in (0, 8, 20, 45, 90):                      # Wikimedia answers 429 when fetched too fast: back off and retry
                    time.sleep(w)
                    b = subprocess.check_output(["curl", "-sL", "-A", UA, "--max-time", "120", ii.get("thumburl") or ii["url"]])
                    if not b.lstrip()[:15].lower().startswith((b"<!doctype", b"<html")): break
                im = Image.open(io.BytesIO(b)).convert("RGB"); im.thumbnail((2400, 2400)); im.save(f"assets/photos/{k}.jpg", quality=88)
            except Exception as e: print("fail", p["title"], e); continue
            seen.add(ii.get("descriptionurl")); got += 1; P.setdefault(th, []).append(k)
            strip = lambda s: re.sub(r"<[^>]+>", "", s or "").strip()
            C[k] = dict(title=p["title"].replace("File:", ""), artist=strip(md.get("Artist", {}).get("value"))[:80], license=strip(md.get("LicenseShortName", {}).get("value")),
                        source=ii.get("descriptionurl"), kind="painting")
            time.sleep(2.0)
        print(th, q, got, flush=True)
json.dump(P, open("src/images.json", "w"), indent=1); json.dump(C, open("src/photo-credits.json", "w"), indent=1)
print(sum(1 for k in C if "-c" in k), "Commons paintings")
