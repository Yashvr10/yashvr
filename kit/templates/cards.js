// cards: up to three cards in 3D (three.js), one short line each, that come forward out of depth one
// at a time and turn gently face-on; side by side in 16:9, stacked in 9:16. The camera dollies in
// slowly and the cards breathe a degree or two. From the explainer's s04_cost.
// The 3D frame is drawn into the 2D layer (not post's three slot), so transitions carry it.
import { win, lerp, outCubic } from '../engine/ease.js';
import { base, fontOf } from '../engine/type.js';
import { L } from '../engine/layout.js';
import { THREE, stage, card, setCardContent, render3D, softShadow, PIXEL_Z } from '../engine/three3d.js';
import { styles, windows, block, capOf, prepared, state, withDefaults } from './_lib.js';

export const name = 'cards';
export const params = {
  cards: { type: 'string[]', required: true, min: 1, max: 3 }, // 1–3 words each
};

// Card k starts at IN[k] and is face-on ENTER s later.
const IN = [0.15, 0.75, 1.35], ENTER = 0.6, DEG = Math.PI / 180, PAD = 44;
const CARD = () => (L.stack ? { w: 700, h: 250, step: 290 } : { w: 420, h: 520, step: 475 });

export const captions = (p) => windows(p.cards.map((text, k) => ({ text, in: IN[k], at: IN[k] + ENTER })));

// A card's face: the tile colour, an accent edge on top, the line left-aligned at the bottom.
function paint(T, text) {
  const S = { ...styles(T).h1, size: L.stack ? T.sizes.h1 : T.sizes.h2 };
  return (c, w, h) => {
    c.fillStyle = T.colors.tile;
    c.fillRect(0, 0, w, h);
    c.fillStyle = T.colors.accent;
    c.fillRect(0, 0, w, T.stroke.annotate);
    const b = block(c, text, S, w - 2 * PAD, { max: 2, capEm: capOf(T, S) });
    const o = base({ ...S, size: b.size });
    c.font = fontOf(o);
    c.letterSpacing = `${o.track * b.size}px`;
    c.fillStyle = T.colors.text;
    c.textAlign = 'left';
    c.textBaseline = 'alphabetic';
    b.rows.forEach((r, k) => c.fillText(r, PAD, h - PAD - (b.rows.length - 1 - k) * b.lineH));
  };
}

export async function prepare(p0, T) {
  const p = withDefaults(params, p0), S = stage(), C = CARD();
  const cards = p.cards.map((text) => {
    const g = card(C.w, C.h, { r: 18, depth: 10 });
    setCardContent(g, paint(T, text));
    // Lit by the room, but its picture stays legible: the texture is also its emission.
    const m = g.children[0].material;
    m.emissive = new THREE.Color(0xffffff);
    m.emissiveMap = m.map;
    m.emissiveIntensity = T.surface.card.emissive;
    m.roughness = T.surface.card.roughness;
    m.metalness = T.surface.card.metalness;
    const sh = softShadow(C.w, C.h, { blur: 30, alpha: 0.55 });
    sh.position.set(0, -18, -60);
    g.add(sh);
    S.scene.add(g);
    return g;
  });
  prepared.set(p0, { S, cards, C });
}

const opacity = (g, a) => g.traverse((o) => { if (o.material) o.material.opacity = (o.material.userData.base ?? 1) * a; });

export default function tpl(ctx, t, dur, p0) {
  const { S, cards, C } = state(p0, name), mid = (cards.length - 1) / 2;
  cards.forEach((g, k) => {
    const u = outCubic(win(t, IN[k], IN[k] + ENTER)), i = k - mid;
    g.visible = u > 0;
    const breathe = Math.sin((2 * Math.PI * (t + k * 0.7)) / 5) * 1.2 * DEG;
    if (L.stack) {
      g.position.set(0, -i * C.step, lerp(-900, 0, u));
      g.rotation.set(lerp(-60 * DEG, 0, u) + breathe, 0, 0);
    } else {
      g.position.set(i * C.step, 0, lerp(-900, 0, u));
      g.rotation.set(0, lerp(60 * DEG, 0, u) + breathe, 0);
    }
    opacity(g, Math.min(1, u * 3));
  });
  // The dolly: in by 7% over the scene, trucking 30 px across (down, in 9:16).
  const q = win(t, 0, dur), truck = lerp(-30, 30, q);
  S.camera.position.set(L.stack ? 0 : truck, L.stack ? -truck : 0, PIXEL_Z * (1 - 0.07 * q));
  const frame = render3D(S);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(frame, 0, 0);
  ctx.restore();
}
