# Archival footage for the Spartan film (v2): public-domain films from the Prelinger Archives (Internet Archive).
# For each search, a few films; from each film, a few 3-second shots (scene changes, away from the titles), in the
# film's gritty look: black and white, hard contrast, grain, 3 px pixels. Each shot is saved twice:
#   assets/clips/<k>.mp4 (1920x1080, full frame)   assets/clips/<k>-p.mp4 (640x1080, a panel)
# and added to src/clips.json {theme: [keys]} with src/clip-credits.json. The source film is deleted after cutting.
#   python3 src/footage.py
import json, os, re, subprocess, random, urllib.parse
os.makedirs("assets/clips", exist_ok=True)
TMP = "/tmp/claude-0/-home-user-yashvr/e8ef4912-7fb7-5fb5-bff2-235d930430f1/scratchpad/ia"; os.makedirs(TMP, exist_ok=True)
Q = {"march": ["soldiers marching", "military drill", "infantry training"], "athlete": ["athletes", "track meet", "physical fitness"],
     "wrestle": ["wrestling", "boxing"], "storm": ["storm sea", "hurricane"], "battle": ["combat", "war"], "winter": ["snow", "winter"],
     "crowd": ["crowd", "audience"], "orator": ["speech", "public speaking"], "boy": ["boys", "physical education"], "mountain": ["mountains"],
     "face": ["close-up", "portrait"], "river": ["river"]}
LOOK = ("format=gray,eq=contrast=1.7:brightness=-0.04,curves=all='0/0 0.3/0.12 0.7/0.88 1/1',"
        "noise=alls=26:allf=t,scale=iw/3:ih/3:flags=area,scale={W}:{H}:flags=neighbor")
sh = lambda *a: subprocess.run(a, capture_output=True, text=True)
get = lambda u: json.loads(subprocess.check_output(["curl", "-s", "--max-time", "60", u]))
CL = json.load(open("src/clips.json")) if os.path.exists("src/clips.json") else {}
CR = json.load(open("src/clip-credits.json")) if os.path.exists("src/clip-credits.json") else {}
used = {c["film"] for c in CR.values()}
random.seed(3)
for th, qs in Q.items():
    for q in qs:
        s = get("https://archive.org/advancedsearch.php?" + urllib.parse.urlencode({"q": f'collection:prelinger AND mediatype:movies AND ({q}) AND year:[1900 TO 1960]',
                "fl[]": ["identifier", "title", "year"], "rows": 6, "output": "json", "sort[]": "downloads desc"}, doseq=True))
        films = [d for d in s["response"]["docs"] if d["identifier"] not in used][:1] if len(CL.get(th, [])) < 6 else []
        for d in films:
            ident = d["identifier"]; used.add(ident)
            files = get(f"https://archive.org/metadata/{ident}/files").get("result", [])
            mp4 = sorted([f for f in files if f["name"].endswith(".mp4") and int(f.get("size", 1e12)) < 110e6], key=lambda f: -int(f.get("size", 0)))
            if not mp4: continue
            src = f"{TMP}/src.mp4"
            if sh("curl", "-sL", "--max-time", "240", "-o", src, f"https://archive.org/download/{ident}/{urllib.parse.quote(mp4[0]['name'])}").returncode: continue
            if os.path.getsize(src) < int(mp4[0]["size"]) * 0.98: print("short download", ident); continue
            dur = float(sh("ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", src).stdout or 0)
            if dur < 60: continue
            cuts = [float(x) for x in re.findall(r"pts_time:([\d.]+)", sh("ffmpeg", "-i", src, "-vf", "select='gt(scene,0.32)',showinfo", "-an", "-f", "null", "-").stderr)]
            bounds = [0] + cuts + [dur]
            shots = [(a, b) for a, b in zip(bounds, bounds[1:]) if b - a >= 3.6 and a > dur * 0.08 and b < dur * 0.94]
            random.shuffle(shots); n = 0
            for a, b in shots[:3]:
                k = f"{th}-v{len(CL.get(th, [])) + 1}"; st = a + (b - a - 3.2) / 2
                full = sh("ffmpeg", "-y", "-loglevel", "error", "-ss", f"{st:.2f}", "-t", "3.2", "-i", src, "-an", "-vf",
                          f"scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,{LOOK.format(W=1920, H=1080)}", "-c:v", "libx264", "-crf", "25", "-preset", "fast", "-pix_fmt", "yuv420p", f"assets/clips/{k}.mp4")
                pan = sh("ffmpeg", "-y", "-loglevel", "error", "-ss", f"{st:.2f}", "-t", "3.2", "-i", src, "-an", "-vf",
                         f"scale=-2:1080,crop=640:1080,{LOOK.format(W=640, H=1080)}", "-c:v", "libx264", "-crf", "25", "-preset", "fast", "-pix_fmt", "yuv420p", f"assets/clips/{k}-p.mp4")
                if full.returncode or pan.returncode: continue
                CL.setdefault(th, []).append(k); n += 1
                CR[k] = dict(film=ident, title=d.get("title"), year=d.get("year"), at=round(st, 1), source=f"https://archive.org/details/{ident}", license="Public domain (Prelinger Archives)")
            os.remove(src)
            json.dump(CL, open("src/clips.json", "w"), indent=1); json.dump(CR, open("src/clip-credits.json", "w"), indent=1)
            print(th, q, ident, d.get("year"), n, flush=True)
print(sum(map(len, CL.values())), "clips")
