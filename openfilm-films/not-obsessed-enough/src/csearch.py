import sys,json,time,urllib.request,urllib.parse
UA={"User-Agent":"openfilm-research/1.0 (educational video project)"}
def get(params):
    url="https://commons.wikimedia.org/w/api.php?"+urllib.parse.urlencode({**params,"format":"json"})
    for i in range(6):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=30))
        except Exception as e:
            time.sleep(3*(i+1))
    return {}
for q in sys.argv[1:]:
    r=get({"action":"query","list":"search","srnamespace":6,"srlimit":10,"srsearch":q})
    print("==",q)
    for x in r.get("query",{}).get("search",[]): print("  ",x["title"])
    time.sleep(1.5)
