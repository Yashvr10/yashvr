# Shot plan for Project Y ("Life Won't Wait For You, So Fly"), 9:16, built in invideo.
# The film is cut into sections that follow the script; each section gets the clips that suit its mood. Long clips are
# chopped into pieces of about 4-5 s and the pieces of a section are interleaved, so no clip plays for long at a stretch,
# and every piece is used once. Pieces are trimmed evenly so each section fills its stretch of narration exactly.
#   python3 src/plan.py  -> src/shots.json  [{clip, src_start, src_end, at, dur}]
import json, subprocess, os
T = json.load(open("src/timing.json"))
END = T["total"] + 2.5                                     # a short hold on the last picture after "So let it."
def dur(f): return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f"assets/clips/{f}.mp4"]))
S = [  # (section start in seconds, clips in the order they first appear)
 (0.0,   ["mountains-dusk", "hills-sunrise", "ref-shot1", "snow-shot1", "snow-shot2", "ref-shot2", "snow-night", "snow-shot3", "snow-shot4", "drive-shot1", "snow-shot5", "drive-shot2", "snow-shot6", "ref-shot3", "drive-shot3"]),   # are you on the right path? the wall
 (65.0,  ["ferry-shot1", "sunlight-trees", "ferry-shot2", "autumn-avenue", "ferry-shot3"]),                                       # a gamble; imagine already having it; reflect
 (126.6, ["paris-evening", "paris-street"]),                                                                                       # the art and the distraction; romanticised by our environment
 (184.9, ["seoul-shot1", "seoul-shot2", "melbourne-shot1", "seoul-shot3", "melbourne-shot2", "seoul-shot4", "melbourne-shot3", "city-night", "seoul-shot5", "melbourne-shot4", "seoul-shot6", "seoul-shot7", "melbourne-shot5", "seoul-shot8", "seoul-shot9"]),   # most people realise too late; you don't have to be most people
 (258.1, ["church-shot1", "church-shot2", "night-lights", "church-shot3", "church-shot4", "paris-rain", "church-shot5", "church-shot6", "paris-rooftops", "church-shot7", "church-shot8"]),   # intuition, a whisper; not perfect; move with faith
 (351.7, ["night-market", "sunset-glow"]),                                                                                         # peaks and valleys; progress is progress
 (403.2, ["fireworks-shot2", "purple-sunset", "fireworks-shot1", "sunbeams-trees"]),                                              # align yourself; let it
]
def pieces(c):
    L = dur(c); n = max(1, round(L / 4.6)); return [(c, L * i / n, L * (i + 1) / n) for i in range(n)]
plan = []
bounds = [s for s, _ in S] + [END]
need = [bounds[i + 1] - bounds[i] for i in range(len(S))]
have = [sum(dur(c) for c in cs) for _, cs in S]
# a section with too little footage takes the shortfall from the next section that has spare
alloc = [min(n, h) for n, h in zip(need, have)]
short = sum(need) - sum(alloc)
for i in range(len(S)):
    spare = have[i] - alloc[i]; take = min(spare, short); alloc[i] += take; short -= take
assert short < 0.01, ("not enough footage", short)
t = 0.0
for (start, cs), a in zip(S, alloc):
    # interleave the pieces of the section's clips, round-robin in the listed order
    ps = [pieces(c) for c in cs]; seq = []
    while any(ps):
        for p in ps:
            if p: seq.append(p.pop(0))
    tot = sum(b - a_ for _, a_, b in seq); k = a / tot          # trim every piece by the same share
    for c, a_, b in seq:
        d = (b - a_) * k; plan.append(dict(clip=c, src_start=round(a_, 3), src_end=round(a_ + d, 3), at=round(t, 3), dur=round(d, 3))); t += d
json.dump(plan, open("src/shots.json", "w"), indent=1)
print(len(plan), "shots,", round(t, 2), "s; sections", [round(x, 1) for x in alloc], "of", [round(x, 1) for x in need])
print("shortest", min(p["dur"] for p in plan), "longest", max(p["dur"] for p in plan))
