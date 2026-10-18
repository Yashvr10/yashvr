#version 300 es
// Background, then the three.js layer, then the Canvas2D layer, all in linear light.
// Both layers are straight alpha and decoded from sRGB to linear on upload.
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uBack, uThree, uLayer;
uniform bool uHasThree;

void main() {
  vec3 c = texture(uBack, vUv).rgb;
  if (uHasThree) {
    vec4 m = texture(uThree, vUv);
    c = mix(c, m.rgb, m.a);
  }
  vec4 fg = texture(uLayer, vUv);
  o = vec4(mix(c, fg.rgb, fg.a), 1.0);
}
