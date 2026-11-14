#!/usr/bin/env python3
"""Add a batch of raw clips to project X, skipping any clip already there.

  python3 tools/x_ingest.py <batch-number> <src>=<name> [<src>=<name> ...]

Each new clip is compared with every clip in openfilm-films/x/raw: exact file match first, then a picture match
on the first frame (16x16 average hash, at most 12 bits different). New clips are copied to raw/batch-NN/<name>.<ext>.
Prints one line per clip: name, size, seconds of footage, and whether it was skipped as a duplicate.
"""
import sys, os, glob, hashlib, subprocess, io
from PIL import Image
X = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "openfilm-films", "x")
def md5(p): return hashlib.md5(open(p, "rb").read()).hexdigest()
def ahash(p):
    png = subprocess.check_output(["ffmpeg", "-v", "error", "-i", p, "-frames:v", "1", "-f", "image2pipe", "-vcodec", "png", "-"])
    g = Image.open(io.BytesIO(png)).convert("L").resize((16, 16)); px = list(g.tobytes()); m = sum(px) / len(px)
    return "".join("1" if v > m else "0" for v in px)
def probe(p):
    o = subprocess.check_output(["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,codec_name:format=duration",
                                 "-of", "csv=p=0", p]).decode().split()
    c, w, h = o[0].split(",")[:3]; return c, int(w), int(h), float(o[1])
seen = {f: (md5(f), ahash(f)) for f in sorted(glob.glob(f"{X}/raw/*/*"))}
out = f"{X}/raw/batch-{int(sys.argv[1]):02d}"; os.makedirs(out, exist_ok=True)
for arg in sys.argv[2:]:
    src, name = arg.rsplit("=", 1)
    h = (md5(src), ahash(src)); c, w, hh, d = probe(src)
    dup = [k for k, v in seen.items() if v[0] == h[0] or sum(a != b for a, b in zip(v[1], h[1])) <= 12]
    if dup: print(f"DUP   {name}  {w}x{hh}  {d:.1f}s  same as {os.path.relpath(dup[0], X)}"); continue
    dst = f"{out}/{name}.{'gif' if c == 'gif' else 'mp4'}"
    open(dst, "wb").write(open(src, "rb").read()); os.chmod(dst, 0o644); seen[dst] = h
    print(f"NEW   {name}  {w}x{hh}  {d:.1f}s")
