// FROZEN: read-only from phase 7 on. Need something it lacks? Write it in your scene file and report it (NOTES.md).
const query = new URLSearchParams(globalThis.location?.search ?? '');
// Aspect: ?aspect=9x16 (default: this video is vertical-first) or 16x9. The same scenes re-compose
// for each through engine/layout.js; W, H, the type sizes and the safe margins follow the aspect.
export const ASPECT = query.get('aspect') === '16x9' ? '16x9' : '9x16';
const VERTICAL = ASPECT === '9x16';
export const W = VERTICAL ? 1080 : 1920;
export const H = VERTICAL ? 1920 : 1080;
// Type scale: 9:16 sets type at 90% of its 16:9 size. TH is the height type is measured against
// (the 16:9 frame's, scaled), so type never grows with the taller frame.
export const TYPE = VERTICAL ? 0.9 : 1;
export const TH = 1080 * TYPE;
// Supersampling: ?ss=N renders the backing store at W*N × H*N while layout stays in W × H units.
// Every constant measured in device pixels (blur radii, grain cells, CA, point sizes) is × SS.
export const SS = Math.max(1, Math.round(Number(query.get('ss')) || 1));
export const FPS = 30;
export const DURATION = 10; // seconds: the whole video

// Style: Vox-like Mixed Media collage (STYLE.md). Flat colour fields, paper cutouts with white
// borders, halftone, tape, hand-drawn marker marks, Anton type. One dominant field per scene.
// Contrast (WCAG, measured): ink on yellow 11.6, on paper 15.8, on white 18.4; paper on navy 11.9,
// white on navy 13.9. Coral and dim are under 7:1 on every field: marks and shapes only, never text.
export const colors = {
  yellow: '#F5C842', paper: '#F2EDE3', navy: '#1D2B4F', coral: '#EE6352',
  ink: '#141414', white: '#FFFFFF', dim: '#5E5A52',
  // Engine roles (older modules read these names): bg = the light field and the text halo,
  // accent = marks, highlight = marker fills.
  bg: '#F2EDE3', accent: '#EE6352', highlight: '#F5C842',
};
// The field each scene type sits on, and the text colour that goes with it.
export const fields = {
  yellow: { fill: colors.yellow, text: colors.ink },
  paper: { fill: colors.paper, text: colors.ink },
  navy: { fill: colors.navy, text: colors.paper },
};

// Anton (condensed display, the brief's caption face) for everything loud; Inter Tight for small
// labels; Inter for the source line. All SIL OFL (fonts/LICENSE-*.txt).
export const fonts = { display: '"Anton"', body: '"Anton"', label: '"Inter Tight"', small: '"Inter"', mono: '"JetBrains Mono"' };
// Cap heights in em, measured in Chrome: Anton 0.859, Inter Tight and Inter 0.734.
const CAP = { display: 0.859, label: 0.734 };
// Font size from a cap height in % of TH (so 9:16 type is 90% of 16:9 type).
const fromCap = (pct, capEm) => Math.round(((pct / 100) * TH) / capEm);
export const sizes = {
  giant: fromCap(16, CAP.display), // the answer number (201; 181 in 9:16)
  hero: fromCap(9.5, CAP.display), // a scene's main line (119; 107)
  h1: fromCap(7, CAP.display), // second line, year labels (88; 79)
  h2: fromCap(5, CAP.display), // supporting line (63; 57)
  body: fromCap(3.6, CAP.display), // short caption (45; 41)
  label: fromCap(2.2, CAP.label), // Inter Tight 700 caps label (32; 29)
  small: fromCap(1.6, CAP.label), // Inter source line (24; 21)
};
export const tracking = { display: 0.01, body: 0.01, label: 0.08 }; // em

// Layout margins in px from each edge. 16:9: text edges at 11.1–11.4% W and from 11.7% H.
// 9:16: clear of the platform UI, which covers more of the bottom (caption, buttons) than the top.
export const safe = VERTICAL
  ? { x: 108, top: 280, bottom: 560 }
  : { x: Math.round(0.113 * W), top: Math.round(0.117 * H), bottom: Math.round(0.117 * H) };
// QA rects { x, y, w, h }. titleSafe: broadcast title-safe, 90% of the frame. In 16:9, cropSafe is
// the title-safe of a centred 9:16 crop (for cropped re-cuts); in 9:16, captionBand is where
// captions belong: 15% to 70% of the height, 10% side margins.
const rect = (x, y, w, h) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
export const titleSafe = rect(0.05 * W, 0.05 * H, 0.9 * W, 0.9 * H);
const crop = (H * 9) / 16;
export const cropSafe = VERTICAL ? null : rect((W - crop) / 2 + 0.05 * crop, 0.05 * H, 0.9 * crop, 0.9 * H);
export const captionBand = VERTICAL ? rect(0.1 * W, 0.15 * H, 0.8 * W, 0.55 * H) : null;
// Holds: every caption stays settled at least `hold` seconds (and longer for more words; see
// engine/copy.js holdFor). Transitions are 0.1 to 0.3 s.
export const hold = 1.2;

// Motion: Vox-snappy. Entrances ease out with a slight overshoot; one loud thing at a time.
export const motion = {
  enter: 0.35, // s: an element's entrance
  overshoot: 1.4, // outBack strength for pops
  stagger: 0.06, // s between siblings
  drawOn: 0.4, // s: a marker circle or underline
  push: 0.04, // camera push-in over a scene
  impact: 0.06, // punch() scale on an impact frame
};

// Post: flat print. No bloom, CA or tone mapping; a light vignette; grain; and the paper texture
// (mottling + fibre) multiplied over every layer, so cutouts and fields read as printed paper.
export const post = { bloom: 0, ca: 0, vig: 0.12, grain: 0.012, exposure: 1, tone: 0, curve: 0, warm: 0, paper: 1 };
// Paper texture: a neutral mottle (amount of the paper → shade ramp) and static fibre noise of std
// fibre in cells of fibreScale px. Only its variation is used (normalised to the paper colour).
export const background = {
  ramp: [colors.paper, '#E4DCCB', '#E4DCCB'], amount: 0.35, drift: 0, fibre: 3 / 255, fibreScale: Math.min(W, H) / 540,
};

// Collage pieces (engine/collage.js): white paper border, drop shadow, halftone dots, tape.
export const collage = {
  border: 14, // px of white paper around a cutout
  shadow: { x: 6, y: 10, blur: 14, alpha: 0.22 },
  halftone: { cell: 9, angle: Math.PI / 4 }, // px, radians
  tape: { w: 120, h: 36, color: 'rgba(243, 236, 214, 0.82)' },
  // The QR tile that runs through every scene: one seed, so it is the same tile everywhere.
  tile: { size: 360, seed: 16 },
};

// Illustration. Line widths in screen px whatever an object's scale; annotate = marker strokes.
export const stroke = { outline: 4, detail: 3, annotate: 10 };
export const radius = 10;
export const shadowAlpha = collage.shadow.alpha;

// Every face the scenes use. index.html waits for each before READY.
export const fontLoads = [`400 1em ${fonts.display}`, `700 1em ${fonts.label}`, `400 1em ${fonts.small}`];
