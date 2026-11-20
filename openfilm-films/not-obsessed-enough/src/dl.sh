cd "$(dirname "$0")/../assets/raw"
while read n u; do [ -s "$n" ] && continue; for i in 1 2 3 4; do curl -sfL -A "openfilm-research/1.0 (educational video project)" -o "$n" "$u" && break; rm -f "$n"; sleep $((i*10)); done; echo "$n $(stat -c %s "$n" 2>/dev/null)"; done < ../../src/downloads.txt
curl -s "https://archive.org/metadata/dalisdtx-President_Obama_Back_to_School_Address_2011" | python3 -c "import sys,json;d=json.load(sys.stdin);[print(f['name'],f.get('size'),f.get('format')) for f in d['files']]"
