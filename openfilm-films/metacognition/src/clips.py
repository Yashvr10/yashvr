# One moving clip per shot (darker behind the on-screen quotes) (src/shots.json): the graded painting (assets/photos169/<img>.jpg) with a slow push-in,
# pull-out or sideways drift, 1920x1080, 30 fps -> assets/clips/shot-NNN.mp4, ready to upload to invideo.
#   python3 src/clips.py [jobs]
import json, os, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
FPS = 30; J = int(sys.argv[1]) if len(sys.argv) > 1 else 3
shots = json.load(open("src/shots.json")); os.makedirs("assets/clips", exist_ok=True)
def name(i): return f"shot-{i:03d}" + ("-dim" if shots[i].get("dim") else "")      # darker shots sit behind the quotes
def one(i):
    s = shots[i]; out = f"assets/clips/{name(i)}.mp4"
    n = max(2, round(s["dur"] * FPS)) + 2
    p = f"on/{n - 1}"                                                                  # 0 -> 1 over the shot
    ease = f"(0.5-0.5*cos(PI*{p}))"
    z, x, y = {0: (f"1.02+0.08*{ease}", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),      # push in
               1: (f"1.10-0.08*{ease}", "iw/2-(iw/zoom/2)", "ih/2-(ih/zoom/2)"),      # pull out
               2: ("1.10", f"(iw-iw/zoom)*{ease}", "ih/2-(ih/zoom/2)"),               # drift right
               3: ("1.10", f"(iw-iw/zoom)*(1-{ease})", "ih/2-(ih/zoom/2)")}[s["move"]]  # drift left
    vf = f"scale=3840:2160,zoompan=z='{z}':x='{x}':y='{y}':d={n}:s=1920x1080:fps={FPS}," + ("eq=brightness=-0.32:contrast=0.7,vignette=PI/3.2," if s.get("dim") else "") + "format=yuv420p"
    tmp = out + ".part.mp4"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-loop", "1", "-framerate", str(FPS), "-i", f"assets/photos169/{s['img']}.jpg", "-vf", vf,
                    "-frames:v", str(n), "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-tune", "film", "-an", tmp], check=True)
    os.replace(tmp, out); return i
todo = [i for i in range(len(shots)) if not os.path.exists(f"assets/clips/{name(i)}.mp4")]
with ThreadPoolExecutor(J) as ex:
    for i in ex.map(one, todo):
        if i % 20 == 0: print(i, flush=True)
print(len(shots), "clips")
