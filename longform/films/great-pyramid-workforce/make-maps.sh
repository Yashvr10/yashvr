#!/bin/bash
# Rasterise the map pages with puppeteer's Chrome (run as builder, from longform/).
set -e
CH=$(ls -d /home/builder/.cache/puppeteer/chrome/*/chrome-linux64/chrome | head -1)
for m in map-egypt map-giza map-tura map-aswan; do
  "$CH" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1920,1080 --screenshot="$PWD/assets/maps/$m.png" "file://$PWD/assets/maps/$m.html" 2>/dev/null
done
ls -la assets/maps/*.png
