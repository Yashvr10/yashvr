const query = new URLSearchParams(globalThis.location?.search ?? '');
// Aspect: ?aspect=16x9 (default) or 9x16. The same scenes re-compose for each through
// engine/layout.js; W, H, the type sizes and the safe margins below follow the aspect.
export const ASPECT = query.get('aspect') === '9x16' ? '9x16' : '16x9';
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
// The reference runs at 23.976 fps; we stay at 30 and convert its frame counts to seconds.
export const FPS = 30;
const REF_FPS = 24000 / 1001;
const refFrames = (n) => n / REF_FPS;

// Every value below comes from STYLE.md (measured from the private reference).
// Palette: paper 48.8%, paper shade 21.1%, ink 10.2%, graphite 9.8%, red 4.8%, yellow 0.3%.
// Ink is the solid core (darkest decile over 74 paper frames), not the k-means centroid #2a2725,
// which averages in anti-aliased edges.
export const colors = {
  bg: '#eae9e9', paper: '#dbdad9', ink: '#111111', dim: '#5d5b58', accent: '#d64647', highlight: '#e8e60d',
};
// High-contrast serif for titles, captions and hero letters; slab serif for quoted phrases.
// The reference has no monospace; mono stays for older scenes only.
export const fonts = { display: '"Playfair Display"', body: '"Playfair Display"', slab: '"Zilla Slab"', mono: '"JetBrains Mono"' };

// Font size from a cap height in % of TH and the face's cap height in em (measured in Chrome:
// Playfair Display 0.719, Zilla Slab 0.656).
const fromCap = (pct, capEm) => Math.round(((pct / 100) * TH) / capEm);
export const sizes = {
  giant: fromCap(81.1, 0.719), // hero letters, 900 roman (1218)
  hero: fromCap(10.8, 0.719), // name title, 700 italic (162)
  h1: fromCap(9.7, 0.656), // quoted phrase, slab 700 (160)
  h2: fromCap(8.3, 0.719), // two-line caption, 400 roman (125)
  body: fromCap(6.7, 0.719), // place label in a red box, 700 italic (101)
  label: fromCap(3.1, 0.719), // subtitle under a title, 400 italic (47)
};
export const tracking = { display: 0, body: 0, label: 0 }; // em: default spacing throughout
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
export const hold = 2.3; // seconds: median hold after an entrance (55 reference frames)

// Motion, in seconds (reference frame counts at 23.976 fps).
export const motion = {
  titleWipe: refFrames(7), // title wipes on left to right
  titleDelay: refFrames(2), // after its cut
  typePerChar: refFrames(0.73), // quoted phrase types on
  marker: refFrames(4.5), // highlight wipes behind the text
  drawOn: refFrames(8), // annotation circle or underline
  drawDelay: refFrames(9), // annotation after its clipping's cut
  move: refFrames(20), // camera move between items, inOut, peak/mean velocity 3.4
  montage: { cuts: 5, every: refFrames(2), settle: refFrames(7) }, // clippings cut on twos
};
// Rhythm: 17.0 editorial cuts per minute, 3.28 s mean shot, a montage burst every 3.0 s.
export const rhythm = { cutsPerMin: 17, shot: 3.28, montageGap: 3.0 };

// Texture, as post-chain defaults: no bloom, CA or vignette; grain at the measured mean frame
// difference (0.22 / 255 on paper shots, matched at 360p). The reference is untone-mapped SDR with a
// neutral paper, so ACES, the S-curve and the warm/cool tint are off (1 = the earlier look).
export const post = { bloom: 0, ca: 0, vig: 0, grain: 0.0073, exposure: 1, tone: 0, curve: 0, warm: 0 };
// Paper: static (drift 0), mottled between paper and paper shade (21.1% coverage in the
// reference), with static fibre noise of std 2.2 / 255 in cells of one reference pixel (H / 360).
export const background = {
  ramp: [colors.bg, colors.paper, colors.paper], amount: 0.6, drift: 0, fibre: 2.2 / 255, fibreScale: Math.min(W, H) / 360,
};

// Illustration. Line widths in screen px, whatever an object's scale.
// annotate: red circles and underlines, 0.56–1.11% H in the reference.
export const stroke = { outline: 4.5, detail: 3, annotate: 9 };
export const radius = 16;
export const shadowAlpha = 0.3;
// At most 4 hues plus neutrals. In use: red and marker yellow. Neutrals: bg, paper, ink, dim.
export const hues = [colors.accent, colors.highlight];

// Every face the scenes use. index.html waits for each before READY.
export const fontLoads = [
  `italic 700 1em ${fonts.display}`, `700 1em ${fonts.display}`, `900 1em ${fonts.display}`,
  `400 1em ${fonts.body}`, `italic 400 1em ${fonts.body}`, `700 1em ${fonts.slab}`, `400 1em ${fonts.mono}`,
];
