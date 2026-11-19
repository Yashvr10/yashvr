# Public-domain paintings from Wikimedia Commons for the Spartan film (v2: the user asked for paintings and archival
# footage instead of statues). Each query -> up to N files whose licence is public domain; saved as
# assets/photos/<theme>-c<n>.jpg (longest side 2400 px) and added to src/images.json + src/photo-credits.json.
#   python3 src/commons.py [N]
import json, os, re, subprocess, sys, io, time, urllib.parse
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
N = int(sys.argv[1]) if len(sys.argv) > 1 else 4
UA = "Mozilla/5.0 (compatible; film-research-bot/1.0)"
Q = {
 "lonely": ["melancholy man painting 19th century", "man alone at window painting", "lonely man interior painting", "Hammershoi interior figure"],
 "face": ["portrait of a man painting 19th century dark", "self-portrait young man painting", "pensive man portrait painting"],
 "clerk": ["office clerks painting 19th century", "clerk at desk painting", "bank clerk painting", "accountant painting 19th century"],
 "crowd": ["crowd painting 19th century street", "Caillebotte Paris street rainy day", "factory workers painting 19th century", "commuters painting"],
 "night": ["moonlight painting 19th century", "man awake at night candle painting", "night interior painting candle"],
 "storm": ["storm at sea painting", "shipwreck painting romantic", "Turner snow storm steamboat"],
 "knight": ["crusader knight painting", "knight praying sword painting", "knight in armour painting", "medieval knight battle painting"],
 "explorer": ["explorer expedition painting 19th century", "mountaineers expedition painting", "traveller wanderer painting", "Arctic expedition painting"],
 "boys": ["schoolboys painting 19th century", "village school painting 19th century", "boy portrait painting 19th century"],
 "school": ["schoolmaster painting", "punished schoolboy painting", "classroom painting 19th century"],
 "alpine": ["Alps painting 19th century", "Calame alpine landscape painting", "Gabriel Loppe painting", "Swiss Alps painting romantic", "Edward Theodore Compton painting"],
 "sunrise": ["sunrise mountains painting", "Caspar David Friedrich morning mountains", "dawn in the Alps painting"],
 "camp": ["campfire painting 19th century", "bivouac painting", "mountain camp painting"],
 "gentleman": ["portrait of a gentleman in evening dress painting", "Sargent portrait man", "elegant gentleman portrait 19th century", "Boldini portrait man"],
 "duel": ["duel painting 19th century", "pistol duel painting", "fencing duel painting"],
 "writer": ["man writing at desk painting 19th century", "scholar at desk painting", "man reading letter painting"],
 "monk": ["monk praying painting", "hermit meditation painting", "monk at dawn painting"],
 "feast": ["dinner party painting 19th century", "friends drinking tavern painting", "Renoir luncheon of the boating party", "merry company painting"],
 "sail": ["sailing ship painting", "ship in rough sea painting", "sailing boat painting romantic"],
 "horse": ["cavalry charge painting", "horseman leaping painting", "Gericault horse painting", "Napoleon crossing the Alps"],
 "train": ["Turner Rain Steam and Speed", "locomotive painting 19th century", "Monet Gare Saint-Lazare"],
 "pray": ["man praying painting", "knight vigil praying painting", "prayer painting 19th century"],
 "climber": ["mountain climber painting", "mountaineering painting 19th century", "climbers on a glacier painting", "Matterhorn first ascent painting", "rope team glacier painting"],
 "hut": ["mountain hut painting", "alpine hut painting", "chalet in the Alps painting", "cabin in the snow painting"],
 "stars": ["Van Gogh starry night", "night sky stars painting", "starry night painting 19th century"],
 "nietzsche": ["Friedrich Nietzsche photograph", "Nietzsche portrait Munch"],
}
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
