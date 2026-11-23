# Writes src/iv-assets.json (our name -> invideo id) from the edit's media bin and fonts:
# shot-NNN, narration, the music tracks, font-inter-mi / font-instrument / font-garamond.
#   python3 src/iv_ids.py <edit-url>
import json, sys, os, subprocess
E = sys.argv[1]; FONTS = {"Inter Medium Italic": "font-inter-mi", "Instrument Serif Regular": "font-instrument", "EB Garamond": "font-garamond"}
def page(coll, off, snap):
    cmd = ["invideo", "edit", "show", E, "--mode", "collection", "--collection", coll, "--limit", "100", "--offset", str(off), "--json"]
    return json.loads(subprocess.check_output(cmd + (["--snapshot", snap] if snap else [])))
ids = {}
for coll in ("asset", "font"):
    off = 0; snap = None
    while True:
        d = page(coll, off, snap); snap = d.get("snapshot")
        for o in d["objects"]:
            n = os.path.splitext(o["properties"].get("name") or "")[0]
            if n: ids[FONTS.get(n, n)] = o["id"]
        off = (d.get("page") or {}).get("next_offset")
        if not off or (d.get("page") or {}).get("complete"): break
json.dump(ids, open("src/iv-assets.json", "w"), indent=1, sort_keys=True)
print(len(ids), "assets;", sum(k.startswith("shot-") for k in ids), "shots;", {k: v for k, v in ids.items() if not k.startswith("shot-")})
