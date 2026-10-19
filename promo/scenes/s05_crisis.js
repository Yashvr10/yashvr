// s05_crisis: the crisis. Scene type: 3D WALL (three.js).
// In through the zoom. A wall of dark tiles fills the frame; the camera pulls slowly back. A wave
// runs left to right across the tiles behind the text: each turns over (a half turn about its
// vertical axis, lifting forward as it turns) to show its back, and the backs together read
// "A humanitarian crisis in Gaza." dark on off-white. Ends on a hard cut.
//
// Facts (NOTES.md): the UN describes the situation in Gaza as a humanitarian crisis (UN OCHA,
// UN News; famine was confirmed in Gaza City in August 2025).
import { win, lerp, inOutCubic, outCubic } from '../engine/ease.js';
import { hash } from '../engine/rng.js';
import { lines, windows } from '../engine/copy.js';
import { base, fontOf } from '../engine/type.js';
import { L } from '../engine/layout.js';
import { THREE, stage, render3D, PIXEL_Z } from '../engine/three3d.js';
import { W, H, SS, colors, sizes } from '../tokens.js';
import { STYLE, block } from './_kit.js';

const ID = 's05_crisis';
const [LINE] = lines(ID);
export const dur = 4.4;

// Beats: the wave starts at WAVE[0] and crosses the turning tiles in WAVE[1] s (plus up to JITTER
// each); a tile turns over TURN s.
const WAVE = [0.45, 0.75], JITTER = 0.12, TURN = 0.55;
const DONE = WAVE[0] + WAVE[1] + JITTER + TURN;
export const captions = windows(ID, [{ lines: [0], in: WAVE[0], at: DONE }]);
export const end = Math.max(...captions.map((c) => c.out));

// The wall: tiles of TILE px at PITCH, enough to cover the frame at the closest camera (PULL[0]).
const TILE = 126, PITCH = 131, DEPTH = 18, PULL = [0.86, 1];
const COLS = Math.ceil(W / PITCH) + 1, ROWS = Math.ceil(H / PITCH) + 1;
const WW = COLS * PITCH, WH = ROWS * PITCH;
const TEXT = { ...STYLE.hero, size: Math.round(sizes.hero * 1.3) };

let S, tiles;
export async function load() {
  S = stage();
  // The backs' picture: the whole wall, off-white with the line in the ground colour, centred.
  const cv = document.createElement('canvas'), res = SS;
  cv.width = WW * res;
  cv.height = WH * res;
  const c = cv.getContext('2d');
  c.scale(res, res);
  c.fillStyle = colors.text;
  c.fillRect(0, 0, WW, WH);
  const b = block(c, LINE, TEXT, L.width * 0.9, { max: 2 }); // two rows: three would strand "A"
  const o = base({ ...TEXT, size: b.size });
  c.font = fontOf(o);
  c.letterSpacing = `${o.track * b.size}px`;
  c.fillStyle = colors.ground;
  c.textAlign = 'center';
  c.textBaseline = 'alphabetic';
  // Which tiles turn: whole tiles covering the text plus about 0.6 tile of margin, centred on the
  // wall; the text is then centred on those tiles, so the panel's margins come out even.
  const widest = Math.max(...b.rows.map((r) => c.measureText(r).width));
  const span = (n, len) => {
    const k = Math.ceil((len + 1.2 * PITCH) / PITCH), first = Math.floor((n - k) / 2);
    return [first * PITCH, (first + k) * PITCH];
  };
  const [x0, x1] = span(COLS, widest), [y0, y1] = span(ROWS, b.height);
  const box = { x0, x1, y0, y1 };
  const top = (y0 + y1) / 2 - b.height / 2;
  b.rows.forEach((r, k) => c.fillText(r, (x0 + x1) / 2, top + b.cap + k * b.lineH));
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;

  // Lambert (no specular): a glossy sheen would grey the dark type. Diffuse plus emission keeps the
  // paper near white without clipping, and the turn still shades it.
  const back = new THREE.MeshLambertMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.45 });
  const shades = [0, 1, 2].map((k) => new THREE.MeshStandardMaterial({ color: new THREE.Color(colors.tile).offsetHSL(0, 0, (k - 1) * 0.012), roughness: 0.8 }));
  const side = new THREE.MeshStandardMaterial({ color: new THREE.Color(colors.ground), roughness: 0.9 });
  tiles = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const cx = (col + 0.5) * PITCH, cy = (row + 0.5) * PITCH, i = row * COLS + col; // wall px, y down
      const turns = cx > box.x0 && cx < box.x1 && cy > box.y0 && cy < box.y1;
      const geo = new THREE.BoxGeometry(TILE, TILE, DEPTH);
      // The back face (−z, group 5) samples this tile's patch of the wall picture. After the half
      // turn its local −x is screen right, so u runs with −x; v runs up with y.
      const pos = geo.attributes.position, uv = geo.attributes.uv, g5 = geo.groups[5];
      for (let j = g5.start; j < g5.start + g5.count; j++) {
        const v = geo.index.getX(j);
        const lx = -pos.getX(v) / TILE + 0.5, ly = pos.getY(v) / TILE + 0.5;
        uv.setXY(v, (cx - TILE / 2 + lx * TILE) / WW, 1 - (cy + TILE / 2 - ly * TILE) / WH);
      }
      const m = new THREE.Mesh(geo, [side, side, side, side, shades[Math.floor(hash(i, 5) * 3)], back]);
      m.position.set(cx - WW / 2, WH / 2 - cy, 0);
      S.scene.add(m);
      // Each turning tile's start: the wave's arrival at its column, plus a little jitter.
      const at = WAVE[0] + WAVE[1] * ((cx - box.x0) / (box.x1 - box.x0)) + JITTER * hash(i, 9);
      tiles.push({ m, turns, at, z: (hash(i, 3) - 0.5) * 4 });
    }
  }
}

export function draw(ctx, t, d = dur) {
  for (const { m, turns, at, z } of tiles) {
    const u = turns ? inOutCubic(win(t, at, at + TURN)) : 0;
    m.rotation.y = Math.PI * u;
    m.position.z = z + 40 * Math.sin(Math.PI * u);
  }
  // The pull back: the camera starts at 86% of the pixel distance and ends at 100%.
  S.camera.position.set(0, 0, PIXEL_Z * lerp(PULL[0], PULL[1], outCubic(win(t, 0, d))));
  const frame = render3D(S);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(frame, 0, 0);
  ctx.restore();
}
