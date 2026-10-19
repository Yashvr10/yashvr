#version 300 es
// 3x3 tent upsample, blended additively into the next larger level.
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uSrc;
uniform vec2 uTexel; // 1 / source size

vec3 s(float x, float y) { return texture(uSrc, vUv + vec2(x, y) * uTexel).rgb; }

void main() {
  vec3 c = (s(-1.0, -1.0) + s(1.0, -1.0) + s(-1.0, 1.0) + s(1.0, 1.0))
    + 2.0 * (s(0.0, -1.0) + s(-1.0, 0.0) + s(1.0, 0.0) + s(0.0, 1.0))
    + 4.0 * s(0.0, 0.0);
  o = vec4(c / 16.0, 1.0);
}
