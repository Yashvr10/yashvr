# Look for "How to Make Your Dream a Reality": each picture cropped to 16:9 (centred on a face when one is found),
# a warm, dark, slightly contrasty grade with fine film grain (the reference video's look; black-and-white photographs stay
# black and white), and, where a figure is found by Robust Video Matting, a cut-out of that figure
# (assets/cutouts/<k>.png) so the caption words can sit behind it, as in the caption reel Dd0NzeWxryg.
#   python3 src/look.py
import json, os, numpy as np, cv2, onnxruntime as ort
from PIL import Image, ImageEnhance
Image.MAX_IMAGE_PIXELS = None
FR = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
so = ort.SessionOptions(); so.intra_op_num_threads = os.cpu_count()
sess = ort.InferenceSession(os.path.expanduser("~/rvm/rvm_resnet50_fp32.onnx"), so, providers=["CPUExecutionProvider"])
def matte(im):
    W, H = im.size; s = 1024 / max(W, H); w, h = round(W * s) // 4 * 4, round(H * s) // 4 * 4
    x = (np.asarray(im.resize((w, h), Image.LANCZOS), np.float32) / 255).transpose(2, 0, 1)[None]
    rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4; dr = np.array([min(1.0, 512 / max(w, h))], np.float32)
    for _ in range(8): fgr, pha, *rec = sess.run(None, {"src": x, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": dr})
    return Image.fromarray((np.clip(pha[0, 0], 0, 1) * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
P = json.load(open("src/images.json")); out = {}
for k in sorted({k for v in P.values() for k in v}):
    im = Image.open(f"assets/photos/{k}.jpg").convert("RGB"); W, H = im.size
    g = cv2.cvtColor(np.asarray(im.resize((W // 4, H // 4))), cv2.COLOR_RGB2GRAY)
    f = FR.detectMultiScale(cv2.equalizeHist(g), 1.08, 7, minSize=(max(20, min(g.shape) // 10),) * 2)
    cx, cy = W / 2, H * 0.42
    if len(f): x, y, w, h = max(f, key=lambda r: r[2] * r[3]); cx, cy = (x + w / 2) * 4, (y + h / 2) * 4
    if W / H > 16 / 9: h2, w2 = H, round(H * 16 / 9)
    else: w2, h2 = W, round(W * 9 / 16)
    x0 = int(np.clip(cx - w2 / 2, 0, W - w2)); y0 = int(np.clip(cy - h2 * 0.4, 0, H - h2))
    c = im.crop((x0, y0, x0 + w2, y0 + h2)).resize((1920, 1080), Image.LANCZOS)
    a = np.asarray(c).astype(np.float32) / 255
    bw = np.abs(a[..., 0] - a[..., 2]).mean() < 0.035                        # a black-and-white photograph
    c = ImageEnhance.Contrast(c).enhance(1.14)
    if not bw: c = ImageEnhance.Color(c).enhance(0.92)
    a = np.asarray(c).astype(np.float32) / 255
    if not bw: a = a * np.array([1.04, 0.99, 0.90])                            # warm
    a = a * 0.86                                                               # dark
    rng = np.random.default_rng(abs(hash(k)) % 9999)
    n = cv2.resize(rng.normal(0, 0.06, (540, 960)).astype(np.float32), (1920, 1080))[..., None]
    a = np.clip(a + n * (0.5 + 0.5 * (1 - a.mean(2, keepdims=True))), 0, 1)
    c = Image.fromarray((a * 255).astype(np.uint8)); c.save(f"assets/photos169/{k}.jpg", quality=88)
    m = matte(c); cov = np.asarray(m, np.float32).mean() / 255
    if 0.03 < cov < 0.55:
        cc = c.copy(); cc.putalpha(m); cc.save(f"assets/cutouts/{k}.png"); out[k] = round(float(cov), 3)
    print(k, "bw" if bw else "colour", f"figure {cov:.0%}" if k in out else "-", flush=True)
json.dump(out, open("src/cutouts.json", "w"), indent=1)
print(len(out), "cut-outs")
