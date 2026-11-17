# Re-downloads the Cleveland Museum of Art paintings (type "Painting" only) whose originals were deleted to save disk.
import json, os, subprocess, io, concurrent.futures as cf
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
P = json.load(open("src/images.json")); C = json.load(open("src/photo-credits.json"))
ks = [k for v in P.values() for k in v if C.get(k, {}).get("type") == "Painting" and not os.path.exists(f"assets/photos/{k}.jpg")]
def get(k):
    a = json.loads(subprocess.check_output(["curl", "-s", "--max-time", "60", f"https://openaccess-api.clevelandart.org/api/artworks/{C[k]['id']}"]))["data"]
    u = a["images"]["print"]["url"]
    im = Image.open(io.BytesIO(subprocess.check_output(["curl", "-sL", "--max-time", "120", u]))).convert("RGB"); im.thumbnail((2400, 2400)); im.save(f"assets/photos/{k}.jpg", quality=88)
    return k
with cf.ThreadPoolExecutor(6) as ex:
    for f in cf.as_completed([ex.submit(get, k) for k in ks]):
        try: f.result()
        except Exception as e: print("fail", e)
print(len(ks), "paintings re-downloaded")
