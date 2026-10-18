export const W = 1920;
export const H = 1080;
export const FPS = 30;

// Stand-in palette and fonts: the brief's {{PALETTE}} and {{FONTS}} were never filled in.
export const colors = { bg: '#0b0b0f', ink: '#f2f0eb', accent: '#ff6a3d', dim: '#8a8a94' };
export const fonts = { display: '"Inter Tight"', body: '"Inter"', mono: '"JetBrains Mono"' };

export const sizes = { hero: 168, h1: 96, h2: 64, body: 36, label: 26 };
export const tracking = { display: -0.035, body: 0, label: 0.08 }; // em
export const safe = { x: 144, y: 96 };
export const hold = 1.2; // seconds

// Illustration. Line widths in screen px, whatever an object's scale.
export const stroke = { outline: 4.5, detail: 3 };
export const radius = 16;
export const shadowAlpha = 0.3;
// At most 4 hues plus neutrals. In use: accent only. Neutrals: bg, ink, dim.
export const hues = [colors.accent];

// Every face the scenes use. index.html waits for each before READY.
export const fontLoads = [`700 1em ${fonts.display}`, `400 1em ${fonts.body}`, `400 1em ${fonts.mono}`];
