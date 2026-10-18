// FROZEN: read-only from phase 7 on. Need something it lacks? Write it in your scene file and report it (NOTES.md).
// Minimal WebGL2 helpers: context, programs, float render targets, canvas upload, passes.
// Every pass draws one fullscreen triangle generated from gl_VertexID; there are no buffers.

export const VERT = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export function createGL(canvas) {
  const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true, antialias: false, alpha: false });
  if (!gl) throw new Error('WebGL2 is not available');
  if (!gl.getExtension('EXT_color_buffer_float')) {
    throw new Error('EXT_color_buffer_float is missing: RGBA16F render targets are unavailable');
  }
  gl.bindVertexArray(gl.createVertexArray());
  return gl;
}

function shader(gl, type, src, name) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(`${name}: ${gl.getShaderInfoLog(s)}`);
  return s;
}

// Compiles vert + frag. Throws with the info log on failure. loc(name) caches uniform locations.
export function program(gl, frag, name = 'shader', vert = VERT) {
  const p = gl.createProgram();
  gl.attachShader(p, shader(gl, gl.VERTEX_SHADER, vert, `${name} (vertex)`));
  gl.attachShader(p, shader(gl, gl.FRAGMENT_SHADER, frag, name));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`${name}: ${gl.getProgramInfoLog(p)}`);
  const locs = new Map();
  const loc = (u) => (locs.has(u) ? locs.get(u) : locs.set(u, gl.getUniformLocation(p, u)).get(u));
  return { p, loc };
}

function texture(gl, filter) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

// RGBA16F colour target with linear filtering.
export function target(gl, w, h) {
  const tex = texture(gl, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) throw new Error(`RGBA16F framebuffer incomplete (0x${status.toString(16)})`);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fb, tex, w, h };
}

// A texture for a 2D canvas, sampled 1:1 (nearest) and decoded from sRGB to linear by the GPU.
export const canvasTexture = (gl) => texture(gl, gl.NEAREST);
export function uploadCanvas(gl, tex, canvas) {
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
}

// sRGB hex → linear [r, g, b].
export const linearRGB = (hex) => [0, 2, 4].map((i) => {
  const c = parseInt(hex.slice(1 + i, 3 + i), 16) / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});

// Uses prog and sets uniforms. Values: number → float, { i } → int/bool,
// [x, y(, z)] → vec2/vec3, { tex } → sampler on the next texture unit.
export function setUniforms(gl, prog, uniforms) {
  gl.useProgram(prog.p);
  let unit = 0;
  for (const [name, v] of Object.entries(uniforms)) {
    const l = prog.loc(name);
    if (typeof v === 'number') gl.uniform1f(l, v);
    else if (Array.isArray(v)) gl[`uniform${v.length}fv`](l, v);
    else if ('i' in v) gl.uniform1i(l, v.i);
    else {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, v.tex);
      gl.uniform1i(l, unit++);
    }
  }
}

// Draws prog as one fullscreen triangle into dst (a target, or null for the canvas).
export function pass(gl, prog, dst, uniforms) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, dst ? dst.fb : null);
  gl.viewport(0, 0, dst ? dst.w : gl.drawingBufferWidth, dst ? dst.h : gl.drawingBufferHeight);
  setUniforms(gl, prog, uniforms);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}
