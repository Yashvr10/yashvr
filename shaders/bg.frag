#version 300 es
// FROZEN: read-only from phase 7 on. Need something it lacks? Write it in your scene file and report it (NOTES.md).
// Domain-warped fbm mapped through a three-colour ramp (uBg → uDim → uAccent, from
// tokens.background) and mixed over uBg by uAmt; uDrift scales its motion (0 = static paper).
// uFibre adds static paper noise with that standard deviation in display units, in cells of
// uFibreScale px.
precision highp float;
in vec2 vUv;
out vec4 o;
uniform float uTime;
uniform vec2 uRes;
uniform int uFrame;
uniform int uOne; // always 1: a runtime loop bound so the compiler can't unroll
uniform vec3 uBg, uDim, uAccent; // linear
uniform float uAmt, uDrift, uFibre, uFibreScale;

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
  float t = uTime * 0.04 * uDrift;
  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.5 * q + vec2(1.7, 9.2) + 1.5 * t), fbm(p + 3.5 * q + vec2(8.3, 2.8) - t));
  float f = smoothstep(0.25, 0.85, fbm(p + 3.5 * r));
  vec3 ramp = f < 0.5 ? mix(uBg, uDim, f * 2.0) : mix(uDim, uAccent, f * 2.0 - 1.0);
  vec3 c = mix(uBg, ramp, uAmt);
  // Uniform noise of std uFibre (amplitude × √12), added in display gamma, fixed per pixel.
  uvec2 px = uvec2(gl_FragCoord.xy / uFibreScale);
  uint hv = px.x * 747796405u ^ (px.y * 2891336453u + 0x9e3779b9u);
  hv = ((hv >> ((hv >> 28u) + 4u)) ^ hv) * 277803737u;
  float n = float((hv >> 22u) ^ hv) / 4294967295.0 - 0.5;
  c = pow(max(pow(c, vec3(1.0 / 2.2)) + n * uFibre * 3.4641, 0.0), vec3(2.2));
  o = vec4(c, 1.0);
}
