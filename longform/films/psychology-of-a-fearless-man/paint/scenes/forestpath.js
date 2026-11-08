// A figure walking a forest path toward the light (facing fear, step by step).
paint(121, [
  () => { ngrad(-40, 1120, ['#3d4a3c', '#7d846a', '#d9caa0', '#5b5238']); glow(1050, 520, 520, '#fff0c4', 0.9); },
  () => {
    tree(380, 960, 980, '#2a2014', '#2c3524', '#5d6a3c', 'oak', 1);
    for (let i = 0; i < 9; i++) tree(rr(-60, 700), rr(800, 900), rr(380, 620), '#1f1a12', '#26301f', '#4c5a34', pick(['oak', 'pine']), 1);
    for (let i = 0; i < 9; i++) tree(rr(1350, 1980), rr(780, 900), rr(360, 640), '#1f1a12', '#26301f', '#4c5a34', 'pine', -1);
    land([[-60, 820], [W + 60, 800], [W + 60, H + 60], [-60, H + 60]], '#2f3420', '#6b6a3c', 200);
    poly([[860, 1120], [1010, 820], [1090, 820], [1300, 1120]], '#8a7a56', 200, 0.6);
  },
  () => { haze(780, 240, '#e9dcb4', 130); },
  () => { figure(1010, 900, 210, { robe: '#2a2018', cloak: '#6a2a1a', rim: '#ffe7b8', side: 1, pose: 'stride', staff: true }); },
  () => { vignette('#0d0b07', 0.6); },
]);
