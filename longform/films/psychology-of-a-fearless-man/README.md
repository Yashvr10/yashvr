# The Psychology of a Fearless Man (5 min)
Every picture in this film is painted in code with p5.js 2.2.3 + p5.brush 3.0.0 (MIT licence, copy in paint/), in the manner of the owner's reference paintings.
- paint/lib.js: painting toolkit (native p5 gradients and glows for soft light, p5.brush watercolour masses, flat/dry/oil custom brushes, figures, trees, sea, architecture). Paint in layers: each layer is one p5 frame, because p5.brush composites its strokes at the end of each frame.
- paint/scenes/<name>.js: one composition per picture. 13 paintings: storm, campfire, corridor, street, elcap, bomb, athens, diogenes, desk, strongman, shadow, forestpath, road.
- paint/render.sh <names>: paints with headless Chrome (render-paint.mjs waits for the layered painting to finish), then a finishing pass in ffmpeg adds brush-streak and canvas texture, grain and a vignette -> assets/paintings/<name>.png. QUICK=1 renders half-size tests in about 10-30 s each.
