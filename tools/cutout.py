#!/usr/bin/env python3
"""Cut the person out of a still image (a painting or photo) with Robust Video Matting.

  python3 tools/cutout.py in.jpg out.png [--model resnet50] [--side 1024]

Writes out.png: the same image, same size, with the background transparent. The model is a video model, so the
still is fed in several times and the last, settled matte is kept. Stack it over the original (same position, same
movement) with text in between, and the person covers the text.
"""
import argparse, os, sys, urllib.request
import numpy as np, onnxruntime as ort
from PIL import Image
ap = argparse.ArgumentParser(); ap.add_argument("src"); ap.add_argument("out")
ap.add_argument("--model", default="resnet50"); ap.add_argument("--side", type=int, default=1024); ap.add_argument("--passes", type=int, default=8)
a = ap.parse_args()
mp = os.path.expanduser(f"~/rvm/rvm_{a.model}_fp32.onnx")
if not os.path.exists(mp):
    os.makedirs(os.path.dirname(mp), exist_ok=True)
    urllib.request.urlretrieve(f"https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_{a.model}_fp32.onnx", mp)
im = Image.open(a.src).convert("RGB"); W, H = im.size
s = a.side / max(W, H); w, h = (round(W * s) // 4 * 4, round(H * s) // 4 * 4)
x = (np.asarray(im.resize((w, h), Image.LANCZOS), np.float32) / 255).transpose(2, 0, 1)[None]
so = ort.SessionOptions(); so.intra_op_num_threads = os.cpu_count()
sess = ort.InferenceSession(mp, so, providers=["CPUExecutionProvider"])
rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4; dr = np.array([min(1.0, 512 / max(w, h))], np.float32)
for _ in range(a.passes):
    fgr, pha, *rec = sess.run(None, {"src": x, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": dr})
alpha = Image.fromarray((np.clip(pha[0, 0], 0, 1) * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
out = im.copy(); out.putalpha(alpha); out.save(a.out)
cov = np.asarray(alpha, np.float32).mean() / 255
print(f"{os.path.basename(a.out)}: {W}x{H}, person covers {cov:.0%} of the picture", file=sys.stderr)
