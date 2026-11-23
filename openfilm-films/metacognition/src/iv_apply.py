# Applies the metacognition edit in invideo from the ops src/iv_ops.py wrote.
#   python3 src/iv_apply.py <edit-url> <ops-dir>
# 1. pictures, narration and music (ops-place.json), in chunks
# 2. each text clip (ops-text.json) on its own, then moved to its place (positions.json)
# 3. music at about -36 LUFS (-16 dB on tracks measured near -20 LUFS) with fades; fades to and from black around the
#    chapter cards and at the very start and end
import json, subprocess, sys
E, D = sys.argv[1], sys.argv[2]; FPS = 30
def run(*a):
    return json.loads(subprocess.check_output(["invideo", *a, "--json"]))
tok = run("edit", "show", E, "--mode", "overview")["state_token"]
def change(ops):
    global tok
    json.dump(ops, open(f"{D}/apply.json", "w"))
    r = run("edit", "change", E, "--timeline", "T1", "--token", tok, "--operations", f"@{D}/apply.json")
    if r.get("status") not in ("applied", "no_change"): raise SystemExit(json.dumps(r)[:800])
    tok = r["state_token"]; return r.get("created", [])
RESUME = len(sys.argv) > 3                     # resume after the placements: read the clip ids back from the edit
def listing(coll):
    out, off, snap = [], 0, None
    while True:
        a = ["edit", "show", E, "--mode", "collection", "--collection", coll, "--limit", "100", "--offset", str(off)] + (["--snapshot", snap] if snap else [])
        d = run(*a); snap = d.get("snapshot"); out += d["objects"]; pg = d.get("page") or {}
        if pg.get("complete") or not pg.get("next_offset"): return out
        off = pg["next_offset"]
if not RESUME:
    place = json.load(open(f"{D}/ops-place.json")); created = []
    for i in range(0, len(place), 40):
        created += change(place[i:i + 40]); print("placed", min(i + 40, len(place)), flush=True)
    video = [c["id"] for c in created if c["kind"] == "clip"]; audio = [c["id"] for c in created if c["kind"] == "audio_clip"]
else:
    video = [o["id"] for o in sorted(listing("clip"), key=lambda o: o["start_f"]) if o["properties"].get("track_id") == "V1"]
    au = sorted(listing("audio_clip"), key=lambda o: (o["properties"].get("track_id"), o["start_f"]))
    audio = [o["id"] for o in au if o["properties"].get("track_id") == "A1"] + [o["id"] for o in au if o["properties"].get("track_id") == "A2"]
    have = [o for o in listing("clip") if o.get("clip_type") == "captions"]
print(len(video), "video clips,", len(audio), "audio clips")
text = json.load(open(f"{D}/ops-text.json")); pos = json.load(open(f"{D}/positions.json"))
done = int(sys.argv[3]) if RESUME else 0       # text ops already added (their clips are moved below)
if RESUME:
    for o, (x, y) in zip(sorted(have, key=lambda o: int(o["id"][1:]))[:done], pos): change([dict(op="set_position", clip=o["id"], x=x, y=y)])
for op, (x, y) in list(zip(text, pos))[done:]:
    cr = change([op]); c = [c["id"] for c in cr if c["kind"] in ("clip", "caption_clip", "text_clip") or c["id"].startswith("t")] or [None]
    if c[0]: change([dict(op="set_position", clip=c[0], x=x, y=y)])
    print("text", op["track"], len(op["slides"]), "->", c[0], (x, y), flush=True)
# music: audio[0] is the narration, the rest the music bed in order
ops = [dict(op="set_audio_gain", target=a, gain_db=-16) for a in audio[1:]]
ops += [dict(op="set_audio_fades", clip=a, fade_in_f=60 if k else 30, fade_out_f=90) for k, a in enumerate(audio[1:])]
# fades from/to black at the start, the end and around each card (shots next to a gap on V1)
shots = json.load(open("src/shots.json")); F = lambda s: round(s * FPS)
for k, s in enumerate(shots):                     # opacity fades, since edge transitions only sit at a track's ends
    f0, f1 = F(s["at"]), F(s["at"] + s["dur"])
    head = k == 0 or s["at"] - (shots[k - 1]["at"] + shots[k - 1]["dur"]) > 0.5
    tail = k + 1 == len(shots) or shots[k + 1]["at"] - (s["at"] + s["dur"]) > 0.5
    pts = ([dict(at_f=f0, value=0, ease="ease_out"), dict(at_f=f0 + 18, value=1, ease="linear")] if head else []) + \
          ([dict(at_f=f1 - 18, value=1, ease="ease_in"), dict(at_f=f1 - 1, value=0)] if tail else [])
    if pts: ops.append(dict(op="set_keyframes", clip=video[k], property="opacity", points=pts))
change(ops); print("music levels, fades:", len(ops), "ops")
print("token", tok)
