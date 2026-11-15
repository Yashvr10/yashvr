# Crops every photograph used in the film to exactly 16:9, keeping the subject in frame.
# For a picture with a figure (found with Robust Video Matting, as tools/cutout.py does), the crop keeps the top of the
# figure (head) with a little headroom; for a figure-less picture it takes a window 40% of the way down.
# Writes assets/photos169/<key>.jpg (and assets/cutouts169/<key>.png for the cut-outs), and src/crop169.json.
import json, os, sys, numpy as np, onnxruntime as ort
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
os.makedirs("assets/photos169", exist_ok=True); os.makedirs("assets/cutouts169", exist_ok=True)
so = ort.SessionOptions(); so.intra_op_num_threads = os.cpu_count()
sess = ort.InferenceSession(os.path.expanduser("~/rvm/rvm_resnet50_fp32.onnx"), so, providers=["CPUExecutionProvider"])
def matte(im):
    W, H = im.size; s = 768 / max(W, H); w, h = round(W * s) // 4 * 4, round(H * s) // 4 * 4
    x = (np.asarray(im.resize((w, h)), np.float32) / 255).transpose(2, 0, 1)[None]
    rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4; dr = np.array([min(1.0, 512 / max(w, h))], np.float32)
    for _ in range(6): fgr, pha, *rec = sess.run(None, {"src": x, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": dr})
    return np.clip(pha[0, 0], 0, 1), s * (w / round(W * s))
scenes = json.load(open("src/scenes.json"))
used = sorted({v["photo"] for s in scenes["scenes"] for v in s.get("visuals", []) if "photo" in v})
out = json.load(open("src/crop169.json")) if os.path.exists("src/crop169.json") else {}
for k in used:
    src = f"assets/photos/{k}.jpg"; im = Image.open(src).convert("RGB"); W, H = im.size
    if k in out and os.path.exists(f"assets/photos169/{k}.jpg"): continue
    r = W / H
    if abs(r - 16 / 9) < 0.01: box = (0, 0, W, H); why = "already 16:9"
    elif r > 16 / 9:   # wider: crop the sides, centred on the figure if there is one
        cw = round(H * 16 / 9); a, sc = matte(im); cols = np.where((a > .5).any(0))[0]
        cx = (cols.mean() / sc) if len(cols) and (a > .5).mean() > .03 else W / 2
        x0 = int(np.clip(cx - cw / 2, 0, W - cw)); box = (x0, 0, x0 + cw, H); why = "wide: side crop"
    else:              # taller: choose the vertical window
        ch = round(W * 9 / 16); a, sc = matte(im); m = a > .5; cov = m.mean()
        if cov > .03 and cov < .9:
            rows = np.where(m.any(1))[0]; top = rows[0] / sc
            y0 = top - 0.08 * ch          # head with headroom
            why = f"figure ({cov:.0%}): head kept"
        else: y0 = (H - ch) * 0.4; why = "no figure: 40% window"
        y0 = int(np.clip(y0, 0, H - ch)); box = (0, y0, W, y0 + ch)
    im.crop(box).save(f"assets/photos169/{k}.jpg", quality=92)
    cut = f"assets/cutouts/{k}.png"
    if os.path.exists(cut): Image.open(cut).crop(box).save(f"assets/cutouts169/{k}.png")
    out[k] = dict(box=box, size=(W, H), why=why)
    json.dump(out, open("src/crop169.json", "w"), indent=1)
    print(k, (W, H), "->", box, why, flush=True)
