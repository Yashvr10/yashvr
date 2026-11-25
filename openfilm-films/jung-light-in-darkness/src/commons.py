# Public-domain paintings from Wikimedia Commons for the metacognition video. Each query -> up to N files whose licence is public domain; saved as
# assets/photos/<theme>-c<n>.jpg (longest side 2400 px) and added to src/images.json + src/photo-credits.json.
#   python3 src/commons.py [N]
import json, os, re, subprocess, sys, io, time, urllib.parse
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
N = int(sys.argv[1]) if len(sys.argv) > 1 else 4
UA = "Mozilla/5.0 (compatible; film-research-bot/1.0)"
Q = {'thinker': ['philosopher', 'meditation', 'melancholy', 'man reading', 'pensive portrait', 'scholar'], 'anatomy': ['anatomy', 'anatomical drawing', 'skeleton', 'study of a head', 'phrenology'], 'letter': ['man writing', 'letter', 'scholar at desk', 'writing'], 'forge': ['blacksmith', 'forge', 'workshop', 'anvil'], 'crowd': ['crowd', 'street scene', 'procession', 'market crowd'], 'child': ['child portrait', 'boy portrait', 'girl portrait', 'children', 'mother and child'], 'hourglass': ['hourglass', 'vanitas', 'clock'], 'sculptor': ['sculptor', 'Pygmalion', 'sculptor studio'], 'judge': ['court', 'trial', 'judge', 'lawyer'], 'machine': ['machine', 'mill', 'engine', 'mechanism'], 'ghost': ['ghost', 'apparition', 'phantom', 'dream'], 'knight': ['knight', 'armor', 'Saint George', 'soldier'], 'body': ['study of hands', 'figure study drawing', 'hand'], 'fire': ['fire', 'flames', 'burning'], 'fear': ['fear', 'terror', 'despair', 'grief'], 'love': ['lovers', 'embrace', 'mother and child'], 'road': ['road', 'path', 'country road'], 'portrait': ['portrait of a man', 'portrait of a woman', 'self-portrait'], 'night': ['night', 'moonlight', 'sleeping'], 'athlete': ['athlete', 'wrestlers', 'runner', 'boxer'], 'mirror': ['mirror', 'reflection', 'vanity'], 'monk': ['monk', 'meditation', 'prayer'], 'light': ['light', 'sunrise', 'dawn'], 'market': ['market', 'shop']}

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
