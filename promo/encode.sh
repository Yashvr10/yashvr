#!/usr/bin/env bash
# Encodes rendered frames (or a finished file) to H.264 MP4, then checks the result with verify.mjs.
#
#   ./encode.sh draft        [--in frames]      1× frames, veryfast, crf 23            → out/draft.mp4
#   ./encode.sh final1080    [--in frames]      1× frames, slow, crf 18                → out/final1080.mp4
#   ./encode.sh final1080ss  [--in frames_ss2]  2× frames, lanczos down to 1920×1080   → out/final1080ss.mp4
#   ./encode.sh final2160    [--in frames_ss2]  2× frames as they are, crf 18          → out/final2160.mp4
#   ./encode.sh upscale2160  [--in out/final1080.mp4]  a 1080p file, lanczos up to 3840×2160 (adds no detail)
#   ./encode.sh capped       [--in frames]      final1080 with -maxrate 12M -bufsize 24M
#   ./encode.sh addsilence   [--in out/final1080.mp4]  adds a silent 48 kHz stereo AAC track, video copied
#
# Options: --capped (cap any mode at 12 Mb/s), --vertical (centred 9:16 crop: 1080×1920 for the 1080
# modes, 2160×3840 for the 2160 ones), --solo <scene id> (FPS and frame count from that scene alone),
# --aspect 16x9|9x16 (default 16x9, this video's page default; pass --aspect 9x16 for the recomposed
# vertical frames from `render.mjs --aspect 9x16`: sizes become 1080×1920 or 2160×3840, named _vertical), --edit full|short, --in PATH, --out FILE. Every mode uses libx264 -pix_fmt yuv420p -movflags +faststart.
# Frames come from `node render.mjs video` (1×) or `node render.mjs video --ss 2 --out frames_ss2` (2×).
set -euo pipefail
cd "$(dirname "$0")"

mode="${1:-}"; shift || true
IN=""; OUT=""; CAPPED=0; VERTICAL=0; SOLO=""; ASPECT=16x9; EDIT=""  # 16:9 is this video's page default (tokens.js)
while [ $# -gt 0 ]; do
  case "$1" in
    --in) IN="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --capped) CAPPED=1; shift ;;
    --vertical) VERTICAL=1; shift ;;
    --solo) SOLO="$2"; shift 2 ;;
    --aspect) ASPECT="$2"; shift 2 ;;
    --edit) EDIT="$2"; shift 2 ;;
    *) echo "unknown option: $1" >&2; exit 2 ;;
  esac
done
[ "$mode" = capped ] && { mode=final1080; CAPPED=1; }
[ "$ASPECT" = 9x16 ] && [ "$VERTICAL" = 1 ] && { echo "--vertical crops 16:9 frames; 9:16 frames are vertical already" >&2; exit 2; }

warn() { echo "WARN $*" >&2; }
ff() { ffmpeg -hide_banner -loglevel error -y "$@"; }
X264=(-c:v libx264 -pix_fmt yuv420p -movflags +faststart)
CAP=(); [ "$CAPPED" = 1 ] && CAP=(-maxrate 12M -bufsize 24M)
SOLO_ARGS=(--aspect "$ASPECT"); [ -n "$SOLO" ] && SOLO_ARGS+=(--solo "$SOLO"); [ -n "$EDIT" ] && SOLO_ARGS+=(--edit "$EDIT")
# The default output name's suffix: _16x9 (output is landscape: --aspect 16x9 without --vertical, so
# a landscape encode never overwrites the portrait default), _vertical, _capped. It uses if, not `[ … ] && echo`: that
# form returns 1 when the test is false, and under set -e a substitution that returns 1 in an
# assignment aborts the script with no message (this is what broke runs without --out).
name_suffix() {
  local s=""
  if [ "$ASPECT" = 9x16 ] || [ "$VERTICAL" = 1 ]; then s="${s}_vertical"; fi
  if [ "$CAPPED" = 1 ]; then s="${s}_capped"; fi
  printf '%s' "$s"
}
# A landscape size w h as WxH in this aspect (swapped for native 9:16 frames).
dims() { if [ "$ASPECT" = 9x16 ]; then echo "${2}x${1}"; else echo "${1}x${2}"; fi; }

# The page is the source of truth for FPS (and verify.mjs takes the frame count from it too).
page_info() { node render.mjs info ${SOLO_ARGS[@]+"${SOLO_ARGS[@]}"} | tail -1; }
field() { node -e "console.log(JSON.parse(process.argv[1])[process.argv[2]])" "$1" "$2"; }

# Width × height of the first frame, so a 1× folder can't go through a 2× mode by mistake.
frame_size() { ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$1/f00000.png"; }
need_frames() { # dir expected-size
  [ -f "$1/f00000.png" ] || { echo "no frames in $1 (expected $1/f00000.png)" >&2; exit 1; }
  local got; got=$(frame_size "$1")
  [ "$got" = "$2" ] || { echo "$1 holds ${got} frames, $mode needs $2" >&2; exit 1; }
}

# Output geometry. Vertical takes the centred 9:16 crop of the 16:9 frame, then scales it.
vf_for() { # target-w target-h (landscape) → -vf value, or empty for none
  local w=$1 h=$2
  if [ "$VERTICAL" = 1 ]; then
    echo "crop=trunc(ih*9/16/2)*2:ih,scale=${h}:${w}:flags=lanczos"
  elif [ -n "${3:-}" ]; then
    echo "scale=$(dims "$w" "$h" | tr x :):flags=lanczos"
  fi
}

case "$mode" in
  draft|final1080|final1080ss|final2160)
    INFO=$(page_info); FPS=$(field "$INFO" FPS)
    case "$mode" in
      draft)       IN="${IN:-frames}";     need_frames "$IN" "$(dims 1920 1080)"; Q=(-preset veryfast -crf 23); VF=$(vf_for 1920 1080); W=1920; H=1080 ;;
      final1080)   IN="${IN:-frames}";     need_frames "$IN" "$(dims 1920 1080)"; Q=(-preset slow -crf 18);     VF=$(vf_for 1920 1080); W=1920; H=1080 ;;
      final1080ss) IN="${IN:-frames_ss2}"; need_frames "$IN" "$(dims 3840 2160)"; Q=(-preset slow -crf 18);     VF=$(vf_for 1920 1080 scale); W=1920; H=1080 ;;
      final2160)   IN="${IN:-frames_ss2}"; need_frames "$IN" "$(dims 3840 2160)"; Q=(-preset slow -crf 18);     VF=$(vf_for 3840 2160); W=3840; H=2160 ;;
    esac
    if [ "$ASPECT" = 9x16 ]; then
      T=$W; W=$H; H=$T
    elif [ "$VERTICAL" = 1 ]; then
      # The 9:16 crop of a 16:9 frame is 0.5625 × its height wide: 608 px of 1× frames, 1215 of 2×.
      [ "$mode" = draft ] || [ "$mode" = final1080 ] && warn "vertical from 1× frames upscales a 608 px wide crop to 1080: render --ss 2 and use final1080ss"
      [ "$mode" = final2160 ] && warn "vertical 2160×3840 upscales a 1215 px wide crop: it adds no detail"
      T=$W; W=$H; H=$T
    fi
    OUT="${OUT:-out/${mode}$(name_suffix).mp4}"
    mkdir -p "$(dirname "$OUT")"
    # -framerate must come before -i: it sets the rate the image sequence is read at.
    ff -framerate "$FPS" -start_number 0 -i "$IN/f%05d.png" ${VF:+-vf "$VF"} "${X264[@]}" "${Q[@]}" ${CAP[@]+"${CAP[@]}"} -r "$FPS" "$OUT"
    node verify.mjs "$OUT" --size "${W}x${H}" ${SOLO_ARGS[@]+"${SOLO_ARGS[@]}"}
    ;;
  upscale2160)
    IN="${IN:-out/final1080.mp4}"
    [ -f "$IN" ] || { echo "no input file $IN" >&2; exit 1; }
    warn "upscale2160 resamples a 1080p file to 2160p: it adds no detail, only pixels. Render --ss 2 and use final2160 for real 4K."
    if [ "$VERTICAL" = 1 ] || [ "$ASPECT" = 9x16 ]; then W=2160; H=3840; else W=3840; H=2160; fi
    OUT="${OUT:-out/upscale2160$(name_suffix).mp4}"
    ff -i "$IN" -map 0:v:0 -vf "scale=${W}:${H}:flags=lanczos" "${X264[@]}" -preset slow -crf 18 ${CAP[@]+"${CAP[@]}"} "$OUT"
    node verify.mjs "$OUT" --size "${W}x${H}" ${SOLO_ARGS[@]+"${SOLO_ARGS[@]}"}
    ;;
  addsilence)
    IN="${IN:-out/final1080.mp4}"
    [ -f "$IN" ] || { echo "no input file $IN" >&2; exit 1; }
    OUT="${OUT:-${IN%.mp4}_silence.mp4}"
    # The video stream is copied untouched; -shortest ends the endless anullsrc with the video.
    ff -i "$IN" -f lavfi -i anullsrc=channel_layout=stereo:sample_rate=48000 \
      -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 128k -shortest -movflags +faststart "$OUT"
    SIZE=$(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$OUT")
    node verify.mjs "$OUT" --size "$SIZE" ${SOLO_ARGS[@]+"${SOLO_ARGS[@]}"}
    ;;
  *)
    sed -n '2,17p' "$0" | sed 's/^# \{0,1\}//' >&2
    exit 2
    ;;
esac
