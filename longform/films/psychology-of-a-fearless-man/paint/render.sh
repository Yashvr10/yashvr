#!/bin/bash
# Paint scenes and finish them: films/psychology-of-a-fearless-man/paint/render.sh storm desk ...   (QUICK=1 for half-size tests)
# Run as builder from longform/.
set -e
P=films/psychology-of-a-fearless-man/paint
if [ "$QUICK" = 1 ]; then node $P/render-paint.mjs --quick "$@"; exit 0; fi
node $P/render-paint.mjs "$@"
mkdir -p assets/paintings
for s in "$@"; do
  # finish: soften digital edges, add canvas grain and a vignette
  ffmpeg -v error -y -i build/paint/$s.raw.png -f lavfi -i "nullsrc=s=1920x1080,geq=lum='128+60*random(1)':cb=128:cr=128,boxblur=lr=9:lp=1:cr=0:cp=1,gblur=sigma=1.2" \
    -filter_complex "[0]gblur=sigma=0.9,format=gbrp[p];[1]format=gbrp[t];[p][t]blend=all_mode=softlight:all_opacity=0.32,noise=alls=6:allf=u,vignette=PI/5,eq=contrast=1.05:saturation=0.95[o]" -map "[o]" -frames:v 1 assets/paintings/$s.png
done
