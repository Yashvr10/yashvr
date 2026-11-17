# v3 look (the user: "only paintings, grainy but not black and white"): each painting in colour, a touch more contrast,
# and fine film grain. Writes assets/photos169/<k>.jpg (1920x1080, the window centred on the upper middle or on a face)
# and assets/grid/<k>.jpg (the whole painting, longest side 900 px, for the collage cards). No red squares.
#   python3 src/look_color.py
import json, os, numpy as np, cv2
from PIL import Image, ImageEnhance
Image.MAX_IMAGE_PIXELS = None
CV = cv2.data.haarcascades; FR = cv2.CascadeClassifier(CV + "haarcascade_frontalface_default.xml")
P = json.load(open("src/images.json"))
for k in sorted({k for v in P.values() for k in v}):
    src = f"assets/photos/{k}.jpg"
    if not os.path.exists(src): continue
    im = Image.open(src).convert("RGB"); W, H = im.size
    g = cv2.cvtColor(np.asarray(im.resize((W // 4, H // 4))), cv2.COLOR_RGB2GRAY)
    f = FR.detectMultiScale(cv2.equalizeHist(g), 1.08, 7, minSize=(max(20, min(g.shape) // 10),) * 2)
    cx, cy = (W / 2, H * 0.42)
    if len(f): x, y, w, h = max(f, key=lambda r: r[2] * r[3]); cx, cy = (x + w / 2) * 4, (y + h / 2) * 4
    if W / H > 16 / 9: h2, w2 = H, round(H * 16 / 9)
    else: w2, h2 = W, round(W * 9 / 16)
    x0 = int(np.clip(cx - w2 / 2, 0, W - w2)); y0 = int(np.clip(cy - h2 * 0.45, 0, H - h2))
    def grade(img, size):
        img = ImageEnhance.Contrast(img).enhance(1.12); img = ImageEnhance.Color(img).enhance(1.08)
        a = np.asarray(img).astype(np.float32) / 255
        rng = np.random.default_rng(abs(hash(k)) % 9999)
        n = rng.normal(0, 0.075, (size[1] // 2, size[0] // 2)).astype(np.float32)
        n = cv2.resize(n, size, interpolation=cv2.INTER_LINEAR)[..., None]           # grain about 2 px across
        a = np.clip(a + n * (0.55 + 0.45 * (1 - a.mean(2, keepdims=True))), 0, 1)     # a little stronger in the shadows
        return Image.fromarray((a * 255).astype(np.uint8))
    grade(im.crop((x0, y0, x0 + w2, y0 + h2)).resize((1920, 1080), Image.LANCZOS), (1920, 1080)).save(f"assets/photos169/{k}.jpg", quality=88)
    gi = im.copy(); gi.thumbnail((900, 900)); grade(gi, gi.size).save(f"assets/grid/{k}.jpg", quality=88)
print("done")
