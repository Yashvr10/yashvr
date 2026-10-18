import * as s01 from './s01_title.js';
import * as s02 from './s02_type_demo.js';
import * as s03 from './s03_diagram.js';

export const SCENES = [s01, s02, s03];
export const DURATION = Math.max(...SCENES.map((s) => s.start + s.dur));

// The scene active at time t (the last one holds past the end).
export const sceneAt = (t) => SCENES.findLast((s) => t >= s.start) ?? SCENES[0];
