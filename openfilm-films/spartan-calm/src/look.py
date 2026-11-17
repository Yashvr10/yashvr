# The user's reference look (reel Df1_LbRINpq / "They say ego, I say standards"): every picture in gritty, high-contrast
# black and white (crushed blacks, coarse grain, slightly pixelated), and the face inside a solid red square that tints
# what is under it (multiply).
# Writes, for every artwork in src/images.json:
#   assets/photos169/<k>.jpg  1920x1080 (full-frame shots)       assets/panels/<k>.jpg  640x1080 (the side-by-side panels)
# and src/faces.json (the face found in each, for the record). Faces: OpenCV Haar cascades (frontal, then profile both ways);
# where none is found the picture gets no square.
#   python3 src/look.py [key ...]
import json, os, sys, numpy as np, cv2
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
os.makedirs("assets/photos169", exist_ok=True); os.makedirs("assets/panels", exist_ok=True)
CV = cv2.data.haarcascades
FRONT = [cv2.CascadeClassifier(CV + n) for n in ("haarcascade_frontalface_default.xml", "haarcascade_frontalface_alt2.xml")]
PROF = cv2.CascadeClassifier(CV + "haarcascade_profileface.xml")
DARK = np.array([118, 10, 10], np.float32) / 255; LIGHT = np.array([240, 128, 116], np.float32) / 255

def face(gray):
    """Largest face (x, y, w, h) in the image, or None."""
    H, W = gray.shape; s = 900 / max(H, W); g = cv2.equalizeHist(cv2.resize(gray, (round(W * s), round(H * s))))
    mn = max(28, int(min(g.shape) * 0.07)); found = []
    for c in FRONT: found += [tuple(f) for f in c.detectMultiScale(g, 1.08, 6, minSize=(mn, mn))]
    if not found:
        found += [tuple(f) for f in PROF.detectMultiScale(g, 1.08, 6, minSize=(mn, mn))]
        fl = cv2.flip(g, 1)
        found += [(g.shape[1] - x - w, y, w, h) for x, y, w, h in PROF.detectMultiScale(fl, 1.08, 6, minSize=(mn, mn))]
    if not found: return None
    x, y, w, h = max(found, key=lambda f: f[2] * f[3])
    return [x / s, y / s, w / s, h / s]

def grit(rgb, seed):
    """Gritty photocopy black and white, slightly pixelated."""
    g = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32)
    lo, hi = np.percentile(g, 2), np.percentile(g, 98.5); g = np.clip((g - lo) / max(1, hi - lo), 0, 1)
    g = 1 / (1 + np.exp(-(g - 0.5) * 7.5)); g = (g - g.min()) / max(1e-6, g.max() - g.min())          # hard S-curve, crushed blacks
    H, W = g.shape; small = cv2.resize(g, (W // 3, H // 3), interpolation=cv2.INTER_AREA)               # pixel blocks of 3 px
    rng = np.random.default_rng(seed); small = small + rng.normal(0, 0.09, small.shape)                  # coarse grain
    small = np.round(np.clip(small, 0, 1) * 7) / 7                                                        # posterised, photocopy steps
    g = cv2.resize(small, (W, H), interpolation=cv2.INTER_NEAREST)
    g = np.clip(g + rng.normal(0, 0.03, g.shape), 0, 1)
    return np.repeat(g[..., None], 3, 2)

def render(im, box, fc, size, seed):
    """Crop box from the artwork, resize to size, grit it, put the red square over the face."""
    x0, y0, x1, y1 = box; W, H = size
    crop = np.asarray(im.crop(box).resize(size, Image.LANCZOS))
    out = grit(crop, seed)
    if fc:
        sx = W / (x1 - x0); fx, fy, fw, fh = (fc[0] - x0) * sx, (fc[1] - y0) * sx, fc[2] * sx, fc[3] * sx
        side = min(max(fw, fh) * 1.4, W * 0.8, H * 0.62); cx, cy = fx + fw / 2, fy + fh * 0.52
        a, b = int(max(0, cx - side / 2)), int(max(0, cy - side / 2)); c, d = int(min(W, a + side)), int(min(H, b + side))
        if c - a > 40 and d - b > 40:
            sq = out[b:d, a:c] ** 1.25; out[b:d, a:c] = DARK + sq * (LIGHT - DARK)   # a red tint: blacks go deep red, whites pale pink
    return Image.fromarray((out * 255).astype(np.uint8))

def box_for(W, H, ar, fc):
    """The largest window of aspect ar, centred on the face (or the upper middle when there is none)."""
    if W / H > ar: h = H; w = round(H * ar)
    else: w = W; h = round(W / ar)
    cx, cy = (fc[0] + fc[2] / 2, fc[1] + fc[3] / 2) if fc else (W / 2, H * 0.42)
    x0 = int(np.clip(cx - w / 2, 0, W - w)); y0 = int(np.clip(cy - h * 0.45, 0, H - h))
    return (x0, y0, x0 + w, y0 + h)

P = json.load(open("src/images.json"))
keys = sys.argv[1:] or sorted({k for v in P.values() for k in v})
OK = set(json.load(open("src/faces-ok.json"))) if os.path.exists("src/faces-ok.json") else None
F = json.load(open("src/faces.json")) if os.path.exists("src/faces.json") else {}
for i, k in enumerate(keys):
    o1, o2 = f"assets/photos169/{k}.jpg", f"assets/panels/{k}.jpg"
    if os.path.exists(o1) and os.path.exists(o2) and len(sys.argv) < 2: continue
    im = Image.open(f"assets/photos/{k}.jpg").convert("RGB"); W, H = im.size
    fc = face(cv2.cvtColor(np.asarray(im), cv2.COLOR_RGB2GRAY))
    if OK is not None and k not in OK: fc = None        # checked by eye: detections on vases, torsos and landscapes dropped
    F[k] = fc
    seed = abs(hash(k)) % 10000
    render(im, box_for(W, H, 16 / 9, fc), fc, (1920, 1080), seed).save(o1, quality=88)
    render(im, box_for(W, H, 640 / 1080, fc), fc, (640, 1080), seed + 1).save(o2, quality=88)
    if i % 20 == 0: json.dump(F, open("src/faces.json", "w"), indent=0); print(i, k, "face" if fc else "-", flush=True)
json.dump(F, open("src/faces.json", "w"), indent=0)
print(sum(1 for v in F.values() if v), "faces in", len(F))
