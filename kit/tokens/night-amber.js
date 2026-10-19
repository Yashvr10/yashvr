// Look "night-amber": the Israel–Hamas explainer's tokens (promo/tokens.js), values unchanged.
// Every token set in kit/tokens/ has exactly the same keys (kit/qa/keys.mjs checks); templates and
// engine modules read them through kit/tokens.js, which picks the set.
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

// Style: a sober news explainer. Near-black ground, off-white type, one muted amber accent
// (marks, rules and the map's Gaza outline only, never body text), film grain, slow pushes.
// Contrast (WCAG, measured): text on ground 15.8:1, on tile 13.9:1; accent 7.4:1 and dim 3.6:1 on ground:
// accent marks only, dim for lines and tiles, never text.
export const colors = {
  ground: '#0E0E0D', text: '#ECE8E0', accent: '#C9974A', dim: '#6E6A62', line: '#3B3A37', tile: '#1D1C1A',
  white: '#FFFFFF',
  // Engine roles (older modules read these names): ink = default text colour, bg = the halo
  // behind dark text, paper = the ground, highlight = marker fills.
  ink: '#ECE8E0', bg: '#0E0E0D', paper: '#0E0E0D', highlight: '#C9974A',
};
export const fields = { ground: { fill: colors.ground, text: colors.text } };

// Inter Tight 700 for every headline (sentence case), Inter 400 for labels and the source line.
export const fonts = { display: '"Inter Tight"', body: '"Inter Tight"', label: '"Inter Tight"', small: '"Inter"', mono: '"JetBrains Mono"' };
// Cap heights in em, measured in Chrome: Inter Tight and Inter 0.734.
const CAP = 0.734;
// Cap height (em) and weight of each face role, for templates (they don't hard-code a font).
export const capEm = { display: 0.734, label: 0.734, small: 0.734 };
export const weights = { display: 700, label: 700, small: 400 };
const fromCap = (pct) => Math.round(((pct / 100) * TH) / CAP);
export const sizes = {
  giant: fromCap(11), // the end-card title
  hero: fromCap(6.6), // a scene's main line
  h1: fromCap(5), // second line
  h2: fromCap(3.8), // card text
  body: fromCap(3), // map captions
  label: fromCap(2.1), // map labels
  small: fromCap(1.6), // the source line
};
export const tracking = { display: -0.01, body: 0, label: 0.06 }; // em

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

// Post: grain over a near-black ground with a slow, faint mottle; a vignette; no bloom or CA.
export const post = { bloom: 0, ca: 0, vig: 0.32, grain: 0.035, exposure: 1, tone: 0, curve: 0, warm: 0, paper: 0 };
export const background = {
  ramp: [colors.ground, '#161615', '#1C1B19'], amount: 0.7, drift: 0.25, fibre: 1.5 / 255, fibreScale: Math.min(W, H) / 540,
};

// Collage pieces (engine/collage.js reads these; this video uses few of them).
export const collage = {
  border: 0,
  shadow: { x: 0, y: 12, blur: 30, alpha: 0.5 },
  halftone: { cell: 9, angle: Math.PI / 4 },
  tape: { w: 120, h: 36, color: 'rgba(236, 232, 224, 0.5)' },
  tile: { size: 360, seed: 16 },
};

// Line widths in screen px; annotate = the accent rule.
export const stroke = { outline: 3, detail: 2, annotate: 6 };
export const radius = 14;
export const shadowAlpha = 0.45;
// 3D surfaces (templates/cards.js, templates/wall.js). card: the card's material, its texture also
// its emission at `emissive` so its type stays legible; tile: the wall's tiles; back: the tile backs
// (Lambert, no specular) at emission `back`.
export const surface = { card: { emissive: 0.8, roughness: 0.7, metalness: 0 }, tile: { roughness: 0.8, metalness: 0, shade: 0.012 }, side: { roughness: 0.9 }, back: 0.45 };

// Every face the scenes use. index.html waits for each before READY.
export const fontLoads = [`700 1em ${fonts.display}`, `400 1em ${fonts.small}`];
