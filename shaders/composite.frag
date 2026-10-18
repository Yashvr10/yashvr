#version 300 es
// Background, then the three.js layer, then the Canvas2D layer, all in linear light.
// Both layers are straight alpha and decoded from sRGB to linear on upload.
// uPaper (0..1) multiplies the paper texture over everything: the layers are composited over the
// plain paper colour uPaperRef, then scaled by the background's variation about it (back / ref).
// At 1 an opaque field still reads as printed paper; at 0 the background simply shows through.
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uBack, uThree, uLayer;
uniform bool uHasThree;
uniform float uPaper;
uniform vec3 uPaperRef; // linear

void main() {
  vec3 b = texture(uBack, vUv).rgb, c = mix(b, uPaperRef, uPaper);
  if (uHasThree) {
    vec4 m = texture(uThree, vUv);
    c = mix(c, m.rgb, m.a);
  }
  vec4 fg = texture(uLayer, vUv);
  c = mix(c, fg.rgb, fg.a);
  o = vec4(c * mix(vec3(1.0), b / uPaperRef, uPaper), 1.0);
}
