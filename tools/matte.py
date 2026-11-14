#!/usr/bin/env python3
"""Cut a person out of a video clip with Robust Video Matting (ONNX, CPU).

  python3 tools/matte.py clip.mp4 out_prefix [--model resnet50|mobilenetv3] [--ss 3 --t 5] [--ratio 0.4]

Writes:
  out_prefix.alpha.mp4   the matte, white = person
  out_prefix.fg.webm     the person on a transparent background (VP9 with alpha; Chromium and OpenFilm play it)

Stack as: the clip, then the text, then out_prefix.fg.webm on top, so the person covers the text.
Models are fetched once into ~/rvm (PeterL1n/RobustVideoMatting, GPL-3.0).
"""
import argparse, os, subprocess, sys, json, urllib.request
import numpy as np, onnxruntime as ort

ap = argparse.ArgumentParser()
ap.add_argument("src"); ap.add_argument("out")
ap.add_argument("--model", default="resnet50", choices=["resnet50", "mobilenetv3"])
ap.add_argument("--ss", type=float); ap.add_argument("--t", type=float)
ap.add_argument("--ratio", type=float, help="downsample ratio; default picks one so the model sees about 512 px")
a = ap.parse_args()

mdir = os.path.expanduser("~/rvm"); os.makedirs(mdir, exist_ok=True)
mp = f"{mdir}/rvm_{a.model}_fp32.onnx"
if not os.path.exists(mp):
    print("fetching model…", file=sys.stderr)
    urllib.request.urlretrieve(f"https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_{a.model}_fp32.onnx", mp)

info = json.loads(subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries",
        "stream=width,height,r_frame_rate", "-of", "json", a.src]))["streams"][0]
W, H, fps = info["width"], info["height"], info["r_frame_rate"]
ratio = a.ratio or min(1.0, 512 / max(W, H))
cut = (["-ss", str(a.ss)] if a.ss is not None else []) + (["-t", str(a.t)] if a.t is not None else [])

rd = subprocess.Popen(["ffmpeg", "-v", "error", *cut, "-i", a.src, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
wa = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "gray", "-s", f"{W}x{H}", "-r", fps, "-i", "-",
                       "-c:v", "libx264", "-crf", "12", "-pix_fmt", "yuv420p", a.out + ".alpha.mp4"], stdin=subprocess.PIPE)
wf = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", fps, "-i", "-",
                       "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "0", "-crf", "24", "-row-mt", "1", "-auto-alt-ref", "0",
                       a.out + ".fg.webm"], stdin=subprocess.PIPE)

so = ort.SessionOptions(); so.intra_op_num_threads = os.cpu_count()
sess = ort.InferenceSession(mp, so, providers=["CPUExecutionProvider"])
rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
dr = np.array([ratio], np.float32)
n = 0
while True:
    buf = rd.stdout.read(W * H * 3)
    if len(buf) < W * H * 3: break
    rgb = np.frombuffer(buf, np.uint8).reshape(H, W, 3)
    src = (rgb.astype(np.float32) / 255).transpose(2, 0, 1)[None]
    fgr, pha, *rec = sess.run(None, {"src": src, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": dr})
    al = (np.clip(pha[0, 0], 0, 1) * 255).astype(np.uint8)
    wa.stdin.write(al.tobytes())
    wf.stdin.write(np.dstack([rgb, al]).tobytes())
    n += 1
    if n % 30 == 0: print(f"\r{n} frames", end="", file=sys.stderr)
for p in (wa, wf): p.stdin.close(); p.wait()
print(f"\n{n} frames at {W}x{H}, ratio {ratio:.2f} -> {a.out}.alpha.mp4, {a.out}.fg.webm", file=sys.stderr)
