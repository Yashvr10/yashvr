// wall: a wall of tiles in 3D (three.js) that fills the frame while the camera pulls slowly back. A
// wave runs left to right across the tiles behind the text; each turns over (a half turn about its
// vertical axis, lifting forward as it turns) and the backs together read the line, in the ground
// colour on the text colour. From the explainer's s05_crisis.
import { win, lerp, inOutCubic, outCubic } from '../engine/ease.js';
import { hash } from '../engine/rng.js';
import { base, fontOf } from '../engine/type.js';
import { L } from '../engine/layout.js';
import { THREE, stage, render3D, PIXEL_Z } from '../engine/three3d.js';
import { styles, windows, block, capOf, prepared, state, withDefaults } from './_lib.js';

export const name = 'wall';
export const params = {
  text: { type: 'string', required: true }, // up to 6 words; two rows at most
};

// The wave starts at WAVE[0] and crosses the turning tiles in WAVE[1] s (plus up to JITTER each);
// a tile turns over TURN s. Tiles of TILE px at PITCH cover the frame at the closest camera.
const WAVE = [0.45, 0.75], JITTER = 0.12, TURN = 0.55, DONE = WAVE[0] + WAVE[1] + JITTER + TURN;
const TILE = 126, PITCH = 131, DEPTH = 18, PULL = [0.86, 1];

export const captions = (p) => windows([{ text: p.text, in: WAVE[0], at: DONE }]);

export async function prepare(p0, T) {
  const p = withDefaults(params, p0), S = stage();
  const COLS = Math.ceil(T.W / PITCH) + 1, ROWS = Math.ceil(T.H / PITCH) + 1, WW = COLS * PITCH, WH = ROWS * PITCH;
  const TEXT = { ...styles(T).hero, size: Math.round(T.sizes.hero * 1.3) };
  // The backs' picture: the whole wall in the text colour, the line in the ground colour.
  const cv = document.createElement('canvas'), res = T.SS;
  cv.width = WW * res;
  cv.height = WH * res;
  const c = cv.getContext('2d');
  c.scale(res, res);
  c.fillStyle = T.colors.text;
  c.fillRect(0, 0, WW, WH);
  const b = block(c, p.text, TEXT, L.width * 0.9, { max: 2, capEm: capOf(T, TEXT) });
  const o = base({ ...TEXT, size: b.size });
  c.font = fontOf(o);
  c.letterSpacing = `${o.track * b.size}px`;
  c.fillStyle = T.colors.ground;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  // Which tiles turn: whole tiles covering the text plus about 0.6 tile of margin, centred on the
  // wall; the text is centred on those tiles, so the panel's margins come out even.
  const widest = Math.max(...b.rows.map((r) => c.measureText(r).width));
  const span = (n, len) => {
    const k = Math.ceil((len + 1.2 * PITCH) / PITCH), first = Math.floor((n - k) / 2);
    return [first * PITCH, (first + k) * PITCH];
  };
  const [x0, x1] = span(COLS, widest), [y0, y1] = span(ROWS, b.height);
  const top = (y0 + y1) / 2 - b.height / 2;
  b.rows.forEach((r, k) => c.fillText(r, (x0 + x1) / 2, top + b.cap + k * b.lineH));
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;

  // Lambert backs (no specular: a sheen would grey the type), lit plus emission.
  const back = new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: T.surface.back });
  const tileM = T.surface.tile;
  const shades = [0, 1, 2].map((k) => new THREE.MeshStandardMaterial({ color: new THREE.Color(T.colors.tile).offsetHSL(0, 0, (k - 1) * tileM.shade), roughness: tileM.roughness, metalness: tileM.metalness }));
  const side = new THREE.MeshStandardMaterial({ color: new THREE.Color(T.colors.ground), roughness: T.surface.side.roughness });
  const tiles = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cx = (col + 0.5) * PITCH, cy = (row + 0.5) * PITCH, i = row * COLS + col; // wall px, y down
      const turns = cx > x0 && cx < x1 && cy > y0 && cy < y1;
      const geo = new THREE.BoxGeometry(TILE, TILE, DEPTH);
      // The back face (−z, group 5) samples this tile's patch of the picture. After the half turn
      // its local −x is screen right, so u runs with −x; v runs up with y.
      const pos = geo.attributes.position, uv = geo.attributes.uv, g5 = geo.groups[5];
      for (let j = g5.start; j < g5.start + g5.count; j++) {
        const v = geo.index.getX(j);
        const lx = -pos.getX(v) / TILE + 0.5, ly = pos.getY(v) / TILE + 0.5;
        uv.setXY(v, (cx - TILE / 2 + lx * TILE) / WW, 1 - (cy + TILE / 2 - ly * TILE) / WH);
      }
      const m = new THREE.Mesh(geo, [side, side, side, side, shades[Math.floor(hash(i, 5) * 3)], back]);
      m.position.set(cx - WW / 2, WH / 2 - cy, 0);
      S.scene.add(m);
      const at = WAVE[0] + WAVE[1] * ((cx - x0) / (x1 - x0)) + JITTER * hash(i, 9);
      tiles.push({ m, turns, at, z: (hash(i, 3) - 0.5) * 4 });
    }
  }
  prepared.set(p0, { S, tiles });
}

export default function tpl(ctx, t, dur, p0) {
  const { S, tiles } = state(p0, name);
  for (const { m, turns, at, z } of tiles) {
    const u = turns ? inOutCubic(win(t, at, at + TURN)) : 0;
    m.rotation.y = Math.PI * u;
    m.position.z = z + 40 * Math.sin(Math.PI * u);
  }
  // The pull back: from 86% of the pixel distance to 100%.
  S.camera.position.set(0, 0, PIXEL_Z * lerp(PULL[0], PULL[1], outCubic(win(t, 0, dur))));
  const frame = render3D(S);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(frame, 0, 0);
  ctx.restore();
}
