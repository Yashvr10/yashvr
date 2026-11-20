import sys,json,time,urllib.request,urllib.parse
UA={"User-Agent":"openfilm-research/1.0 (educational video project)"}
def get(params):
    url="https://commons.wikimedia.org/w/api.php?"+urllib.parse.urlencode({**params,"format":"json"})
    for i in range(6):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=30))
        except Exception: time.sleep(3*(i+1))
out={}
for t in sys.argv[1:]:
    r=get({"action":"query","titles":t,"prop":"videoinfo","viprop":"url|size|derivatives|extmetadata|mediatype"})
    for p in r["query"]["pages"].values():
        vi=p["videoinfo"][0]; em=vi.get("extmetadata",{})
        ders=[d for d in vi.get("derivatives",[]) if "480p" in d.get("transcodekey","") or "360p" in d.get("transcodekey","")]
        lic=em.get("LicenseShortName",{}).get("value"); art=em.get("Artist",{}).get("value","")[:80]
        print(t,"|",vi.get("size"),"|",lic,"|",vi.get("width"),"x",vi.get("height"))
        for d in ders: print("   ",d.get("transcodekey"),d["src"][:150])
        out[t]={"url":vi["url"],"ders":ders,"lic":lic,"artist":art,"page":vi.get("descriptionurl")}
    time.sleep(1.5)
json.dump(out,open(sys.stdin.isatty() and "src/cinfo.json" or "src/cinfo.json","w"),indent=1)
