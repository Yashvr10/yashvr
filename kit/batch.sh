#!/usr/bin/env bash
# Renders and encodes every job: jobs/<name>.json → out/<name>.mp4, with the existing harness
# (render.mjs, encode.sh, verify.mjs). Jobs whose MP4 already exists are skipped; delete the MP4 to
# re-render. A job that fails validation or rendering is reported and the batch goes on.
#
#   ./batch.sh [jobs/a.json …]     default: every jobs/*.json
#
# Env: WORKERS (default 3) render processes per job; SS=1|2 (default 1): 2 renders 2× frames and
# encodes with final1080ss (lanczos down), 1 uses final1080; KEEP_FRAMES=1 keeps frames_<name>/.
# Each job's timing goes to out/batch.log (seconds rendering, encoding, and per frame).
set -euo pipefail
cd "$(dirname "$0")"
WORKERS="${WORKERS:-3}"; SS="${SS:-1}"; KEEP_FRAMES="${KEEP_FRAMES:-0}"
mkdir -p out
[ $# -gt 0 ] && JOBS=("$@") || JOBS=(jobs/*.json)
failed=()
for job in "${JOBS[@]}"; do
  name="$(basename "$job" .json)"; mp4="out/${name}.mp4"
  if [ -f "$mp4" ]; then echo "skip   $name: $mp4 exists"; continue; fi
  aspect="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")).aspect)' "$job")"
  frames="frames_${name}"
  echo "render $name ($aspect, ss=$SS, $WORKERS workers)"
  t0=$(date +%s)
  if ! node render.mjs video --job "$job" --ss "$SS" --workers "$WORKERS" --out "$frames" > "out/${name}.render.log" 2>&1; then
    echo "FAIL   $name: render failed (out/${name}.render.log):"; grep -m3 -E "ERROR|error" "out/${name}.render.log" || tail -3 "out/${name}.render.log"
    failed+=("$name"); continue
  fi
  t1=$(date +%s)
  mode=final1080; [ "$SS" = 2 ] && mode=final1080ss
  if ! ./encode.sh "$mode" --job "$job" --aspect "$aspect" --in "$frames" --out "$mp4" > "out/${name}.encode.log" 2>&1; then
    echo "FAIL   $name: encode or verify failed (out/${name}.encode.log)"; tail -5 "out/${name}.encode.log"
    rm -f "$mp4"; failed+=("$name"); continue
  fi
  t2=$(date +%s)
  n=$(ls "$frames" | grep -c '^f[0-9]*\.png$')
  line="$name: $n frames, render $((t1 - t0)) s ($(awk "BEGIN{printf \"%.2f\", ($t1-$t0)/$n}") s/frame wall, $WORKERS workers, ss=$SS), encode $((t2 - t1)) s"
  echo "done   $line"; echo "$(date -u +%FT%TZ) $line" >> out/batch.log
  grep -E "^(ok|FAIL) " "out/${name}.encode.log" | sed 's/^/       /'
  [ "$KEEP_FRAMES" = 1 ] || rm -rf "$frames"
done
if [ ${#failed[@]} -gt 0 ]; then echo "failed: ${failed[*]}"; exit 1; fi
echo "all jobs done"
