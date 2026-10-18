"""python3 qa-sheet.py: tiles qa/aspects/ (from qa-aspects.mjs) into qa/sheet_16x9.png and
qa/sheet_9x16.png. Drawn on the thumbnails only (never on renders): the layout margins in yellow,
the 9:16 caption band in magenta, and in red every text box that crosses one of them."""
import json
from PIL import Image, ImageDraw, ImageFont

report = json.load(open('qa/aspects/report.json'))
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
except OSError:
    font = ImageFont.load_default()


def crosses(b, r):
    return r and (b['x0'] < r['x'] - 0.5 or b['y0'] < r['y'] - 0.5 or b['x1'] > r['x'] + r['w'] + 0.5 or b['y1'] > r['y'] + r['h'] + 0.5)


for aspect, (tw, th, cols) in {'16x9': (480, 270, 4), '9x16': (270, 480, 7)}.items():
    rects, shots = report[aspect]['rects'], report[aspect]['shots']
    label = 26
    rows = -(-len(shots) // cols)
    sheet = Image.new('RGB', (cols * tw, rows * (th + label)), '#000')
    d = ImageDraw.Draw(sheet)
    for i, s in enumerate(shots):
        img = Image.open(s['file']).convert('RGB')
        k = tw / img.width
        x, y = (i % cols) * tw, (i // cols) * (th + label)
        sheet.paste(img.resize((tw, th), Image.LANCZOS), (x, y))
        box = lambda r: [x + r['x'] * k, y + r['y'] * k, x + (r['x'] + r['w']) * k, y + (r['y'] + r['h']) * k]
        d.rectangle(box(rects['margins']), outline='#f0c000')
        if rects['captionBand']:
            d.rectangle(box(rects['captionBand']), outline='#ff2bd6')
        for b in s['boxes']:
            if crosses(b, rects['margins']) or crosses(b, rects['captionBand']):
                d.rectangle([x + b['x0'] * k, y + b['y0'] * k, x + b['x1'] * k, y + b['y1'] * k], outline='#ff2020', width=2)
        d.text((x + 6, y + th + 4), f"{s['scene']}  {s['t']:.2f}s", fill='#ccc', font=font)
    sheet.save(f'qa/sheet_{aspect}.png')
    print(f'qa/sheet_{aspect}.png', sheet.size, len(shots), 'stills')
