#version 300 es
// Post chain, in order: bloom, exposure, ACES fitted, grade, radial chromatic aberration,
// vignette, luminance-weighted grain. Output is sRGB. With uPost off: plain sRGB encode.
precision highp float;
in vec2 vUv;
out vec4 o;
uniform sampler2D uScene, uBloomTex;
uniform vec2 uRes;
uniform float uBloom, uExposure, uCA, uVig, uGrain;
uniform int uFrame;
uniform bool uPost;

vec3 srgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  return mix(12.92 * c, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
}

// Stephen Hill's ACES fit (RRT + ODT), with the usual 1/0.6 exposure normalisation.
vec3 aces(vec3 c) {
  const mat3 IN = mat3(0.59719, 0.07600, 0.02840, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777);
  const mat3 OUT = mat3(1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602);
  c = IN * (c / 0.6);
  c = (c * (c + 0.0245786) - 0.000090537) / (c * (0.983729 * c + 0.4329510) + 0.238081);
  return clamp(OUT * c, 0.0, 1.0);
}

// Display-space grade: gentle S-curve, warm highs and cool lows, each at most 6%.
vec3 grade(vec3 c) {
  c = mix(c, c * c * (3.0 - 2.0 * c), 0.2);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c *= mix(vec3(1.0), vec3(1.06, 1.02, 0.94), smoothstep(0.5, 1.0, l));
  c *= mix(vec3(1.0), vec3(0.94, 0.99, 1.06), 1.0 - smoothstep(0.0, 0.4, l));
  return clamp(c, 0.0, 1.0);
}

vec3 chain(vec2 uv) {
  vec3 c = texture(uScene, uv).rgb + texture(uBloomTex, uv).rgb * uBloom;
  return grade(srgb(aces(c * uExposure)));
}

uint pcg(uint v) {
  uint s = v * 747796405u + 2891336453u;
  uint w = ((s >> ((s >> 28u) + 4u)) ^ s) * 277803737u;
  return (w >> 22u) ^ w;
}

void main() {
  if (!uPost) {
    o = vec4(srgb(texture(uScene, vUv).rgb), 1.0);
    return;
  }
  // Red and blue split radially; uCA px at the middle of each edge.
  vec2 d = (vUv - 0.5) * 2.0 * uCA / uRes;
  vec3 c = vec3(chain(vUv + d).r, chain(vUv).g, chain(vUv - d).b);

  vec2 p = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - uVig * smoothstep(0.35, 1.05, length(p));

  // Grain, strongest in the mid-tones, re-seeded every frame.
  uvec2 q = uvec2(gl_FragCoord.xy);
  float n = float(pcg(q.x + pcg(q.y + pcg(uint(uFrame))))) / 4294967295.0 - 0.5;
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c += n * uGrain * (0.35 + 0.65 * 4.0 * l * (1.0 - l));
  o = vec4(clamp(c, 0.0, 1.0), 1.0);
}
