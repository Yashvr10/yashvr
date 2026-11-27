# Look for "Why Believing in Yourself Feels So Lonely": every picture made 1920x1080 without cutting off a face, then a warm,
# dark, slightly contrasty grade with film grain (black-and-white prints stay black and white).
#   faces     found with OpenCV's YuNet detector (src/models, from opencv_zoo, MIT licence), plus the Haar frontal and
#             profile cascades as a back-up; each face gets room above (hair, hat) and below (chin, collar).
#   wide      pictures (wider than 16:9) lose only their sides, and the crop is slid to keep every face in.
#   landscape pictures (1.2:1 to 16:9) are cropped top and bottom only when every face still fits with room to spare.
#   the rest  (tall or square pictures, or faces that would not fit) are shown whole, full height, centred on a blurred,
#             darkened copy of themselves, so nothing is cut.
# Writes assets/photos169/<k>.jpg and src/framing.json (how each picture was framed; checked in a contact sheet).
#   python3 src/look.py
import json, os, numpy as np, cv2
from PIL import Image, ImageEnhance, ImageFilter
Image.MAX_IMAGE_PIXELS = None
FW, FH = 1920, 1080
YN = cv2.FaceDetectorYN.create("src/models/face_detection_yunet_2023mar.onnx", "", (320, 320), 0.62, 0.3, 5000)
FR = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
PR = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_profileface.xml")
def faces(im):
    W, H = im.size; s = 1024 / max(W, H); w, h = round(W * s), round(H * s)
    bgr = cv2.cvtColor(np.asarray(im.resize((w, h))), cv2.COLOR_RGB2BGR); out = []
    YN.setInputSize((w, h)); _, f = YN.detect(bgr)
    for r in (f if f is not None else []): out.append(r[:4] / s)
    g = cv2.equalizeHist(cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)); m = (max(20, min(w, h) // 14),) * 2
    for casc, flip in ((FR, False), (PR, False), (PR, True)):
        gg = cv2.flip(g, 1) if flip else g
        for x, y, ww, hh in casc.detectMultiScale(gg, 1.08, 8, minSize=m):
            if flip: x = w - x - ww
            out.append(np.array([x, y, ww, hh]) / s)
    boxes = []
    for x, y, ww, hh in out:   # room above for hair and hats, below for the chin and collar
        boxes.append((max(0, x - 0.35 * ww), max(0, y - 0.7 * hh), min(W, x + 1.35 * ww), min(H, y + 1.45 * hh)))
    return boxes
def union(b): return (min(x[0] for x in b), min(x[1] for x in b), max(x[2] for x in b), max(x[3] for x in b))
def trim(im):   # cut dark scan borders (rows/columns that are nearly black and flat) off each edge
    g = np.asarray(im.convert("L")).astype(np.float32); H, W = g.shape
    dark = lambda v: v.mean() < 28 and v.std() < 14
    t, b, l, r = 0, H, 0, W
    while t < H * 0.12 and dark(g[t, l:r]): t += 1
    while b > H * 0.88 and dark(g[b - 1, l:r]): b -= 1
    while l < W * 0.12 and dark(g[t:b, l]): l += 1
    while r > W * 0.88 and dark(g[t:b, r - 1]): r -= 1
    return im.crop((l + (4 if l else 0), t + (4 if t else 0), r - (4 if r < W else 0), b - (4 if b < H else 0))) if (t, b, l, r) != (0, H, 0, W) else im
def frame(im):
    im = trim(im); W, H = im.size; a = W / H; b = faces(im); u = union(b) if b else None
    if a >= 16 / 9:                                           # wide: lose the sides only
        w2 = round(H * 16 / 9); cx = (u[0] + u[2]) / 2 if u else W / 2
        x0 = int(np.clip(cx - w2 / 2, 0, W - w2))
        if u: x0 = int(np.clip(x0, max(0, u[2] - w2), min(W - w2, u[0])))   # keep every face in when they fit
        x0 = int(np.clip(x0, 0, W - w2))
        if u and (u[0] < x0 or u[2] > x0 + w2): return panel(im), "whole (faces spread wide)", len(b)
        return im.crop((x0, 0, x0 + w2, H)).resize((FW, FH), Image.LANCZOS), "crop sides", len(b)
    if a >= 1.2:                                              # landscape: lose top and bottom only if faces fit
        h2 = round(W * 9 / 16)
        if not u: return im.crop((0, round((H - h2) * 0.4), W, round((H - h2) * 0.4) + h2)).resize((FW, FH), Image.LANCZOS), "crop top/bottom", 0
        if u[3] - u[1] <= h2 * 0.9:
            y0 = int(np.clip((u[1] + u[3]) / 2 - h2 * 0.45, 0, H - h2))
            y0 = int(np.clip(y0, max(0, u[3] - h2 + 0.04 * h2), min(H - h2, u[1] - 0.04 * h2)))
            y0 = int(np.clip(y0, 0, H - h2))
            return im.crop((0, y0, W, y0 + h2)).resize((FW, FH), Image.LANCZOS), "crop top/bottom (faces kept)", len(b)
    return panel(im), "whole", len(b)
def panel(im):
    W, H = im.size; s = min(FH / H, FW * 0.96 / W); pw, ph = round(W * s), round(H * s)
    bs = max(FW / W, FH / H); bg = im.resize((round(W * bs), round(H * bs)), Image.LANCZOS)
    bg = bg.crop(((bg.width - FW) // 2, (bg.height - FH) // 2, (bg.width - FW) // 2 + FW, (bg.height - FH) // 2 + FH))
    bg = ImageEnhance.Brightness(bg.filter(ImageFilter.GaussianBlur(48))).enhance(0.42)
    sh = Image.new("L", (FW, FH), 0); sh.paste(255, ((FW - pw) // 2 - 10, (FH - ph) // 2, (FW + pw) // 2 + 10, (FH + ph) // 2))
    bg.paste(Image.new("RGB", (FW, FH), 0), (0, 0), sh.filter(ImageFilter.GaussianBlur(28)).point(lambda v: int(v * 0.55)))
    bg.paste(im.resize((pw, ph), Image.LANCZOS), ((FW - pw) // 2, (FH - ph) // 2)); return bg
WHOLE = {"mask-c12"}                                                     # crops checked on a contact sheet; these cut a figure
P = json.load(open("src/images.json")); F = {}
for k in sorted({k for v in P.values() for k in v if not k.startswith("j-")}):   # j- pictures come already framed from the Jung film
    im = Image.open(f"assets/photos/{k}.jpg").convert("RGB")
    c, how, nf = (panel(im), "whole (by hand)", 0) if k in WHOLE else frame(im); F[k] = dict(how=how, faces=nf)
    a = np.asarray(c).astype(np.float32) / 255
    bw = np.abs(a[..., 0] - a[..., 2]).mean() < 0.035                        # a black-and-white print
    c = ImageEnhance.Contrast(c).enhance(1.14)
    if not bw: c = ImageEnhance.Color(c).enhance(0.92)
    a = np.asarray(c).astype(np.float32) / 255
    if not bw: a = a * np.array([1.04, 0.99, 0.90])                            # warm
    a = a * 0.86                                                               # dark
    rng = np.random.default_rng(abs(hash(k)) % 9999)
    n = cv2.resize(rng.normal(0, 0.075, (540, 960)).astype(np.float32), (FW, FH))[..., None]
    a = np.clip(a + n * (0.5 + 0.5 * (1 - a.mean(2, keepdims=True))), 0, 1)
    Image.fromarray((a * 255).astype(np.uint8)).save(f"assets/photos169/{k}.jpg", quality=88)
    print(k, how, nf, flush=True)
json.dump(F, open("src/framing.json", "w"), indent=1)
