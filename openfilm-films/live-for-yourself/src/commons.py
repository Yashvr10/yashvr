# Public-domain paintings from Wikimedia Commons for the Spartan film (v2: the user asked for paintings and archival
# footage instead of statues). Each query -> up to N files whose licence is public domain; saved as
# assets/photos/<theme>-c<n>.jpg (longest side 2400 px) and added to src/images.json + src/photo-credits.json.
#   python3 src/commons.py [N]
import json, os, re, subprocess, sys, io, time, urllib.parse
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
N = int(sys.argv[1]) if len(sys.argv) > 1 else 4
UA = "Mozilla/5.0 (compatible; film-research-bot/1.0)"
Q = {
 "marcus": ["Marcus Aurelius painting", "Marcus Aurelius Delacroix last words", "Roman emperor tent camp painting", "Marcus Aurelius equestrian"],
 "adler": ["Alfred Adler", "Alfred Adler psychologist photograph", "Vienna 1900 photograph street", "Vienna Ringstrasse 1900"],
 "crowd": ["crowd painting 19th century", "audience theatre painting 19th century", "gossip painting 19th century", "salon party painting 19th century"],
 "face": ["portrait of a man painting 19th century dark", "melancholy painting man", "self-portrait Rembrandt", "young man portrait painting 19th century"],
 "night": ["moonlight painting 19th century", "man alone at night painting", "candlelight painting interior"],
 "alone": ["Caspar David Friedrich wanderer", "Caspar David Friedrich monk by the sea", "solitary figure landscape painting", "man walking alone painting road"],
 "theatre": ["theatre masks painting", "actor on stage painting 19th century", "Degas theatre painting", "harlequin painting"],
 "child": ["child first steps painting", "Millet first steps", "children painting 19th century", "boy portrait painting 19th century"],
 "school": ["village school painting 19th century", "schoolroom painting", "punished child painting", "school prize painting"],
 "feast": ["dinner party painting 19th century", "birthday party painting", "Renoir luncheon of the boating party", "dance painting 19th century"],
 "writer": ["man writing at desk painting 19th century", "philosopher writing painting", "Sigmund Freud photograph"],
 "storm": ["storm at sea painting", "shipwreck painting romantic", "mountain climber painting"],
 "morning": ["sunrise painting romantic", "Caspar David Friedrich sunrise", "morning light landscape painting"],
 "race": ["chariot race painting", "horse race painting Degas", "running race painting ancient", "Olympic games painting"],
 "horse": ["horse drinking water painting", "horse at water trough painting", "horse painting Stubbs"],
 "work": ["painter at easel painting", "craftsman workshop painting 19th century", "baker painting 19th century"],
 "help": ["Good Samaritan painting", "helping the poor painting", "nurse caring painting 19th century"],
 "salon": ["Paris Salon painting exhibition", "Salon 1880 painting crowd exhibition", "art jury painting Salon", "Louvre gallery painting visitors"],
 "academic": ["Cabanel Birth of Venus", "Bouguereau painting", "Gerome painting history", "academic painting mythology"],
 "manet": ["Manet Le Dejeuner sur l'herbe", "Manet Olympia", "Edouard Manet portrait Fantin-Latour", "Manet painting"],
 "monet": ["Claude Monet photograph", "Renoir Monet painting in his garden", "Monet portrait Renoir", "Bazille studio painting"],
 "impression": ["Monet Impression Sunrise", "Monet Gare Saint-Lazare", "Pissarro Boulevard Montmartre", "Renoir Bal du moulin de la Galette", "Monet poppies", "Degas dancers"],
 "diogenes": ["Diogenes painting Waterhouse", "Diogenes Gerome", "Diogenes lantern painting"],
 "alexander": ["Alexander and Diogenes painting", "Alexander the Great painting", "Alexander Diogenes Caspar de Crayer"],
 "socrates": ["Death of Socrates David", "Socrates painting", "Socrates trial painting"],
 "mother": ["mother and child painting 19th century", "Mary Cassatt mother child", "old woman portrait painting"],
}
def api(params):
    u = "https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode({**params, "format": "json"})
    for i in range(4):
        try: return json.loads(subprocess.check_output(["curl", "-s", "-A", UA, "--max-time", "60", u]))
        except Exception: time.sleep(3 * (i + 1))
    return {}
P = json.load(open("src/images.json")); C = json.load(open("src/photo-credits.json"))
seen = {c.get("source") for c in C.values()}
for th, qs in Q.items():
    for q in qs:
        r = api(dict(action="query", generator="search", gsrsearch=f"{q} filetype:bitmap", gsrnamespace=6, gsrlimit=15,
                     prop="imageinfo", iiprop="url|extmetadata|size", iiurlwidth=1920))
        pages = sorted((r.get("query") or {}).get("pages", {}).values(), key=lambda p: p.get("index", 99)); got = 0
        for p in pages:
            ii = (p.get("imageinfo") or [{}])[0]; md = ii.get("extmetadata", {})
            lic = (md.get("LicenseShortName", {}).get("value", "") + " " + md.get("License", {}).get("value", "")).lower()
            if got >= N or ii.get("descriptionurl") in seen or not ("public domain" in lic or "pd" in lic.split() or lic.startswith("pd") or "cc0" in lic): continue
            if min(ii.get("width", 0), ii.get("height", 0)) < 600 or not re.search(r"\.(jpe?g|png|tif)", p["title"], re.I): continue
            k = f"{th}-c{len([x for x in P.get(th, []) if '-c' in x]) + 1}"
            try:
                b = subprocess.check_output(["curl", "-sL", "-A", UA, "--max-time", "120", ii.get("thumburl") or ii["url"]])
                im = Image.open(io.BytesIO(b)).convert("RGB"); im.thumbnail((2400, 2400)); im.save(f"assets/photos/{k}.jpg", quality=88)
            except Exception as e: print("fail", p["title"], e); continue
            seen.add(ii.get("descriptionurl")); got += 1; P.setdefault(th, []).append(k)
            strip = lambda s: re.sub(r"<[^>]+>", "", s or "").strip()
            C[k] = dict(title=p["title"].replace("File:", ""), artist=strip(md.get("Artist", {}).get("value"))[:80], license=strip(md.get("LicenseShortName", {}).get("value")),
                        source=ii.get("descriptionurl"), kind="painting")
            time.sleep(0.3)
        print(th, q, got, flush=True)
json.dump(P, open("src/images.json", "w"), indent=1); json.dump(C, open("src/photo-credits.json", "w"), indent=1)
print(sum(1 for k in C if "-c" in k), "Commons paintings")
