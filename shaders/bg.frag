#version 300 es
// Slow domain-warped fbm, mapped through bg → dim → accent and mixed over bg at low intensity.
precision highp float;
in vec2 vUv;
out vec4 o;
uniform float uTime;
uniform vec2 uRes;
uniform int uFrame;
uniform int uOne; // always 1: a runtime loop bound so the compiler can't unroll
uniform vec3 uBg, uDim, uAccent; // linear
uniform float uAmt;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + 1.0), u.x), u.y);
}
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 5 * uOne; i++) {
    s += a * noise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    a *= 0.5;
  }
  return s;
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0) * 1.8;
  float t = uTime * 0.04;
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.5 * q + vec2(1.7, 9.2) + 1.5 * t), fbm(p + 3.5 * q + vec2(8.3, 2.8) - t));
  float f = smoothstep(0.25, 0.85, fbm(p + 3.5 * r));
  vec3 ramp = f < 0.5 ? mix(uBg, uDim, f * 2.0) : mix(uDim, uAccent, f * 2.0 - 1.0);
  o = vec4(mix(uBg, ramp, uAmt), 1.0);
}
