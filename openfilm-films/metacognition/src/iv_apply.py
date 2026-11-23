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
    if r.get("status") != "applied": raise SystemExit(json.dumps(r)[:800])
    tok = r["state_token"]; return r.get("created", [])
place = json.load(open(f"{D}/ops-place.json")); created = []
for i in range(0, len(place), 40):
    created += change(place[i:i + 40]); print("placed", min(i + 40, len(place)), flush=True)
video = [c["id"] for c in created if c["kind"] == "clip"]; audio = [c["id"] for c in created if c["kind"] == "audio_clip"]
print(len(video), "video clips,", len(audio), "audio clips")
text = json.load(open(f"{D}/ops-text.json")); pos = json.load(open(f"{D}/positions.json"))
for op, (x, y) in zip(text, pos):
    c = [c["id"] for c in change([op]) if "audio" not in c["kind"]] or [None]
    if c[0]: change([dict(op="set_position", clip=c[0], x=x, y=y)])
    print("text", op["track"], len(op["slides"]), "->", c[0], (x, y), flush=True)
# music: audio[0] is the narration, the rest the music bed in order
ops = [dict(op="set_audio_gain", target=a, gain_db=-16) for a in audio[1:]]
ops += [dict(op="set_audio_fades", clip=a, fade_in_f=60 if k else 30, fade_out_f=90) for k, a in enumerate(audio[1:])]
# fades from/to black at the start, the end and around each card (shots next to a gap on V1)
shots = json.load(open("src/shots.json"))
for k, s in enumerate(shots):
    end = s["at"] + s["dur"]; nxt = shots[k + 1]["at"] if k + 1 < len(shots) else None
    prev_end = shots[k - 1]["at"] + shots[k - 1]["dur"] if k else None
    if k == 0 or (prev_end is not None and s["at"] - prev_end > 0.5): ops.append(dict(op="add_edge_transition", clip=video[k], edge="head", type="fade", in_f=18, out_f=0))
    if nxt is None or nxt - end > 0.5: ops.append(dict(op="add_edge_transition", clip=video[k], edge="tail", type="fade", in_f=0, out_f=18))
change(ops); print("music levels, fades:", len(ops), "ops")
print("token", tok)
