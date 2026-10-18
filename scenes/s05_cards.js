import { win, lerp, outCubic, inOutQuint } from '../engine/ease.js';
import { shade } from '../engine/draw.js';
import {
  THREE, stage, render3D, renderer3D, card, tile, softShadow, setCardContent, landCard, fan, wallDolly,
} from '../engine/three3d.js';
import { lines, windows, parseNumber, registerBox } from '../engine/copy.js';
import { W, H, colors, fonts, tracking } from '../tokens.js';

const ID = 's05_cards';
// Copy: [chart label, stat label, stat total, stat delta, checklist label, 4 checklist items].
const T = lines(ID);

// Cards land 0.3 / 0.75 / 1.2 s, fan at 2.0–2.9 s, the counter runs 3.4–5.2 s and the camera
// settles at 5.5 s, so the final layout holds still for the last 1.5 s.
// Cards land in their own slots (95% of the fanned spacing, just apart) so none lands hidden behind another.
const CW = 440, CH = 320, LAND = [0.3, 0.75, 1.2], FAN = 2.0, SLOT = 0.95, COUNT = [3.4, 5.2], SETTLE = 5.5, TOTAL = parseNumber(T[2]).value;
// The stat card's label and total are the caption, settled when the count lands.
export const captions = windows(ID, [{ lines: [1, 2], in: COUNT[0], at: COUNT[1] }]);
export const dur = Math.max(7, captions[0].out);
export const end = dur;
// Paper-style faces: paper-shade surface, ink type (dark faces lost the ink text after the palette moved to paper).
const surface = colors.paper;

let st, cards, tiles;

// Card faces, in card pixels.
function face(ctx, w, h, label) {
  ctx.fillStyle = surface;
  ctx.fillRect(0, 0, w, h);
  ctx.font = `400 18px ${fonts.mono}`;
  ctx.letterSpacing = `${tracking.label * 18}px`;
  ctx.fillStyle = colors.ink;
  ctx.fillText(label, 32, 48);
  ctx.letterSpacing = '0px';
}
function drawChart(ctx, w, h) {
  face(ctx, w, h, T[0]);
  [0.42, 0.58, 0.5, 0.71, 0.64, 0.82, 1].forEach((v, i) => {
    ctx.fillStyle = i === 6 ? colors.accent : shade(colors.dim, -0.1);
    ctx.beginPath();
    ctx.roundRect(36 + i * 54, h - 40 - v * 190, 34, v * 190, 6);
    ctx.fill();
  });
  ctx.fillStyle = colors.dim;
  ctx.fillRect(32, h - 38, w - 64, 2);
}
const thousands = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const drawStat = (value) => (ctx, w, h) => {
  face(ctx, w, h, T[1]);
  ctx.font = `700 104px ${fonts.display}`;
  ctx.letterSpacing = `${tracking.display * 104}px`;
  ctx.fillStyle = colors.ink;
  ctx.fillText(thousands(value), 30, 186);
  ctx.letterSpacing = '0px';
  ctx.font = `400 26px ${fonts.body}`;
  ctx.fillStyle = colors.accent;
  ctx.fillText(T[3], 32, 250);
};
function drawChecklist(ctx, w, h) {
  face(ctx, w, h, T[4]);
  T.slice(5, 9).forEach((item, i) => {
    const y = 100 + i * 52;
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(46, y - 9, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.bg;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(40, y - 9);
    ctx.lineTo(45, y - 4);
    ctx.lineTo(53, y - 14);
    ctx.stroke();
    ctx.font = `400 26px ${fonts.body}`;
    ctx.fillStyle = colors.ink;
    ctx.fillText(item, 74, y);
  });
}

export async function load() {
  st = stage();
  cards = [drawChart, drawStat(0), drawChecklist].map((draw, i) => {
    const c = card(CW, CH, { depth: 6 });
    const shadow = softShadow(CW, CH);
    shadow.position.set(10, -22, -40);
    c.add(shadow);
    setCardContent(c, draw, i === 1 ? 0 : 'static');
    st.scene.add(c);
    return c;
  });
  // Two glossy accent tiles far behind the cards, clear of the fanned layout.
  tiles = [[-960, 360, -500, 150], [980, -380, -420, 120]].map(([x, y, z, size]) => {
    const m = tile(size, { color: colors.accent });
    m.position.set(x, y, z);
    st.scene.add(m);
    return m;
  });
  // Compile every program now, so the first renderFrame never does it.
  renderer3D().compile(st.scene, st.camera);
}

// Text on a card lives in its texture, so register its screen boxes for the copy checks by
// projecting the card-pixel rectangles [x0, y0, x1, y1, text] through the camera.
const corner = new THREE.Vector3();
function registerCardText(c, rects) {
  if (!c.visible) return;
  c.updateMatrixWorld();
  st.camera.updateMatrixWorld();
  for (const [x0, y0, x1, y1, text] of rects) {
    const ps = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([u, v]) => {
      corner.set(u - CW / 2, CH / 2 - v, 0).applyMatrix4(c.matrixWorld).project(st.camera);
      return [((corner.x + 1) / 2) * W, ((1 - corner.y) / 2) * H];
    });
    const xs = ps.map((p) => p[0]), ys = ps.map((p) => p[1]);
    registerBox(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), colors.ink, text);
  }
}

// Nothing on the 2D layer: this scene is all 3D, framed by its own camera (wallDolly).
export function draw() {}

export function draw3D(t) {
  cards.forEach((c, i) => landCard(c, t, LAND[i], { z: 4 * i }));
  fan(cards, t, FAN, { from: SLOT });
  const value = Math.round(TOTAL * outCubic(win(t, COUNT[0], COUNT[1])));
  setCardContent(cards[1], drawStat(value), value);

  const settle = inOutQuint(win(t, 0, SETTLE));
  tiles.forEach((m, i) => {
    m.rotation.set(lerp(0.5, 0.2, settle) * (i ? -1 : 1), lerp(-0.6, 0.35, settle), lerp(0.2, -0.1, settle));
  });
  wallDolly(st.camera, t, 0, SETTLE);
  registerCardText(cards[1], [[32, 30, CW - 32, 54, T[1]], [30, 106, CW - 30, 206, T[2]]]);
  return render3D(st);
}
