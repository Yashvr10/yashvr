#version 300 es
// 13-tap downsample (Jimenez, "Next Generation Post Processing in Call of Duty: AW").
// The first pass also applies a soft-knee threshold on luminance, with a narrow knee (10% of
// the threshold) so text just below it, white ink or saturated accent, stays out of the bloom.
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uSrc;
uniform vec2 uTexel; // 1 / source size
uniform float uThresh;
uniform bool uPrefilter;

vec3 s(float x, float y) { return texture(uSrc, vUv + vec2(x, y) * uTexel).rgb; }

void main() {
  vec3 c = s(0.0, 0.0) * 0.125
    + (s(-2.0, 2.0) + s(2.0, 2.0) + s(-2.0, -2.0) + s(2.0, -2.0)) * 0.03125
    + (s(0.0, 2.0) + s(-2.0, 0.0) + s(2.0, 0.0) + s(0.0, -2.0)) * 0.0625
    + (s(-1.0, 1.0) + s(1.0, 1.0) + s(-1.0, -1.0) + s(1.0, -1.0)) * 0.125;
  if (uPrefilter) {
    float br = dot(c, vec3(0.2126, 0.7152, 0.0722)), knee = uThresh * 0.1;
    float soft = clamp(br - uThresh + knee, 0.0, 2.0 * knee);
    soft = soft * soft / (4.0 * knee + 1e-5);
    c *= max(soft, br - uThresh) / max(br, 1e-5);
  }
  o = vec4(c, 1.0);
}
