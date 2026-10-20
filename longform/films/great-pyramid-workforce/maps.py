"""Draws the film's three maps as 1920x1080 HTML/SVG pages (rasterised by Chrome, see make-maps.sh).
Every place and number here is a ledger row (L06, L18, L29-L34). Map data: Natural Earth (public domain).
Usage: python3 -I maps.py <natural-earth dir> <out dir>
"""
import json, math, sys

NE, OUT = sys.argv[1], sys.argv[2]
W, H = 1920, 1080
BG, LAND, WATER, FG, MUTED, ACCENT = '#0b0d12', '#1c2029', '#2b4a63', '#f4f1ea', 'rgba(244,241,234,0.62)', '#d97757'
FONT = "Inter, sans-serif"

# Ledger rows L29-L33 (Wikipedia coordinates, opened 20 Oct 2026)
GREAT_PYRAMID = (29.97917, 31.13417)
SPHINX = (29.97526, 31.13758)
TURA = (29.94583, 31.31806)
WADI_EL_JARF = (28.89167, 32.65833)
ASWAN = (24.08889, 32.89972)  # L45
# L18: the workers' town lies 400 m south of the Sphinx (AERA). 400 m / 111,320 m per degree of latitude.
TOWN = (SPHINX[0] - 400 / 111320, SPHINX[1])


def km(a, b):  # haversine, mean Earth radius 6371 km
    p1, p2 = math.radians(a[0]), math.radians(b[0])
    dp, dl = p2 - p1, math.radians(b[1] - a[1])
    return 2 * 6371 * math.asin(math.sqrt(math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2))


class Proj:
    """Equirectangular, scaled by cos(latitude), centred on (lat_c, lon_c) at the middle of the SAFE box.
    The image scene zooms to 1.12x and drifts 40 px left, and puts its title at y = 780, so every
    label and point must sit inside x 260-1690, y 170-640 of the 1920x1080 page."""
    BOX = (260, 170, 1690, 640)

    def __init__(self, lat_c, lon_c, px_per_deg):
        self.k = math.cos(math.radians(lat_c))
        self.s, self.lat_c, self.lon_c = px_per_deg, lat_c, lon_c
        self.cx, self.cy = (self.BOX[0] + self.BOX[2]) / 2, (self.BOX[1] + self.BOX[3]) / 2

    def __call__(self, lat, lon):
        return self.cx + (lon - self.lon_c) * self.k * self.s, self.cy - (lat - self.lat_c) * self.s

    def metres(self, m):  # metres to pixels, north-south
        return m / 111320 * self.s


def load(name):
    return json.load(open(f'{NE}/{name}.geojson'))['features']


def paths(features, proj, bbox, closed):
    lo_lat, hi_lat, lo_lon, hi_lon = bbox
    out = []
    for f in features:
        g = f['geometry']
        if not g:
            continue
        polys = g['coordinates'] if g['type'] in ('MultiPolygon', 'MultiLineString') else [g['coordinates']]
        for poly in polys:
            rings = poly if closed else [poly]
            for ring in rings:
                if not any(lo_lat - 2 < y < hi_lat + 2 and lo_lon - 2 < x < hi_lon + 2 for x, y in ring):
                    continue
                pts = ' '.join(f'{proj(y, x)[0]:.1f},{proj(y, x)[1]:.1f}' for x, y in ring)
                out.append(f'M{pts}{"Z" if closed else ""}')
    return ' '.join(out)


def dot(proj, ll, label, sub=None, side='right', accent=True):
    x, y = proj(*ll)
    dx = 30 if side == 'right' else -30
    anchor = 'start' if side == 'right' else 'end'
    s = f'<circle cx="{x:.1f}" cy="{y:.1f}" r="13" fill="{ACCENT if accent else FG}"/>'
    s += f'<text x="{x + dx:.1f}" y="{y + 14:.1f}" text-anchor="{anchor}" font-size="46" font-weight="800" fill="{FG}">{label}</text>'
    if sub:
        s += f'<text x="{x + dx:.1f}" y="{y + 58:.1f}" text-anchor="{anchor}" font-size="32" font-weight="500" fill="{MUTED}">{sub}</text>'
    return s


def page(name, body):
    html = f'''<!doctype html><html><head><meta charset="utf-8"><style>html,body{{margin:0;background:{BG}}}
svg{{display:block;font-family:{FONT}}}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}"><rect width="{W}" height="{H}" fill="{BG}"/>{body}</svg></body></html>'''
    open(f'{OUT}/{name}.html', 'w').write(html)


land, lakes = load('ne_10m_land'), load('ne_10m_lakes')
# Only the Nile and its two delta branches: the Suez and Ismailiya canals are modern and would mislead.
rivers = [f for f in load('ne_10m_rivers_lake_centerlines') if f['properties'].get('name') in ('Nile', 'Rosetta Branch', 'Damietta Branch')]

# Map 1 (s020): Egypt, where the evidence was found. Sea = background colour, land = card colour.
p = Proj(29.43, 31.85, 380)
bbox = (26.0, 33.0, 26.0, 38.0)
body = f'<path d="{paths(land, p, bbox, True)}" fill="{LAND}" stroke="none" fill-rule="evenodd"/>'
body += f'<path d="{paths(lakes, p, bbox, True)}" fill="{BG}"/>'
body += f'<path d="{paths(rivers, p, bbox, False)}" fill="none" stroke="{WATER}" stroke-width="5" stroke-linejoin="round"/>'
x, y = p(28.95, 30.62)
body += f'<text x="{x:.0f}" y="{y:.0f}" text-anchor="middle" font-size="30" font-weight="600" fill="#4f7894" letter-spacing="6">NILE</text>'
# (No sea label: at this scale it falls into the caption band. The Wadi el-Jarf sub-label names the coast, L32.)
body += dot(p, GREAT_PYRAMID, 'Giza', "the builders' town and tombs", side='left')
body += dot(p, WADI_EL_JARF, 'Wadi el-Jarf', "Merer's logbook, Red Sea coast", side='left')
page('map-egypt', body)

# Map 2 (s080): the Giza plateau. Great Pyramid drawn to scale (230.3 m a side, L06).
p = Proj(29.9756, 31.1365, 52000)
cx, cy = p(*GREAT_PYRAMID)
half = p.metres(230.3) / 2
body = f'<rect x="{cx - half:.1f}" y="{cy - half:.1f}" width="{2 * half:.1f}" height="{2 * half:.1f}" fill="none" stroke="{FG}" stroke-width="4"/>'
body += f'<path d="M{cx - half:.1f},{cy - half:.1f}L{cx + half:.1f},{cy + half:.1f}M{cx + half:.1f},{cy - half:.1f}L{cx - half:.1f},{cy + half:.1f}" stroke="{MUTED}" stroke-width="2"/>'
body += f'<text x="{cx - half - 26:.1f}" y="{cy + 14:.1f}" text-anchor="end" font-size="46" font-weight="800" fill="{FG}">Great Pyramid</text>'
body += f'<text x="{cx - half - 26:.1f}" y="{cy + 58:.1f}" text-anchor="end" font-size="32" font-weight="500" fill="{MUTED}">230 m a side, to scale</text>'
body += dot(p, SPHINX, 'Sphinx', None, side='right', accent=False)
tx, ty = p(*TOWN)
sx, sy = p(*SPHINX)
body += f'<path d="M{sx:.1f},{sy + 22:.1f}L{tx:.1f},{ty - 22:.1f}" stroke="{MUTED}" stroke-width="3" stroke-dasharray="10 10"/>'
body += f'<text x="{sx - 24:.1f}" y="{(sy + ty) / 2 + 10:.1f}" text-anchor="end" font-size="30" font-weight="500" fill="{MUTED}">400 m</text>'
body += dot(p, TOWN, "Workers' town", 'more than 7 hectares, dug from 1988', side='right')
bar = p.metres(200)
body += f'<path d="M1420,250h{bar:.1f}" stroke="{FG}" stroke-width="4"/><text x="{1420 + bar / 2:.1f}" y="235" text-anchor="middle" font-size="28" fill="{MUTED}">200 m</text>'
page('map-giza', body)

# Map 3 (s120): Tura to Giza, Merer's run. River line is the modern Nile (Natural Earth).
p = Proj(29.955, 31.226, 5600)
bbox = (29.7, 30.2, 30.9, 31.6)
body = f'<rect width="{W}" height="{H}" fill="{LAND}"/>'
body += f'<path d="{paths(rivers, p, bbox, False)}" fill="none" stroke="{WATER}" stroke-width="16" stroke-linejoin="round"/>'
gx, gy = p(*GREAT_PYRAMID)
tx2, ty2 = p(*TURA)
body += f'<path d="M{tx2 - 20:.1f},{ty2 - 10:.1f}Q{(gx + tx2) / 2:.1f},{min(gy, ty2) - 230:.1f} {gx + 24:.1f},{gy - 14:.1f}" fill="none" stroke="{ACCENT}" stroke-width="6" stroke-dasharray="18 14"/>'
body += dot(p, GREAT_PYRAMID, 'Giza', 'the Great Pyramid', side='left')
body += dot(p, TURA, 'Tura', 'limestone quarries', side='right')
d = km(GREAT_PYRAMID, TURA)
body += f'<text x="{(gx + tx2) / 2 - 60:.1f}" y="{(gy + ty2) / 2 + 40:.1f}" text-anchor="end" font-size="34" font-weight="600" fill="{FG}">about {round(d)} km apart,</text><text x="{(gx + tx2) / 2 - 60:.1f}" y="{(gy + ty2) / 2 + 84:.1f}" text-anchor="end" font-size="34" font-weight="600" fill="{FG}">straight line</text>'
nx, ny = p(29.915, 31.255)
body += f'<text x="{nx + 150:.0f}" y="{ny:.0f}" font-size="28" font-weight="600" fill="#4f7894" letter-spacing="5">NILE (MODERN COURSE)</text>'
page('map-tura', body)
# Map 4 (s056): Aswan granite. Written to a NEW file name (map-aswan.png) - the scene cache does not hash image bytes.
p = Proj(27.03, 32.0, 72)
bbox = (22.0, 32.5, 27.0, 37.0)
body = f'<path d="{paths(land, p, bbox, True)}" fill="{LAND}" stroke="none" fill-rule="evenodd"/>'
body += f'<path d="{paths(lakes, p, bbox, True)}" fill="{BG}"/>'
body += f'<path d="{paths(rivers, p, bbox, False)}" fill="none" stroke="{WATER}" stroke-width="5" stroke-linejoin="round"/>'
gx, gy = p(*GREAT_PYRAMID)
ax, ay = p(*ASWAN)
body += f'<path d="M{ax:.1f},{ay:.1f}L{gx:.1f},{gy:.1f}" stroke="{ACCENT}" stroke-width="5" stroke-dasharray="16 12"/>'
body += dot(p, GREAT_PYRAMID, 'Giza', 'the Great Pyramid', side='left')
body += dot(p, ASWAN, 'Aswan', 'granite quarries', side='right')
da = km(GREAT_PYRAMID, ASWAN)
mx, my = (gx + ax) / 2, (gy + ay) / 2
body += f'<text x="{mx + 40:.1f}" y="{my:.1f}" font-size="34" font-weight="600" fill="{FG}">about {round(da, -1):.0f} km,</text><text x="{mx + 40:.1f}" y="{my + 44:.1f}" font-size="34" font-weight="600" fill="{FG}">straight line</text>'
x, y = p(26.2, 31.55)
body += f'<text x="{x:.0f}" y="{y:.0f}" text-anchor="end" font-size="28" font-weight="600" fill="#4f7894" letter-spacing="6">NILE</text>'
page('map-aswan', body)
print(f'Giza-Aswan straight line: {da:.1f} km')
print(f'Giza-Tura straight line: {d:.2f} km; town offset 400 m = {400 / 111320:.5f} deg lat')
