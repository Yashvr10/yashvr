// three.js layer for renderFrame(t). One renderer on its own canvas; post.js uploads that canvas
// between the background and the 2D layer. No animation loop, Clock or mixers: every transform
// is set from t before each render. three's tone mapping is off because post applies ACES.
import * as THREE from './vendor/three.module.js';
import { RoomEnvironment } from './vendor/RoomEnvironment.js';
import { clamp01, win, lerp, outExpo, inOutQuint } from './ease.js';
import { W, H, radius, shadowAlpha } from '../tokens.js';

export { THREE };

const FOV = 30, DEG = Math.PI / 180;
// Camera distance at which one unit is one pixel on the z = 0 plane.
export const PIXEL_Z = H / 2 / Math.tan((FOV / 2) * DEG);

let renderer;
export function renderer3D() {
  if (renderer) return renderer;
  renderer = new THREE.WebGLRenderer({
    canvas: document.createElement('canvas'), antialias: true, preserveDrawingBuffer: true, alpha: true,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(W, H, false);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

// A scene lit by RoomEnvironment (through PMREM) and one top-left key light, with a pixel
// camera: origin at the frame centre, y up, one unit = one pixel at z = 0.
export function stage() {
  const r = renderer3D(), scene = new THREE.Scene(), pmrem = new THREE.PMREMGenerator(r);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.5;
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xffffff, 0.9);
  key.position.set(-1, 1, 1.2).multiplyScalar(1000);
  scene.add(key);
  const camera = new THREE.PerspectiveCamera(FOV, W / H, 10, 20000);
  camera.position.set(0, 0, PIXEL_Z);
  return { scene, camera };
}

// Renders a stage and returns the canvas for post to upload.
export function render3D({ scene, camera }) {
  renderer.render(scene, camera);
  return renderer.domElement;
}

function rounded(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// Every material under obj fades together; each keeps its own base opacity.
function setOpacity(obj, a) {
  obj.traverse((o) => {
    if (o.material) o.material.opacity = (o.material.userData.base ?? 1) * a;
  });
}

// A rounded card, its front face at z = 0, textured from a 2D canvas (res × its size) with UVs
// normalised to its bounds. Returns a Group; position, rotation and opacity go on the group.
export function card(w, h, { r = 24, depth = 0, res = 2 } = {}) {
  const geo = depth > 0
    ? new THREE.ExtrudeGeometry(rounded(w, h, r), { depth, bevelEnabled: false, curveSegments: 12 }).translate(0, 0, -depth)
    : new THREE.ShapeGeometry(rounded(w, h, r), 12);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5);

  const canvas = document.createElement('canvas');
  canvas.width = w * res;
  canvas.height = h * res;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer3D().capabilities.getMaxAnisotropy();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.55, metalness: 0, transparent: true }));
  const group = new THREE.Group();
  group.add(mesh);
  group.userData = { canvas, texture, w, h, res, key: undefined };
  return group;
}

// Redraws a card's texture with draw(ctx, w, h) in card pixels. With a key, it only redraws
// and re-uploads when the key differs from the last one (draw must depend only on the key).
export function setCardContent(c, draw, key) {
  const d = c.userData;
  if (key !== undefined && key === d.key) return false;
  const ctx = d.canvas.getContext('2d');
  ctx.reset();
  ctx.scale(d.res, d.res);
  draw(ctx, d.w, d.h);
  d.texture.needsUpdate = true;
  d.key = key;
  return true;
}

// A glossy rounded extruded tile, centred on its origin.
export function tile(size, { color = 0xffffff, r = radius } = {}) {
  const b = size * 0.04;
  const geo = new THREE.ExtrudeGeometry(rounded(size - 2 * b, size - 2 * b, r), {
    depth: size * 0.2, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 4, curveSegments: 10,
  }).center();
  return new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color, clearcoat: 1, clearcoatRoughness: 0.1, roughness: 0.25, metalness: 0 }));
}

// A blurred, transparent shadow plane for an object of w × h; position it under or behind it.
export function softShadow(w, h, { blur = 28, alpha = shadowAlpha } = {}) {
  const pad = blur * 2, canvas = document.createElement('canvas');
  canvas.width = w + 2 * pad;
  canvas.height = h + 2 * pad;
  const g = canvas.getContext('2d');
  g.filter = `blur(${blur}px)`;
  g.fillStyle = '#000';
  g.beginPath();
  g.roundRect(pad, pad, w, h, radius);
  g.fill();
  const map = new THREE.CanvasTexture(canvas);
  const mat = new THREE.MeshBasicMaterial({ map, transparent: true, opacity: alpha, depthWrite: false });
  mat.userData.base = alpha;
  return new THREE.Mesh(new THREE.PlaneGeometry(canvas.width, canvas.height), mat);
}

// Flies a card in from z −800 to z, untilting 18° (y) and 8° (x), outExpo over dur.
// Hidden before t0, then fades in over its first 0.12 s.
export function landCard(c, t, t0, { z = 0, dur = 0.7 } = {}) {
  const u = outExpo(win(t, t0, t0 + dur));
  c.visible = t >= t0;
  c.position.z = lerp(-800, z, u);
  c.rotation.y = lerp(18 * DEG, 0, u);
  c.rotation.x = lerp(8 * DEG, 0, u);
  setOpacity(c, clamp01((t - t0) / 0.12));
}

// Spreads a stack of cards into a fan: x by spacing, a slight arc down and a tilt out.
export function fan(cards, t, t0, { dur = 0.9, spacing = 470, angle = 4, arc = 22 } = {}) {
  const u = inOutQuint(win(t, t0, t0 + dur)), mid = (cards.length - 1) / 2;
  cards.forEach((c, i) => {
    const k = i - mid;
    c.position.x = k * spacing * u;
    c.position.y = -Math.abs(k) * arc * u;
    c.rotation.z = -k * angle * DEG * u;
  });
}

// Camera trucks along the wall from −pan to +pan while pushing in by push (a fraction of the
// pixel distance), inOutQuint between t0 and t1. It always looks straight ahead.
export function wallDolly(camera, t, t0, t1, { pan = 60, push = 0.06 } = {}) {
  const u = inOutQuint(win(t, t0, t1));
  camera.position.set(lerp(-pan, pan, u), 0, PIXEL_Z * (1 - push * u));
  camera.rotation.set(0, 0, 0);
}
