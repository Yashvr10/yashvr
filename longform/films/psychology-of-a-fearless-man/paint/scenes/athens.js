// Philosophers under great arches (after Raphael's School of Athens).
paint(81, [
  () => { ngrad(-40, 1120, ['#8f8676', '#b9ad96', '#c9bda3', '#7d705c']); glow(960, 300, 380, '#e8f0f4', 0.7); },
  () => {
    poly([[-60, -60], [W + 60, -60], [W + 60, 760], [-60, 760]], '#a89c86', 120, 0.4);
    archway(960, 760, 620, 740, '#9a8f7c', '#e4dccb', '#9fb6c4');
    archway(960, 760, 330, 470, '#9a8f7c', '#eee6d6', '#c3d4dc');
    for (const x of [380, 560, 1360, 1540]) column(x, -40, 760, 70, '#8a7f6c', '#d9cfba');
    land([[-60, 740], [W + 60, 740], [W + 60, H + 60], [-60, H + 60]], '#8b7e68', '#c9bb9c', 220, [-2, 2]);
    for (let i = 0; i < 6; i++) washRect(-60, 760 + i * 40, W + 120, 6, '#6b5f4c', 90);
  },
  () => { glow(960, 640, 520, '#f3e6c8', 0.25, 0.4); },
  () => {
    crowd(9, 260, 760, 790, 190, 230, ['#7b2a1e', '#2e4a6b', '#7a6a2c', '#4d3a5c', '#2f4d3a'], '#f6e3bc');
    crowd(9, 1160, 1680, 790, 190, 230, ['#7b2a1e', '#2e4a6b', '#7a6a2c', '#4d3a5c', '#2f4d3a'], '#f6e3bc');
    figure(905, 800, 260, { robe: '#9b3523', cloak: '#c46a3a', rim: '#fff0cc', side: -1, pose: 'point' });
    figure(1015, 800, 260, { robe: '#2b4f7a', cloak: '#6a4a2a', rim: '#fff0cc', side: 1, pose: 'stand' });
  },
  () => { vignette('#2a2218', 0.5); },
]);
