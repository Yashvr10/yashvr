# Public-domain paintings from Wikimedia Commons for "Becoming What You Are Meant To Become". Each query -> up to N files whose licence is public domain; saved as
# assets/photos/<theme>-c<n>.jpg (longest side 2400 px) and added to src/images.json + src/photo-credits.json.
#   python3 src/commons.py [N]
import json, os, re, subprocess, sys, io, time, urllib.parse
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
N = int(sys.argv[1]) if len(sys.argv) > 1 else 4
UA = "Mozilla/5.0 (compatible; film-research-bot/1.0)"
Q = {'face': ['portrait of a man painting 19th century dark', 'pensive man portrait painting', 'self-portrait painting melancholy', 'old man portrait painting Rembrandt'],
 'night': ['moonlight painting 19th century', 'man alone at night painting', 'candlelight painting interior'],
 'crowd': ['crowd painting 19th century', 'street scene painting 19th century crowd', 'market square painting crowd'],
 'sunrise': ['sunrise painting romantic', 'Caspar David Friedrich sunrise', 'morning light landscape painting'],
 'river': ['river painting 19th century landscape', 'stream painting forest', 'Shishkin river painting'],
 'oak': ['oak tree painting', 'Shishkin oak painting', 'Caspar David Friedrich oak', 'lone tree painting landscape'],
 'lake': ['still lake painting 19th century', 'mountain lake reflection painting', 'pond painting calm'],
 'forest': ['Shishkin forest painting', 'forest interior painting 19th century', 'beech forest painting'],
 'garden': ['garden painting 19th century', 'walled garden painting', 'cottage garden painting'],
 'tiger': ['tiger painting', 'tiger Delacroix', 'tiger jungle painting', 'tiger Japanese painting'],
 'seed': ['acorn illustration', 'seedling botanical illustration', 'botanical illustration oak acorn', 'sowing seeds painting'],
 'thinker': ['philosopher painting', 'philosopher in meditation Rembrandt', 'scholar reading painting'],
 'storm': ['storm at sea painting', 'storm landscape painting romantic', 'thunderstorm painting'],
 'mask': ['theatre masks painting', 'masquerade painting', 'Ensor masks painting', 'carnival mask painting'],
 'mirror': ['woman looking in mirror painting', 'man looking in mirror painting', 'reflection mirror painting 19th century'],
 'interior': ['Hammershoi interior', 'quiet interior painting 19th century', 'empty room painting'],
 'theatre': ['actor on stage painting 19th century', 'theatre stage painting', 'Degas theatre painting'],
 'warrior': ['Greek warrior painting', 'Spartan warrior painting', 'Leonidas painting', 'hoplite painting'],
 'insect': ['butterfly metamorphosis illustration', 'Maria Sibylla Merian caterpillar', 'caterpillar chrysalis illustration', 'butterfly botanical plate'],
 'road': ['road landscape painting 19th century', 'path through field painting', 'wanderer road painting'],
 'landscape': ['romantic landscape painting', 'Caspar David Friedrich landscape', 'valley landscape painting 19th century'],
 'window': ['figure at window painting', 'woman at window Friedrich', 'man at window painting'],
 'field': ['rice field painting', 'wheat field painting 19th century', 'peasants field painting Millet'],
 'flower': ['rose painting still life', 'flower still life painting', 'lily painting'],
 'family': ['family portrait painting 19th century', 'family at home painting', 'mother and child painting'],
 'workshop': ['carpenter workshop painting', 'woodworker painting', 'craftsman workshop painting 19th century'],
 'mountain': ['mountain painting romantic', 'Alps painting 19th century', 'mountain peak painting'],
 'rock': ['rocky landscape painting', 'boulders painting', 'rock coast painting'],
 'child': ['child playing painting 19th century', 'children painting 19th century', 'boy portrait painting 19th century'],
 'ruins': ['ruins painting romantic', 'Hubert Robert ruins', 'abbey ruins painting'],
 'salon': ['salon party painting 19th century', 'dinner party painting 19th century', 'drawing room painting'],
 'sage': ['Laozi painting', 'Chinese sage painting', 'Taoist sage scroll', 'Chinese scholar painting'],
 'sculptor': ['sculptor at work painting', 'sculptor studio painting', 'Michelangelo painting portrait'],
 'goats': ['goats painting', 'goat herd painting', 'shepherd goats painting'],
 'school': ['village school painting 19th century', 'schoolroom painting'],
 'china': ['Chinese landscape painting', 'Chinese painting farmer', 'Chinese ink landscape scroll'],
 'writer': ['man writing letter painting', 'poet writing painting', 'writer at desk painting 19th century'],
 'statue': ['marble statue', 'Greek marble statue', 'Michelangelo David'],
 'monk': ['monk meditation painting', 'monk praying painting', 'Buddhist monk painting'],
 'greek': ['ancient Greece painting', 'Greek temple painting', 'Athens Acropolis painting'],
 'music': ['violinist painting', 'pianist painting 19th century', 'musician painting'],
 'seasons': ['autumn tree painting', 'winter tree painting', 'four seasons painting'],
 'train': ['train station painting', 'railway painting 19th century'],
 'feast': ['banquet painting', 'feast painting'],
 'clerk': ['office clerk painting', 'bank clerk painting'],
 'sail': ['sailing ship painting', 'sailboat painting sea'],
 'climber': ['mountain climber painting', 'mountaineers painting'],
 'sea': ['calm sea painting', 'seascape painting'],
 'kitchen': ['kitchen painting 19th century', 'cook kitchen painting'],
 'funeral': ['funeral painting 19th century', 'mourning painting'],
 'letter': ['reading a letter painting', 'letter writer painting'],
 'india': ['Indian painting jungle', 'Indian landscape painting']}
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
            k = f"{th}-c{len([x for x in P.get(th, []) if '-c' in x]) + 1}"
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
