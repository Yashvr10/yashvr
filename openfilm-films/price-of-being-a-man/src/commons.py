# Public-domain paintings from Wikimedia Commons for "The Price Of Being A Man". Each query -> up to N files whose licence is public domain; saved as
# assets/photos/<theme>-c<n>.jpg (longest side 2400 px) and added to src/images.json + src/photo-credits.json.
#   python3 src/commons.py [N]
import json, os, re, subprocess, sys, io, time, urllib.parse
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
N = int(sys.argv[1]) if len(sys.argv) > 1 else 4
UA = "Mozilla/5.0 (compatible; film-research-bot/1.0)"
Q = {'face': ['portrait of a man painting 19th century dark', 'pensive man portrait painting', 'Rembrandt self-portrait', 'bearded man portrait painting'],
 'sunrise': ['sunrise painting romantic', 'Caspar David Friedrich sunrise', 'dawn mountains painting'],
 'knight': ['knight in armour painting', 'medieval knight painting', 'knight on horseback painting', 'Saint George painting armour'],
 'labourer': ['labourer carrying load painting', 'man carrying sack painting', 'stone breakers painting', 'workers painting 19th century realism'],
 'night': ['moonlight painting 19th century', 'man alone at night painting', 'candlelight painting interior'],
 'storm': ['storm at sea painting', 'storm landscape painting romantic', 'thunderstorm painting'],
 'crowd': ['crowd painting 19th century', 'street scene painting 19th century crowd'],
 'wanderer': ['wanderer painting romantic', 'lone traveller painting landscape', 'pilgrim walking painting'],
 'road': ['road landscape painting 19th century', 'path through field painting'],
 'prayer': ['man praying painting', 'prayer painting 19th century', 'monk praying painting'],
 'fire': ['fire painting night', 'campfire painting', 'burning painting 19th century'],
 'feast': ['banquet painting', 'tavern painting drinking', 'feast painting'],
 'monk': ['monk meditation painting', 'monk reading painting', 'hermit saint painting'],
 'ruins': ['ruins painting romantic', 'Hubert Robert ruins', 'abbey ruins painting'],
 'mountain': ['mountain painting romantic', 'Alps painting 19th century', 'mountain peak painting'],
 'mirror': ['man looking in mirror painting', 'reflection mirror painting 19th century'],
 'lake': ['still lake painting 19th century', 'mountain lake reflection painting'],
 'oldman': ['old man portrait painting', 'old man painting Rembrandt', 'elderly man painting'],
 'hermit': ['hermit painting', 'man alone painting landscape', 'solitude painting'],
 'interior': ['Hammershoi interior', 'quiet interior painting 19th century'],
 'forge': ['blacksmith painting', 'forge painting', 'Wright of Derby forge', 'anvil blacksmith painting'],
 'boy': ['boy portrait painting 19th century', 'boy painting 19th century'],
 'sea': ['calm sea painting', 'seascape painting'],
 'mason': ['stonemason painting', 'builders painting 19th century', 'construction painting'],
 'family': ['family portrait painting 19th century', 'father and son painting'],
 'battle': ['battle painting', 'cavalry charge painting'],
 'forest': ['Shishkin forest painting', 'dark forest painting', 'forest interior painting 19th century'],
 'funeral': ['funeral painting 19th century', 'mourning painting'],
 'father': ['father and son painting', 'father holding child painting'],
 'sculptor': ['sculptor at work painting', 'sculptor studio painting'],
 'statue': ['marble statue', 'Greek marble statue'],
 'dragon': ['Saint George and the dragon painting', 'dragon painting', 'knight dragon painting'],
 'temple': ['temple ruins painting', 'Greek temple painting', 'cathedral interior painting'],
 'sword': ['sword painting', 'knight with sword painting'],
 'window': ['man at window painting', 'figure at window Friedrich'],
 'field': ['wheat field painting 19th century', 'peasants field painting Millet'],
 'bridge': ['bridge painting 19th century', 'old stone bridge painting'],
 'ship': ['ship in storm painting', 'sailing ship painting'],
 'lion': ['lion painting', 'lion Delacroix', 'lion portrait painting'],
 'brothers': ['soldiers resting painting', 'comrades painting', 'men around campfire painting'],
 'rock': ['rocky landscape painting', 'rock coast painting'],
 'river': ['river painting 19th century landscape'],
 'fog': ['fog landscape painting', 'sea of fog painting', 'mist painting romantic'],
 'letter': ['man writing letter painting', 'writer at desk painting 19th century'],
 'king': ['king portrait painting', 'crowned king painting', 'coronation painting'],
 'landscape': ['romantic landscape painting', 'valley landscape painting 19th century'],
 'boat': ['rowing boat painting', 'lone boat painting sea'],
 'insect': ['caterpillar chrysalis illustration', 'butterfly metamorphosis illustration'],
 'mask': ['carnival mask painting', 'masquerade painting'],
 'thinker': ['philosopher painting', 'scholar reading painting'],
 'lighthouse': ['lighthouse painting', 'lighthouse storm painting'],
 'autumn': ['autumn leaves painting', 'autumn tree painting'],
 'school': ['schoolroom painting'],
 'harvest': ['harvest painting 19th century', 'harvesters painting']}
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
                b = subprocess.check_output(["curl", "-sL", "-A", UA, "--max-time", "120", ii.get("thumburl") or ii["url"]])
                im = Image.open(io.BytesIO(b)).convert("RGB"); im.thumbnail((2400, 2400)); im.save(f"assets/photos/{k}.jpg", quality=88)
            except Exception as e: print("fail", p["title"], e); continue
            seen.add(ii.get("descriptionurl")); got += 1; P.setdefault(th, []).append(k)
            strip = lambda s: re.sub(r"<[^>]+>", "", s or "").strip()
            C[k] = dict(title=p["title"].replace("File:", ""), artist=strip(md.get("Artist", {}).get("value"))[:80], license=strip(md.get("LicenseShortName", {}).get("value")),
                        source=ii.get("descriptionurl"), kind="painting")
            time.sleep(0.3)
        print(th, q, got, flush=True)
json.dump(P, open("src/images.json", "w"), indent=1); json.dump(C, open("src/photo-credits.json", "w"), indent=1)
print(sum(1 for k in C if "-c" in k), "Commons paintings")
