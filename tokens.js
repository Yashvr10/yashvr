export const W = 1920;
export const H = 1080;
// The reference runs at 23.976 fps; we stay at 30 and convert its frame counts to seconds.
export const FPS = 30;
const REF_FPS = 24000 / 1001;
const refFrames = (n) => n / REF_FPS;

// Every value below comes from STYLE.md (measured from the private reference).
// Palette: paper 48.8%, paper shade 21.1%, ink 10.2%, graphite 9.8%, red 4.8%, yellow 0.3%.
export const colors = {
  bg: '#eae9e9', paper: '#dbdad9', ink: '#2a2725', dim: '#5d5b58', accent: '#d64647', highlight: '#e8e60d',
};
// High-contrast serif for titles, captions and hero letters; slab serif for quoted phrases.
// The reference has no monospace; mono stays for older scenes only.
export const fonts = { display: '"Playfair Display"', body: '"Playfair Display"', slab: '"Zilla Slab"', mono: '"JetBrains Mono"' };

// Font size from a cap height in % of H and the face's cap height in em (measured in Chrome:
// Playfair Display 0.719, Zilla Slab 0.656).
const fromCap = (pct, capEm) => Math.round(((pct / 100) * H) / capEm);
export const sizes = {
  giant: fromCap(81.1, 0.719), // hero letters, 900 roman (1218)
  hero: fromCap(10.8, 0.719), // name title, 700 italic (162)
  h1: fromCap(9.7, 0.656), // quoted phrase, slab 700 (160)
  h2: fromCap(8.3, 0.719), // two-line caption, 400 roman (125)
  body: fromCap(6.7, 0.719), // place label in a red box, 700 italic (101)
  label: fromCap(3.1, 0.719), // subtitle under a title, 400 italic (47)
};
export const tracking = { display: 0, body: 0, label: 0 }; // em: default spacing throughout
// Text edges at 11.1–11.4% W and from 11.7% H.
export const safe = { x: Math.round(0.113 * W), y: Math.round(0.117 * H) };
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
// difference (≈ 0.5 / 255 → amplitude 3 × 0.5 / 255); static paper texture std 2.2 / 255.
export const post = { bloom: 0, ca: 0, vig: 0, grain: 0.006 };
export const paperTexture = 2.2 / 255;

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
