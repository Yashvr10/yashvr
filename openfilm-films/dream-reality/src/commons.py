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
 "thoreau": ["Henry David Thoreau daguerreotype", "Walden Pond 19th century", "Thoreau cabin Walden"],
 "castle": ["Thomas Cole Voyage of Life Youth", "Thomas Cole The Architect's Dream", "castle in the clouds painting", "Thomas Cole Course of Empire"],
 "dream": ["dreamer painting 19th century", "sleeping man painting", "night dream painting romantic"],
 "wright": ["Wright brothers first flight 1903", "Wright glider 1902 Kitty Hawk", "Wright brothers wind tunnel", "Wright Cycle Company shop", "Orville Wright Wilbur Wright portrait", "Wright Flyer 1903 photograph"],
 "langley": ["Samuel Pierpont Langley portrait", "Langley Aerodrome 1903 Potomac", "Langley Aerodrome houseboat"],
 "lilienthal": ["Otto Lilienthal glider flight", "Lilienthal gliding 1895"],
 "dunes": ["Kitty Hawk 1900 dunes", "Kill Devil Hills 1903", "sand dunes painting"],
 "storm": ["shipwreck painting romantic", "storm at sea painting", "sailing ship storm painting"],
 "port": ["harbour sailing ships painting 19th century", "port at sunrise painting", "lighthouse painting"],
 "work": ["Joseph Wright of Derby experiment", "workshop painting 19th century", "blacksmith painting", "stonemason painting"],
 "build": ["building a house painting 19th century", "masons building painting", "cathedral construction painting"],
 "stoic": ["Marcus Aurelius painting", "Seneca painting death", "philosopher painting study"],
 "face": ["portrait of a man painting 19th century dark", "self-portrait Rembrandt", "old man portrait painting"],
 "morning": ["sunrise painting romantic", "man looking at sea painting Friedrich"],
 "night": ["moonlight painting 19th century", "night landscape painting romantic", "man reading by candlelight painting"],
 "crowd": ["newspaper readers painting 19th century", "crowd painting 19th century"],
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
