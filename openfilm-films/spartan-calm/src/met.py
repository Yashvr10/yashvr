# Adds CC0 Greek and Roman (and Near Eastern) works from The Met Open Access to the theme pools.
import json, os, subprocess, io, concurrent.futures as cf, urllib.parse
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
Q = {"hoplite": [(13, "warrior"), (13, "hoplite")], "helmet": [(13, "helmet")], "shield": [(13, "shield")], "spear": [(13, "spear")],
     "battle": [(13, "battle"), (13, "amazonomachy")], "athlete": [(13, "athlete"), (13, "runner"), (13, "discus")],
     "wrestle": [(13, "wrestlers"), (13, "boxer")], "march": [(13, "warriors")], "archer": [(13, "archer")], "mother": [(13, "mother"), (13, "grave stele")],
     "boy": [(13, "youth"), (13, "boy")], "persia": [(3, "persian"), (3, "achaemenid")], "statue": [(13, "head of a man"), (13, "marble statue")],
     "hunger": [(13, "old man")], "feet": [(13, "foot")], "hands": [(13, "hand")], "winter": [(13, "cloak")], "reeds": [(10, "papyrus")]}
get = lambda u: json.loads(subprocess.check_output(["curl", "-s", "--max-time", "60", u]))
P = json.load(open("src/images.json")); C = json.load(open("src/photo-credits.json"))
seen = {str(c["id"]) for c in C.values()}; jobs = []
def obj(i):
    try: return get(f"https://collectionapi.metmuseum.org/public/collection/v1/objects/{i}")
    except Exception: return {}
for th, qs in Q.items():
    for dept, q in qs:
        ids = get(f"https://collectionapi.metmuseum.org/public/collection/v1.1/search?hasImages=true&departmentId={dept}&limit=30&q={urllib.parse.quote(q)}").get("objectIDs") or []
        with cf.ThreadPoolExecutor(8) as ex: objs = list(ex.map(obj, ids[:30]))
        got = 0
        for o in objs:
            if got >= 6 or not o.get("isPublicDomain") or not o.get("primaryImage") or str(o["objectID"]) in seen: continue
            seen.add(str(o["objectID"])); got += 1
            k = f"{th}-m{o['objectID']}"; P.setdefault(th, []).append(k)
            C[k] = dict(id=o["objectID"], title=o.get("title"), artist=o.get("artistDisplayName", ""), date=o.get("objectDate"), url=o.get("objectURL"), license="CC0 (The Met Open Access)")
            jobs.append((k, o["primaryImage"]))
def dl(job):
    k, u = job; out = f"assets/photos/{k}.jpg"
    im = Image.open(io.BytesIO(subprocess.check_output(["curl", "-sL", "--max-time", "120", u]))).convert("RGB"); im.thumbnail((2400, 2400)); im.save(out, quality=88)
with cf.ThreadPoolExecutor(8) as ex:
    for f in [ex.submit(dl, j) for j in jobs]:
        try: f.result()
        except Exception as e: print("fail", e)
for th in P: P[th] = [k for k in P[th] if os.path.exists(f"assets/photos/{k}.jpg")]
json.dump(P, open("src/images.json", "w"), indent=1); json.dump(C, open("src/photo-credits.json", "w"), indent=1)
print({t: len(v) for t, v in P.items()}, sum(map(len, P.values())))
