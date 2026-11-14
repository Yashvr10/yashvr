# Places each "behind" word: the figure's head should cover its middle letters, as in the reference.
# Reads the scenes (visuals with "behind") and assets/cutouts/<photo>.png; writes src/behind.json
# {scene: {word, x, y, size}} in film pixels (1920x1080), x = centre of the word, y = top of the word box.
import json, numpy as np
from PIL import Image, ImageFont
d = json.load(open("src/scenes.json"))
F = "fonts/InterTight.ttf"
out = {}
for s in d["scenes"]:
    for v in s.get("visuals", []):
        if "behind" not in v: continue
        word = v["behind"].split("#")[0].lower()
        fx, fy = [float(p[:-1]) / 100 for p in v.get("focus", "50% 50%").split()]
        cut = Image.open(f"assets/cutouts/{v['photo']}.png"); W, H = cut.size
        sc = max(1920 / W, 1080 / H) * 1.07          # cover, plus the middle of the slow push-in
        w, h = round(W * sc), round(H * sc)
        x0 = round((w - 1920) * fx); y0 = round((h - 1080) * fy)
        m = np.asarray(cut.getchannel("A").resize((w, h)))[y0:y0 + 1080, x0:x0 + 1920] > 128
        best = None
        for size in (520, 460, 400, 340, 280):
            font = ImageFont.truetype(F, size); font.set_variation_by_axes([900])
            l, t, r, b = font.getbbox(word); ww, hh = r - l, b - t
            if ww > 1800: continue
            for y in range(40, 1080 - hh - 60, 8):
                band = m[y + int(hh * .15): y + int(hh * .85)]
                cols = np.where(band.any(0))[0]
                if not len(cols): continue
                cx = int(np.clip(np.nonzero(band)[1].mean(), ww / 2 + 60, 1920 - ww / 2 - 60))
                box = band[:, int(cx - ww / 2): int(cx + ww / 2)]
                cov = box.mean()
                head_above = m[max(0, y - 40): y + 4].any()        # the figure continues above the word: its head overlaps it
                mid = box[:, int(ww * .35): int(ww * .65)].mean()   # the middle letters are hidden...
                left = box[:, : int(ww * .22)].mean(); right = box[:, int(ww * .78):].mean()  # ...and the outer letters stay readable
                if mid > 0.45 and left < 0.3 and right < 0.3 and head_above:
                    best = dict(word=word, x=cx, y=y - t, size=size, cover=round(float(cov), 2)); break
            if best: break
        out[s["id"]] = best or dict(word=word, x=960, y=80, size=260, cover=None)
        print(s["id"], v["photo"], out[s["id"]])
json.dump(out, open("src/behind.json", "w"), indent=1)
