// A woman walks calmly through a dark haunted corridor with a lantern (patient S.M.).
paint(41, [
  () => { ngrad(-40, 1120, ['#0d0c0b', '#1a1712', '#211b14', '#0f0c09']); glow(960, 520, 300, '#5b6a6e', 0.5); glow(820, 600, 420, '#e7b56a', 0.6); },
  () => {
    // receding walls and arches
    for (let k = 0; k < 6; k++) { const s = 1 - k * 0.14, x0 = 960 - 700 * s, x1 = 960 + 700 * s, yt = 540 - 420 * s, yb = 540 + 420 * s;
      poly([[x0 - 60 * s, yb], [x0 - 60 * s, yt], [x0, yt], [x0, yb]], mixc('#2a2218', '#0f0c09', k / 6), 230);
      poly([[x1, yb], [x1, yt], [x1 + 60 * s, yt], [x1 + 60 * s, yb]], mixc('#2a2218', '#0f0c09', k / 6), 230); }
    land([[-60, 900], [W + 60, 900], [W + 60, H + 60], [-60, H + 60]], '#1c1610', '#4a3824', 160);
    for (let i = 0; i < 4; i++) { const x = pick([420, 560, 1360, 1500]), y = rr(380, 640); blob(x, y, rr(40, 70), rr(90, 150), '#cfd6cf', 45, 0.8, 0.5, 0.2); }
  },
  () => { glow(830, 640, 160, '#ffd58e', 0.8); },
  () => {
    figure(800, 910, 380, { robe: '#3a2a20', cloak: '#5b4636', skin: '#c99c74', rim: '#ffd590', side: 1, pose: 'stride' });
    blob(860, 640, 16, 22, '#fff1c4', 240, 0.2, 0.1, 0.1);
  },
  () => { vignette('#050403', 0.85); },
]);
