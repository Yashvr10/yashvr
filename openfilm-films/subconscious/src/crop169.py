# Every artwork -> assets/photos169/<key>.jpg (1920x1080, the figure's head kept, found with Robust Video Matting)
# and assets/grid/<key>.jpg (whole picture, longest side 900 px, for the collage cards).
import json, os, numpy as np, onnxruntime as ort
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
so = ort.SessionOptions(); so.intra_op_num_threads = os.cpu_count()
sess = ort.InferenceSession(os.path.expanduser("~/rvm/rvm_mobilenetv3_fp32.onnx"), so, providers=["CPUExecutionProvider"])
def matte(im):
    W, H = im.size; s = 512 / max(W, H); w, h = round(W * s) // 4 * 4, round(H * s) // 4 * 4
    x = (np.asarray(im.resize((w, h)), np.float32) / 255).transpose(2, 0, 1)[None]
    rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4; dr = np.array([1.0], np.float32)
    for _ in range(4): fgr, pha, *rec = sess.run(None, {"src": x, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": dr})
    return np.clip(pha[0, 0], 0, 1), h / H
P = json.load(open("src/images.json"))
for k in sorted({k for v in P.values() for k in v}):
    o1, o2 = f"assets/photos169/{k}.jpg", f"assets/grid/{k}.jpg"
    if os.path.exists(o1) and os.path.exists(o2): continue
    im = Image.open(f"assets/photos/{k}.jpg").convert("RGB"); W, H = im.size
    g = im.copy(); g.thumbnail((900, 900)); g.save(o2, quality=88)
    if W / H > 16 / 9:
        cw = round(H * 16 / 9); a, sc = matte(im); cols = np.where((a > .5).any(0))[0]
        cx = cols.mean() / sc if len(cols) and (a > .5).mean() > .03 else W / 2
        x0 = int(np.clip(cx - cw / 2, 0, W - cw)); box = (x0, 0, x0 + cw, H)
    else:
        ch = round(W * 9 / 16); a, sc = matte(im); m = a > .5; cov = m.mean()
        y0 = (np.where(m.any(1))[0][0] / sc - 0.08 * ch) if .03 < cov < .9 else (H - ch) * 0.35
        y0 = int(np.clip(y0, 0, H - ch)); box = (0, y0, W, y0 + ch)
    im.crop(box).resize((1920, 1080), Image.LANCZOS).save(o1, quality=86)
    print(k, flush=True)
