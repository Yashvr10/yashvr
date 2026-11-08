// Ancestors around a fire at the edge of a dark forest: fear kept us alive.
paint(31, [
  () => { ngrad(-40, 1120, ['#0b0d10', '#14161a', '#1d1a15', '#120e0a']); glow(960, 760, 900, '#c4762f', 0.7); glow(960, 790, 260, '#ffd38a', 1.0); },
  () => {
    for (let i = 0; i < 16; i++) tree(rr(-60, 1980), rr(700, 760), rr(520, 820), '#0d0c0a', '#141713', '#20241c', 'pine', 0);
    land([[-60, 790], [W + 60, 770], [W + 60, H + 60], [-60, H + 60]], '#1d150e', '#5a3a1e', 200);
  },
  () => { glow(960, 800, 520, '#e09445', 0.35); },
  () => {
    blob(960, 805, 70, 40, '#ffcf73', 230, 0.6, 0.2, 0.2); blob(960, 770, 40, 70, '#ffe7a8', 200, 0.7, 0.2, 0.2);
    figure(760, 860, 230, { robe: '#1a120c', rim: '#f5bb6a', side: 1, pose: 'sit' });
    figure(1140, 870, 250, { robe: '#20150d', cloak: '#5c2a17', rim: '#f5bb6a', side: -1, pose: 'kneel' });
    figure(1300, 880, 290, { robe: '#17100a', rim: '#f0b162', side: -1, pose: 'stand', staff: true });
    for (let i = 0; i < 4; i++) { const x = rr(200, 600), y = rr(620, 700); blob(x, y, 5, 3, '#e8d48a', 230, 0.1, 0, 0.1); blob(x + 16, y, 5, 3, '#e8d48a', 230, 0.1, 0, 0.1); }
  },
  () => { vignette('#050403', 0.8); },
]);
