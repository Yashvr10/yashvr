#version 300 es
// The Canvas2D layer (straight alpha, decoded to linear on upload) over the background, in linear.
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uBack, uLayer;

void main() {
  vec4 fg = texture(uLayer, vUv);
  o = vec4(mix(texture(uBack, vUv).rgb, fg.rgb, fg.a), 1.0);
}
