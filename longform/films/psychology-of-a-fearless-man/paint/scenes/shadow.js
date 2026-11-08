// A hooded figure, half in shadow: fearlessness without a conscience.
paint(111, [
  () => { ngrad(-40, 1120, ['#07080a', '#0f1113', '#16130f', '#07060a']); glow(1250, 380, 360, '#5c2a1c', 0.6); },
  () => {
    figure(960, 1180, 1100, { robe: '#0d0b09', cloak: '#1b1410', skin: '#2a1f17', rim: '#b0462c', side: 1, pose: 'stand' });
    blob(960, 260, 120, 150, '#060504', 245, 0.2, 0.05, 0.3);
    blob(985, 300, 8, 5, '#d9a35b', 240, 0.1, 0, 0.1); blob(935, 300, 8, 5, '#d9a35b', 240, 0.1, 0, 0.1);
  },
  () => { vignette('#000000', 0.9); },
]);
