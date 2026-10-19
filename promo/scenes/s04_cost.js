// s04_cost: the human cost. Scene type: 3D CARDS (three.js, engine/three3d.js).
// In on a dip. Three dark cards, each with one line ("Civilians killed.", "Families displaced.",
// "Hostages taken."), come forward out of depth one at a time and turn gently face-on; side by side
// in 16:9, stacked in 9:16. The camera dollies in slowly; the cards breathe a degree or two. Leaves
// through a zoom into the centre card.
//
// The 3D layer is drawn into the 2D layer (not post's three slot) so transitions carry it.
// Facts (NOTES.md): civilians were killed in Israel and in Gaza; most of Gaza's population was
// displaced (UN OCHA); hostages were taken on 7 October 2023.
import { win, lerp, outCubic } from '../engine/ease.js';
import { lines, windows } from '../engine/copy.js';
import { L } from '../engine/layout.js';
import { THREE, stage, card, setCardContent, render3D, softShadow, PIXEL_Z } from '../engine/three3d.js';
import { colors, sizes, stroke } from '../tokens.js';
import { STYLE, block } from './_kit.js';
import { base, fontOf } from '../engine/type.js';

const ID = 's04_cost';
const TEXTS = lines(ID);
export const dur = 4.6;

// Beats, local seconds: card k starts at IN[k] and is face-on after ENTER.
const IN = [0.15, 0.75, 1.35], ENTER = 0.6, DEG = Math.PI / 180;
export const captions = windows(ID, TEXTS.map((_, k) => ({ lines: [k], in: IN[k], at: IN[k] + ENTER })));
export const end = Math.max(...captions.map((c) => c.out));

// Card size and spacing in px (one unit = one px at z = 0).
const CARD = L.stack ? { w: 700, h: 250, step: 290 } : { w: 420, h: 520, step: 475 };
const TEXT = { ...STYLE.h1, size: L.stack ? sizes.h1 : sizes.h2 }, PAD = 44;
// The text style lives on the card's canvas: 2D type at card px (no riseIn; the card's own move is
// the entrance).
function paint(text) {
  return (c, w, h) => {
    c.fillStyle = colors.tile;
    c.fillRect(0, 0, w, h);
    c.fillStyle = colors.accent;
    c.fillRect(0, 0, w, stroke.annotate);
    const b = block(c, text, TEXT, w - 2 * PAD, { max: 2 });
    const o = base({ ...TEXT, size: b.size });
    c.font = fontOf(o);
    c.letterSpacing = `${o.track * b.size}px`;
    c.fillStyle = colors.text;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    // Left-aligned, bottom of the card (editorial), the block's last baseline PAD above the edge.
    b.rows.forEach((r, k) => c.fillText(r, PAD, h - PAD - (b.rows.length - 1 - k) * b.lineH));
  };
}

let S, cards;
export async function load() {
  S = stage();
  cards = TEXTS.map((text) => {
    const g = card(CARD.w, CARD.h, { r: 18, depth: 10 });
    setCardContent(g, paint(text));
    // Lit by the room, but its own picture stays legible: the texture is also its emission.
    const m = g.children[0].material;
    m.emissive = new THREE.Color(0xffffff);
    m.emissiveMap = m.map;
    m.emissiveIntensity = 0.8;
    m.roughness = 0.7;
    const sh = softShadow(CARD.w, CARD.h, { blur: 30, alpha: 0.55 });
    sh.position.set(0, -18, -60);
    g.add(sh);
    S.scene.add(g);
    return g;
  });
}

// Every material in a card at opacity a (each keeps its own base).
const opacity = (g, a) => g.traverse((o) => { if (o.material) o.material.opacity = (o.material.userData.base ?? 1) * a; });

export function draw(ctx, t, d = dur) {
  const mid = (cards.length - 1) / 2;
  cards.forEach((g, k) => {
    const u = outCubic(win(t, IN[k], IN[k] + ENTER)), i = k - mid;
    g.visible = u > 0;
    const breathe = Math.sin((2 * Math.PI * (t + k * 0.7)) / 5) * 1.2 * DEG;
    if (L.stack) {
      g.position.set(0, -i * CARD.step, lerp(-900, 0, u));
      g.rotation.set(lerp(-60 * DEG, 0, u) + breathe, 0, 0);
    } else {
      g.position.set(i * CARD.step, 0, lerp(-900, 0, u));
      g.rotation.set(0, lerp(60 * DEG, 0, u) + breathe, 0);
    }
    opacity(g, Math.min(1, u * 3));
  });
  // The dolly: in by 7% over the scene, trucking 30 px across (down, in 9:16).
  const p = win(t, 0, d), truck = lerp(-30, 30, p);
  S.camera.position.set(L.stack ? 0 : truck, L.stack ? -truck : 0, PIXEL_Z * (1 - 0.07 * p));
  const frame = render3D(S);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(frame, 0, 0);
  ctx.restore();
}
