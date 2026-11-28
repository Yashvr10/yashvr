# Public-domain (CC0) art for Carl Jung: The Light in the Darkness from museum open-access collections, used because Wikimedia
# rate-limits this machine: the Cleveland Museum of Art (full resolution) first, the Art Institute of Chicago as a fallback.
# Themes and queries come from Q in src/commons.py. Each theme gets up to N pictures, saved as assets/photos/<theme>-c<n>.jpg
# (longest side 2400 px), listed in src/images.json, credited in src/photo-credits.json.
#   python3 src/museums.py [N]
import json, os, re, subprocess, sys, io, time, urllib.parse, ast
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
N = int(sys.argv[1]) if len(sys.argv) > 1 else 4
src = open("src/commons.py").read(); Q = ast.literal_eval(src[src.index("Q = ") + 4:src.index("\ndef api(")])
WANT = {}
if len(sys.argv) > 2:                     # second pass: {theme: [how many more, [queries]]}, paintings and prints only
    Q2 = json.load(open(sys.argv[2])); Q = {k: v[1] for k, v in Q2.items()}; WANT = {k: v[0] for k, v in Q2.items()}
UA = "Mozilla/5.0 (compatible; film-research/1.0)"
def get(u, raw=False):
    for i in range(4):
        try:
            b = subprocess.check_output(["curl", "-sL", "-A", UA, "--max-time", "90", u])
            return b if raw else json.loads(b)
        except Exception: time.sleep(2 * (i + 1))
    return b"" if raw else {}
def save(k, url):
    b = get(url, raw=True)
    im = Image.open(io.BytesIO(b)).convert("RGB")
    if min(im.size) < 700: raise ValueError("too small")
    im.thumbnail((2400, 2400)); im.save(f"assets/photos/{k}.jpg", quality=88)
P = json.load(open("src/images.json")); C = json.load(open("src/photo-credits.json"))
seen = {c.get("source") for c in C.values()} | set(json.load(open("src/rejected.json")) if os.path.exists("src/rejected.json") else [])
KIND = re.compile(r"paint|print|drawing|engrav|etching|lithograph|canvas|panel|woodcut", re.I)   # pictures only, no objects or books
FAR = re.compile(r"India|Persia|Iran|China|Chinese|Japan|Korea|Mughal|Tibet|Nepal|Islamic|Ottoman|Thai|Indones", re.I)   # European traditions, except for the themes in OPEN
OPEN = {'mandala', 'sage', 'cosmos', 'god'}
import collections
uses = collections.Counter(t for x in json.load(open("src/scenes.json"))["scenes"] if "th" in x for t in x["th"])
for th, qs in Q.items():
    have = len(P.get(th, [])); NT = have + WANT[th] if WANT else min(8, max(N, round(uses[th] * 0.45)))
    for q in qs:
        if have >= NT: break
        # Cleveland Museum of Art (CC0, full-size "print" images)
        r = get("https://openaccess-api.clevelandart.org/api/artworks/?" + urllib.parse.urlencode(dict(q=q, cc0=1, has_image=1, limit=25)))
        for x in (r or {}).get("data", []):
            if have >= NT: break
            img = ((x.get("images") or {}).get("print") or {}); u = x.get("url") or f"https://clevelandart.org/art/{x.get('accession_number')}"
            if not img.get("url") or u in seen or min(int(img.get("width") or 0), int(img.get("height") or 0)) < 1000: continue
            if not KIND.search(str(x.get("type", ""))) or re.search(r"mask|sculpt|object|textile|book", str(x.get("type", "")), re.I) or (th not in OPEN and FAR.search(" ".join(x.get("culture") or []))): continue
            k = f"{th}-c{max([int(f.rsplit('-c', 1)[1][:-4]) for f in os.listdir('assets/photos') + os.listdir('assets/photos169') if f.startswith(th + '-c')] or [0]) + 1}"
            try: save(k, img["url"])
            except Exception as e: print("fail", x.get("id"), e); continue
            seen.add(u); have += 1; P.setdefault(th, []).append(k)
            cr = (x.get("creators") or [{}])[0].get("description") or "Unknown"
            C[k] = dict(title=(x.get("title") or "")[:160], artist=cr[:80], date=x.get("creation_date", ""),
                        license="Public domain (CC0, Cleveland Museum of Art)", source=u, kind=x.get("type", ""))
            time.sleep(0.3)
        if have >= NT: break
        # Art Institute of Chicago
        r = get("https://api.artic.edu/api/v1/artworks/search?" + urllib.parse.urlencode({"q": q, "query[term][is_public_domain]": "true", "limit": 20,
                "fields": "id,title,artist_title,date_display,image_id,classification_title,thumbnail,place_of_origin"}))
        for x in (r or {}).get("data", []):
            if have >= NT: break
            u = f"https://www.artic.edu/artworks/{x['id']}"
            if not KIND.search(str(x.get('classification_title', ''))) or (th not in OPEN and FAR.search(str(x.get('place_of_origin', '')))) or not x.get("image_id") or u in seen or ((x.get("thumbnail") or {}).get("width") or 0) < 1200: continue
            k = f"{th}-c{max([int(f.rsplit('-c', 1)[1][:-4]) for f in os.listdir('assets/photos') + os.listdir('assets/photos169') if f.startswith(th + '-c')] or [0]) + 1}"
            try: save(k, f"https://www.artic.edu/iiif/2/{x['image_id']}/full/1686,/0/default.jpg")
            except Exception as e: print("fail", x["id"], e); continue
            seen.add(u); have += 1; P.setdefault(th, []).append(k)
            C[k] = dict(title=x.get("title", "")[:160], artist=x.get("artist_title") or "Unknown", date=x.get("date_display", ""),
                        license="Public domain (CC0, Art Institute of Chicago)", source=u, kind=x.get("classification_title", ""))
            time.sleep(0.3)
    print(th, have, flush=True)
    json.dump(P, open("src/images.json", "w"), indent=1); json.dump(C, open("src/photo-credits.json", "w"), indent=1)
print(sum(len(v) for v in P.values()), "pictures")
