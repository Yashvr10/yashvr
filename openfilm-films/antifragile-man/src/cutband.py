# How much of the frame's middle (where a red word sits) each cut-out's figure covers -> src/cutband.json.
#   python3 src/cutband.py
import json, numpy as np
from PIL import Image
c = json.load(open("src/cutouts.json")); band = {}
for k in c:
    a = np.asarray(Image.open(f"assets/cutouts/{k}.png").getchannel("A").resize((192, 108)), np.float32) / 255
    band[k] = round(float(a[27:81, 19:173].mean()), 3)
json.dump(band, open("src/cutband.json", "w"), indent=1)
print(len(band), "measured")
