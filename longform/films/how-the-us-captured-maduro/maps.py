"""Maps for how-the-us-captured-maduro (ledger rows V24-V26, V36-V38). Natural Earth, public domain.
Usage: python3 -I maps.py <natural-earth dir> <out dir>
"""
import json, math, sys

NE, OUT = sys.argv[1], sys.argv[2]
W, H = 1920, 1080
BG, LAND, WATER, FG, MUTED, ACCENT = '#0b0d12', '#1c2029', '#2b4a63', '#f4f1ea', 'rgba(244,241,234,0.62)', '#f2c94c'
FONT = "Inter, sans-serif"

# Ledger V38 (Wikipedia coordinates, opened 24 Oct 2026)
CARACAS = (10.50611, -66.91444)
FORT_TIUNA = (10.44084, -66.90906)
LA_CARLOTA = (10.485, -66.84361)
HIGUEROTE = (10.4625, -66.09306)
LA_GUAIRA = (10.6, -66.93306)
SAN_JUAN = (18.43917, -66.00194)


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




def label(proj, ll, text, size=28, color='#6f93ad', anchor='middle', spacing=6):
    x, y = proj(*ll)
    return f'<text x="{x:.0f}" y="{y:.0f}" text-anchor="{anchor}" font-size="{size}" font-weight="600" fill="{color}" letter-spacing="{spacing}">{text}</text>'


land = load('ne_10m_land')

# Map 1 (s080): the theatre. Puerto Rico (land-based jets, V24) to Caracas; distance V36.
p = Proj(14.45, -66.45, 52)
bbox = (5.0, 24.0, -76.0, -57.0)
body = f'<path d="{paths(land, p, bbox, True)}" fill="{LAND}" fill-rule="evenodd"/>'
sx, sy = p(*SAN_JUAN); cx, cy = p(*CARACAS)
body += f'<path d="M{sx:.1f},{sy:.1f}L{cx:.1f},{cy:.1f}" stroke="{ACCENT}" stroke-width="5" stroke-dasharray="16 12"/>'
body += dot(p, SAN_JUAN, 'Puerto Rico', 'jets seen launching here', side='right')
body += dot(p, CARACAS, 'Caracas', 'the target', side='right')
d = km(SAN_JUAN, CARACAS)
mx, my = (sx + cx) / 2, (sy + cy) / 2
body += f'<text x="{mx - 40:.0f}" y="{my:.0f}" text-anchor="end" font-size="34" font-weight="600" fill="{FG}">about {round(d, -1):.0f} km,</text><text x="{mx - 40:.0f}" y="{my + 44:.0f}" text-anchor="end" font-size="34" font-weight="600" fill="{FG}">straight line</text>'
body += label(p, (15.6, -62.6), 'CARIBBEAN SEA')
body += label(p, (8.3, -66.3), 'VENEZUELA', color=MUTED)
page('map-theatre', body)
print(f'San Juan-Caracas {d:.1f} km')

# Map 2 (s175): the coast. Reported strike sites outside the city (V25, V26); Higuerote ~90 km east (V37).
p = Proj(10.53, -66.5, 1050)
bbox = (9.5, 11.5, -68.0, -65.0)
body = f'<path d="{paths(land, p, bbox, True)}" fill="{LAND}" fill-rule="evenodd"/>'
body += dot(p, CARACAS, 'Caracas', None, side='left')
body += dot(p, LA_GUAIRA, 'La Guaira', 'port damaged', side='right', accent=False)
body += dot(p, HIGUEROTE, 'Higuerote', 'Buk air defence hit', side='left')
body += label(p, (10.75, -66.45), 'CARIBBEAN SEA')
dh = km(HIGUEROTE, CARACAS)
bar = 20 / (111.32 * math.cos(math.radians(10.5))) * p.s * math.cos(math.radians(10.53))  # 20 km east-west
body += f'<path d="M1330,600h{bar:.1f}" stroke="{FG}" stroke-width="4"/><text x="1330" y="585" font-size="28" fill="{MUTED}">20 km</text>'
page('map-coast', body)
print(f'Higuerote-Caracas {dh:.1f} km')

# Map 3 (s178): inside Caracas. Fort Tiuna (V23) and La Carlota air base (V26).
p = Proj(10.473, -66.876, 7000)
body = f'<rect width="{W}" height="{H}" fill="{LAND}"/>'
body += dot(p, CARACAS, 'Central Caracas', None, side='right', accent=False)
body += dot(p, LA_CARLOTA, 'La Carlota', 'air base', side='right')
body += dot(p, FORT_TIUNA, 'Fort Tiuna', "largest military complex; Maduro taken here (AP)", side='right')
dt = km(FORT_TIUNA, LA_CARLOTA)
bar = p.metres(2000)
body += f'<path d="M300,600h{bar:.1f}" stroke="{FG}" stroke-width="4"/><text x="{300 + bar / 2:.0f}" y="585" text-anchor="middle" font-size="28" fill="{MUTED}">2 km</text>'
page('map-caracas-v2', body)  # new name: the scene cache hashes image paths, not bytes
print(f'Fort Tiuna-La Carlota {dt:.1f} km')
