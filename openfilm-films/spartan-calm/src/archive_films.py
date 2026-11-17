# Historic public-domain films from the Internet Archive for the Spartan film (v2), cut into 3.2 s shots in the film's
# gritty look (the same filter and sizes as src/footage.py). Shots are spread through each film, away from the opening
# and closing titles; frames that are mostly flat (title cards, black) are skipped.
#   python3 src/archive_films.py
import json, os, re, subprocess, urllib.parse, numpy as np
TMP = "/tmp/claude-0/-home-user-yashvr/e8ef4912-7fb7-5fb5-bff2-235d930430f1/scratchpad/ia"; os.makedirs(TMP, exist_ok=True)
IDS = {"the-olympic-games-as-they-were-practiced-in-ancient-greece-1924-tmdb470826": ("athlete", 8), "the-olympic-games-in-paris-1924-1925-tmdb470830": ("athlete", 5),
       "the-olympic-games-amsterdam-1928-1928-tmdb470835": ("athlete", 4), "the-corbett-fitzsimmons-fight-1897": ("wrestle", 4),
       "loc-film-00564577-wrestling-at-the-n-y-a-c": ("wrestle", 3), "H-1423": ("battle", 5), "111-H-1454": ("march", 4),
       "loc-film-mp76000186-tr-reviews-french-troops-at-vincennes-france-1910": ("march", 4), "loc-film-98500744-25th-infantry": ("march", 3),
       "Sea_Fighting_in_Greece": ("storm", 3), "loc-film-mp76000043-tr-reviews-and-addresses-troops-fort-sheridan-ill-tr-riding-": ("orator", 3)}
LOOK = ("format=gray,eq=contrast=1.45:brightness=-0.02,curves=all='0/0 0.3/0.18 0.7/0.84 1/1',"
        "noise=alls=24:allf=t,scale=iw/3:ih/3:flags=area,scale={W}:{H}:flags=neighbor")
sh = lambda *a: subprocess.run(a, capture_output=True, text=True)
get = lambda u: json.loads(subprocess.check_output(["curl", "-s", "--max-time", "60", u]))
CL = json.load(open("src/clips.json")); CR = json.load(open("src/clip-credits.json"))
used = {c["film"] for c in CR.values()}
for ident, (th, n) in IDS.items():
    if ident in used: continue
    meta = get(f"https://archive.org/metadata/{ident}"); files = meta.get("files", [])
    vids = [f for f in files if re.search(r"\.(mp4|ogv|mpeg|avi|mkv)$", f["name"]) and int(f.get("size", 1e12)) < 160e6]
    vids.sort(key=lambda f: (not f["name"].endswith(".mp4"), -int(f.get("size", 0))))
    if not vids: print("no video", ident); continue
    src = f"{TMP}/src" + os.path.splitext(vids[0]["name"])[1]
    if sh("curl", "-sL", "--max-time", "600", "-o", src, f"https://archive.org/download/{ident}/{urllib.parse.quote(vids[0]['name'])}").returncode: print("download failed", ident); continue
    dur = float(sh("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src).stdout or 0)
    if dur < 8: print("too short", ident, dur); os.remove(src); continue
    cuts = [float(x) for x in re.findall(r"pts_time:([\d.]+)", sh("ffmpeg", "-i", src, "-vf", "select='gt(scene,0.3)',showinfo", "-an", "-f", "null", "-").stderr)]
    lo, hi = (dur * 0.06, dur * 0.95) if dur > 60 else (0.3, dur - 0.3)
    bounds = [lo] + [c for c in cuts if lo < c < hi] + [hi]
    shots = [(a, b) for a, b in zip(bounds, bounds[1:]) if b - a >= 3.5]
    # spread through the film; skip flat frames (title cards, black, white)
    def busy(t):
        raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-ss", f"{t:.2f}", "-i", src, "-frames:v", "1", "-vf", "scale=96:72,format=gray", "-f", "rawvideo", "-"], capture_output=True).stdout
        a = np.frombuffer(raw, np.uint8) if raw else np.zeros(1)
        return a.std() > 28 and 35 < a.mean() < 215
    shots = [s for s in shots if busy(s[0] + (s[1] - s[0]) / 2)]
    if len(shots) > n: shots = [shots[round(i * (len(shots) - 1) / (n - 1))] for i in range(n)] if n > 1 else shots[:1]
    got = 0
    for a, b in shots:
        k = f"{th}-a{sum(1 for x in CR if x.startswith(th + '-a')) + 1}"; st = a + (b - a - 3.2) / 2
        ok = all(sh("ffmpeg", "-y", "-loglevel", "error", "-ss", f"{st:.2f}", "-t", "3.2", "-i", src, "-an", "-vf", vf + "," + LOOK.format(W=W, H=H),
                    "-r", "30", "-c:v", "libx264", "-crf", "25", "-preset", "fast", "-pix_fmt", "yuv420p", out).returncode == 0
                 for vf, W, H, out in [("scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080", 1920, 1080, f"assets/clips/{k}.mp4"),
                                       ("scale=-2:1080,crop=640:1080", 640, 1080, f"assets/clips/{k}-p.mp4")])
        if not ok: continue
        CL.setdefault(th, []).append(k); got += 1
        CR[k] = dict(film=ident, title=meta.get("metadata", {}).get("title"), year=meta.get("metadata", {}).get("year") or meta.get("metadata", {}).get("date"),
                     at=round(st, 1), source=f"https://archive.org/details/{ident}", license="Public domain")
    os.remove(src)
    json.dump(CL, open("src/clips.json", "w"), indent=1); json.dump(CR, open("src/clip-credits.json", "w"), indent=1)
    print(th, ident, round(dur), "s ->", got, "shots", flush=True)
print(sum(map(len, CL.values())), "clips")
