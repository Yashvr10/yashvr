# Adds the sound effects listed in .film/sfx-extra.json to a rendered film's audio (the picture is copied as is).
#   python3 src/mix_extra.py rendered.mp4 out.wav
import json, sys, subprocess, numpy as np, wave
src, out = sys.argv[1], sys.argv[2]
def dec(p): return np.frombuffer(subprocess.check_output(["ffmpeg","-v","error","-i",p,"-ac","2","-ar","48000","-f","s16le","-"]),np.int16).astype(np.float32).reshape(-1,2)/32768
a = dec(src); cache = {}
for x in json.load(open(".film/sfx-extra.json")):
    s = cache.setdefault(x["f"], dec("assets/sfx/" + x["f"])) * x["vol"]
    i = int(x["at"] * 48000); n = min(len(s), len(a) - i)
    if n > 0: a[i:i+n] += s[:n]
a = np.clip(a, -0.98, 0.98)
w = wave.open(out, "wb"); w.setnchannels(2); w.setsampwidth(2); w.setframerate(48000); w.writeframes((a * 32767).astype(np.int16).tobytes()); w.close()
print("mixed", len(json.load(open(".film/sfx-extra.json"))), "sounds")
