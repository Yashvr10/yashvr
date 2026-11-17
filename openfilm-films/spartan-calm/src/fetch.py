# Fetches CC0 artworks from the Cleveland Museum of Art Open Access API into theme pools.
# Writes assets/photos/<theme>-<n>.jpg (longest side 2400 px) and src/images.json {theme: [keys]}, src/photo-credits.json.
#   python3 src/fetch.py [per_query]
import json, os, sys, subprocess, urllib.parse, io, concurrent.futures as cf
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
N = int(sys.argv[1]) if len(sys.argv) > 1 else 5
Q = {
 "hoplite": ["hoplite", "greek warrior", "spartan", "warrior"], "helmet": ["corinthian helmet", "greek helmet", "helmet"],
 "shield": ["shield", "greek shield"], "spear": ["spear", "lance"], "battle": ["battle", "greek battle", "combat"],
 "statue": ["greek statue", "marble head", "roman bust"], "face": ["portrait of a man", "head of a man", "face"],
 "hands": ["hands", "hand"], "boy": ["boy", "youth", "kouros"], "athlete": ["athlete", "discus", "runner", "greek athlete"],
 "wrestle": ["wrestlers", "wrestling", "pankration"], "march": ["army marching", "soldiers", "troops"],
 "greece": ["greek temple", "acropolis", "greek landscape", "ruins"], "feet": ["feet", "barefoot"], "hunger": ["beggar", "hunger", "poverty"],
 "river": ["river", "riverbank"], "reeds": ["reeds", "marsh"], "persia": ["persian", "xerxes", "persepolis", "achaemenid"],
 "mountain": ["mountain pass", "cliffs", "gorge"], "archer": ["archer", "bow and arrow", "archers"], "sun": ["sun", "sunset", "eclipse"],
 "storm": ["storm", "tempest", "shipwreck"], "winter": ["winter", "snow"], "mother": ["mother and son", "farewell", "mother and child"],
 "orator": ["orator", "speech", "philosopher"], "crowd": ["crowd", "assembly"], "scholar": ["scholar", "study"],
 "sea": ["sea", "waves"], "door": ["door", "doorway"],
}
TYPES = {"Painting", "Photograph", "Print", "Drawing", "Sculpture"}
def api(q):
    u = "https://openaccess-api.clevelandart.org/api/artworks/?" + urllib.parse.urlencode(dict(q=q, cc0=1, has_image=1, limit=40))
    return json.loads(subprocess.check_output(["curl", "-s", "--max-time", "60", u]))["data"]
pools = json.load(open("src/images.json")) if os.path.exists("src/images.json") else {}
credits = json.load(open("src/photo-credits.json")) if os.path.exists("src/photo-credits.json") else {}
seen = {c["id"] for c in credits.values()}
jobs = []
for th, qs in Q.items():
    if pools.get(th): continue
    pools[th] = []
    for q in qs:
        got = 0
        for a in api(q):
            if got >= N or a["id"] in seen or a.get("type") not in TYPES: continue
            im = (a.get("images") or {}).get("print") or {}
            if not im.get("url") or int(im.get("width") or 0) < 1500 and int(im.get("height") or 0) < 1500: continue
            seen.add(a["id"]); got += 1
            k = f"{th}-{len(pools[th]) + 1}"; pools[th].append(k)
            credits[k] = dict(id=a["id"], title=a["title"], artist=(a.get("creators") or [{}])[0].get("description", ""), date=a.get("creation_date"),
                              type=a["type"], url=a.get("url"), license="CC0 (Cleveland Museum of Art Open Access)")
            jobs.append((k, im["url"]))
def get(job):
    k, url = job; out = f"assets/photos/{k}.jpg"
    if os.path.exists(out): return k
    b = subprocess.check_output(["curl", "-sL", "--max-time", "120", url])
    im = Image.open(io.BytesIO(b)).convert("RGB"); im.thumbnail((2400, 2400)); im.save(out, quality=88)
    return k
with cf.ThreadPoolExecutor(8) as ex:
    for f in cf.as_completed([ex.submit(get, j) for j in jobs]):
        try: f.result()
        except Exception as e: print("fail", e)
for th in pools: pools[th] = [k for k in pools[th] if os.path.exists(f"assets/photos/{k}.jpg")]
json.dump(pools, open("src/images.json", "w"), indent=1); json.dump(credits, open("src/photo-credits.json", "w"), indent=1)
print({th: len(v) for th, v in pools.items()}, sum(len(v) for v in pools.values()))
