// Diogenes by his barrel; Alexander in a red cloak stands over him.
paint(91, [
  () => { ngrad(-40, 1120, ['#7f97ab', '#b9c2c0', '#d5c6a2', '#8a7a5e']); glow(700, 260, 420, '#fff2d0', 0.6); },
  () => {
    for (const x of [140, 300, 460]) column(x, 80, 780, 80, '#a29276', '#e8dcc0');
    poly([[1100, 780], [1150, 380], [1500, 360], [1560, 780]], '#9a8a6e', 180, 0.4);
    land([[-60, 760], [W + 60, 740], [W + 60, H + 60], [-60, H + 60]], '#8a7a5e', '#cdbb94', 200, [-3, 3]);
    // the barrel
    blob(1420, 700, 230, 190, '#4a3622', 240, 0.15, 0.05, 0.5); blob(1420, 700, 150, 130, '#140e08', 240, 0.12, 0.05, 0.4);
    for (const dx of [-180, -60, 60, 180]) { brush.set('2B', '#2a1d10', 2.4); brush.spline([[1420 + dx, 520], [1420 + dx * 1.08, 700], [1420 + dx, 880]], 0.6); }
  },
  () => { glow(1300, 760, 300, '#f6e2b0', 0.3); },
  () => {
    figure(1290, 880, 300, { robe: '#5e4c38', skin: '#b5885c', rim: '#f8e3b4', side: -1, pose: 'sit' });
    figure(820, 900, 470, { robe: '#5b5236', cloak: '#b5301f', skin: '#c99c74', rim: '#fff0cc', side: 1, pose: 'point' });
    figure(560, 900, 400, { robe: '#3e4a52', rim: '#f6e3bc', side: 1, pose: 'stand', staff: true });
    figure(430, 905, 380, { robe: '#4d3a28', rim: '#f6e3bc', side: 1, pose: 'stand' });
  },
  () => { vignette('#1e170f', 0.55); },
]);
