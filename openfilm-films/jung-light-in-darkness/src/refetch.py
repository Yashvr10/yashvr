# Re-download the full-size originals of every picture in src/images.json (from its source in src/photo-credits.json)
# into assets/photos/<key>.jpg, so src/look.py can re-crop them.
#   python3 src/refetch.py
import json, os, re, subprocess, io, time
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
UA = "Mozilla/5.0 (compatible; film-research/1.0)"
def get(u, raw=False):
    for i in range(4):
        try:
            b = subprocess.check_output(["curl", "-sL", "-A", UA, "--max-time", "90", u])
            return b if raw else json.loads(b)
        except Exception: time.sleep(2 * (i + 1))
    return b"" if raw else {}
P = json.load(open("src/images.json")); C = json.load(open("src/photo-credits.json")); os.makedirs("assets/photos", exist_ok=True)
for k in sorted({k for v in P.values() for k in v}):
    if os.path.exists(f"assets/photos/{k}.jpg"): continue
    s = C[k]["source"]
    try:
        if "clevelandart" in s:
            u = get("https://openaccess-api.clevelandart.org/api/artworks/" + s.rsplit("/", 1)[1])["data"]["images"]["print"]["url"]
        else:
            u = f"https://www.artic.edu/iiif/2/{get('https://api.artic.edu/api/v1/artworks/' + s.rsplit('/', 1)[1] + '?fields=image_id')['data']['image_id']}/full/1686,/0/default.jpg"
        im = Image.open(io.BytesIO(get(u, raw=True))).convert("RGB"); im.thumbnail((2400, 2400)); im.save(f"assets/photos/{k}.jpg", quality=88)
        print(k, im.size, flush=True)
    except Exception as e: print("FAIL", k, e, flush=True)
