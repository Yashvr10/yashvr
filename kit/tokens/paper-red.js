// Look "paper-red": printed paper, ink-black type, one red accent; a still paper
// texture multiplied over everything (as the UPI video), light grain, a serif headline face.
// Same keys as every set in kit/tokens/ (kit/qa/keys.mjs checks); templates and engine modules
// read them through kit/tokens.js, which picks the set.
const query = new URLSearchParams(globalThis.location?.search ?? '');
// Aspect: the job's (globalThis.KIT.aspect, set by player.html) or ?aspect=16x9|9x16; default 16x9.
// The same templates re-compose for each through engine/layout.js.
export const ASPECT = (globalThis.KIT?.aspect ?? query.get('aspect')) === '9x16' ? '9x16' : '16x9';
const VERTICAL = ASPECT === '9x16';
export const W = VERTICAL ? 1080 : 1920;
export const H = VERTICAL ? 1920 : 1080;
// Type scale: 9:16 sets type at 90% of its 16:9 size, measured against TH.
export const TYPE = VERTICAL ? 0.9 : 1;
export const TH = 1080 * TYPE;
// Supersampling: ?ss=N renders the backing store at W*N × H*N while layout stays in W × H units.
export const SS = Math.max(1, Math.round(Number(query.get('ss')) || 1));
export const FPS = 30;
export const DURATION = 30; // seconds: the whole video (900 frames)

// Style: an editorial print page. Warm paper ground, near-black ink type (Playfair Display 700
// headlines), one red accent for marks and rules only.
// Contrast (WCAG, measured): text on ground 15.8:1, on tile 13.8:1; accent 4.7:1 and dim 2.7:1 on
// ground: accent marks only, dim for lines and tiles, never text.
export const colors = {
  ground: '#F2EDE3', text: '#141414', accent: '#C8283C', dim: '#9A9184', line: '#D6CDBD', tile: '#E6DECF',
  white: '#FFFFFF',
  // Engine roles: ink = default text colour, bg = the halo behind dark text, paper = the ground,
  // highlight = marker fills.
  ink: '#141414', bg: '#F2EDE3', paper: '#F2EDE3', highlight: '#C8283C',
};
export const fields = { ground: { fill: colors.ground, text: colors.text } };

// Playfair Display 700 for headlines, Inter Tight 700 for labels, Inter 400 for the source line.
export const fonts = { display: '"Playfair Display"', body: '"Playfair Display"', label: '"Inter Tight"', small: '"Inter"', mono: '"JetBrains Mono"' };
// Cap heights in em, measured in Chrome (kit/qa/capheights.mjs): Playfair Display 700 0.719,
// Inter Tight and Inter 0.734. Sizes come from cap heights, so type sits as tall in every look.
export const capEm = { display: 0.719, label: 0.734, small: 0.734 };
export const weights = { display: 700, label: 700, small: 400 };
const fromCap = (pct, cap = capEm.display) => Math.round(((pct / 100) * TH) / cap);
export const sizes = {
  giant: fromCap(11), // the end-card title
  hero: fromCap(6.6), // a scene's main line
  h1: fromCap(5), // second line
  h2: fromCap(3.8), // card text
  body: fromCap(3), // map captions
  label: fromCap(2.1, capEm.label), // map labels
  small: fromCap(1.6, capEm.small), // the source line
};
export const tracking = { display: 0, body: 0, label: 0.08 }; // em

// Layout margins in px from each edge (as the UPI video: 16:9 broadcast-like, 9:16 clear of the
// platform UI at the bottom).
export const safe = VERTICAL
  ? { x: 108, top: 280, bottom: 560 }
  : { x: Math.round(0.113 * W), top: Math.round(0.117 * H), bottom: Math.round(0.117 * H) };
const rect = (x, y, w, h) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
export const titleSafe = rect(0.05 * W, 0.05 * H, 0.9 * W, 0.9 * H);
const crop = (H * 9) / 16;
export const cropSafe = VERTICAL ? null : rect((W - crop) / 2 + 0.05 * crop, 0.05 * H, 0.9 * crop, 0.9 * H);
export const captionBand = VERTICAL ? rect(0.1 * W, 0.15 * H, 0.8 * W, 0.55 * H) : null;
// Every caption stays settled at least `hold` seconds (longer for more words: engine/copy.js holdFor).
export const hold = 1.2;

// Motion: calm. Entrances ease out with almost no overshoot; slow pushes; no impacts.
export const motion = {
  enter: 0.45, // s: an element's entrance
  overshoot: 0.6, // outBack strength (gentle)
  stagger: 0.08, // s between siblings
  drawOn: 0.5, // s: a rule or line drawing on
  push: 0.03, // camera push-in over a scene
  impact: 0, // no punches
};

// Post: flat print. A light vignette, fine grain, and the paper texture multiplied over every layer.
export const post = { bloom: 0, ca: 0, vig: 0.12, grain: 0.014, exposure: 1, tone: 0, curve: 0, warm: 0, paper: 1 };
export const background = {
  ramp: [colors.ground, '#E4DCCB', '#E4DCCB'], amount: 0.35, drift: 0, fibre: 3 / 255, fibreScale: Math.min(W, H) / 540,
};
// Collage pieces (engine/collage.js reads these; this video uses few of them).
export const collage = {
  border: 0,
  shadow: { x: 0, y: 12, blur: 30, alpha: 0.5 },
  halftone: { cell: 9, angle: Math.PI / 4 },
  tape: { w: 120, h: 36, color: 'rgba(243, 236, 214, 0.82)' },
  tile: { size: 360, seed: 16 },
};

// Line widths in screen px; annotate = the accent rule.
export const stroke = { outline: 3, detail: 2, annotate: 6 };
export const radius = 14;
export const shadowAlpha = 0.45;
// 3D surfaces (templates/cards.js, templates/wall.js). card: the card's material, its texture also
// its emission at `emissive` so its type stays legible; tile: the wall's tiles; back: the tile backs
// (Lambert, no specular) at emission `back`.
export const surface = { card: { emissive: 0.35, roughness: 0.85, metalness: 0 }, tile: { roughness: 0.9, metalness: 0, shade: 0.015 }, side: { roughness: 0.9 }, back: 0.4 };

// Every face the scenes use. index.html waits for each before READY.
export const fontLoads = [`700 1em ${fonts.display}`, `700 1em ${fonts.label}`, `400 1em ${fonts.small}`];
