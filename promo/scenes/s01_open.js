// s01_open: the opening. Scene type: TYPE.
// Ground only. "It began with an attack." rises in, then "On Israel, led by Hamas." under it;
// the camera pushes in slowly; last, a thin amber rule draws on under the type. The rule is fixed
// on screen (outside the camera) because s02's coastline starts from it: the match cut.
//
// Every scene in this video has a fixed slot (`dur`, from the shot list); its captions must
// settle and hold (holdFor) inside it, which timeline.js checks.
import { win, outCubic, inOutCubic } from '../engine/ease.js';
import { lines, windows } from '../engine/copy.js';
import { withCamera, defaultPush } from '../engine/camera.js';
import { L, column } from '../engine/layout.js';
import { colors } from '../tokens.js';
import { STYLE, settles, block, drawBlock, RULE, ruleEnds } from './_kit.js';

const ID = 's01_open';
const [LINE_A, LINE_B] = lines(ID);
export const dur = 3.4;

// Beats, local seconds.
const IN_A = 0.15, IN_B = 0.55, RULE_ON = [1.2, 1.2 + 0.6];
export const captions = windows(ID, [
  { lines: [0], in: IN_A, at: settles(IN_A, LINE_A, STYLE.hero) },
  { lines: [1], in: IN_B, at: settles(IN_B, LINE_B, STYLE.hero) },
]);
export const end = Math.max(...captions.map((c) => c.out));

const GAP = 34, RULE_GAP = 80; // px between the two lines; from the last baseline to the rule
let A, B, tops;
export async function load() {
  const ctx = new OffscreenCanvas(1, 1).getContext('2d');
  A = block(ctx, LINE_A, STYLE.hero);
  B = block(ctx, LINE_B, STYLE.hero);
  // Both lines at one size (the smaller), centred above the rule.
  const size = Math.min(A.size, B.size);
  if (A.size !== size) A = block(ctx, LINE_A, { ...STYLE.hero, size });
  if (B.size !== size) B = block(ctx, LINE_B, { ...STYLE.hero, size });
  // The last baseline sits RULE_GAP above the rule.
  const gap = GAP + A.lineH - A.cap, total = A.height + gap + B.height;
  tops = column([A.height, B.height], [gap], RULE.y - RULE_GAP - total / 2);
}

export function draw(ctx, t, d = dur) {
  withCamera(ctx, defaultPush(t, d), (c) => {
    drawBlock(c, t, IN_A, A, L.cx(), tops[0]);
    drawBlock(c, t, IN_B, B, L.cx(), tops[1]);
  });
  // The rule draws out from its centre.
  const u = inOutCubic(win(t, ...RULE_ON));
  if (u <= 0) return;
  const [x0, x1] = ruleEnds(), h = (x1 - x0) / 2;
  ctx.fillStyle = colors.accent;
  ctx.globalAlpha = outCubic(Math.min(1, u * 3));
  ctx.fillRect(L.cx() - h * u, RULE.y - RULE.width / 2, 2 * h * u, RULE.width);
  ctx.globalAlpha = 1;
}
