// Sound effects synthesised with ffmpeg alone: nothing to download, nothing to license.
import fs from 'node:fs';
import { B, ffmpeg } from './lib.mjs';

fs.mkdirSync(B('sfx'), { recursive: true });
const make = (name, input, af) => {
  const out = B('sfx', `${name}.wav`);
  if (!fs.existsSync(out)) ffmpeg('-f', 'lavfi', '-i', input, '-af', af, '-ar', '48000', '-ac', '2', out);
};

// whoosh: pink noise, band-limited, swelling in and out
make('whoosh', 'anoisesrc=d=0.8:c=pink:r=48000:a=0.6', 'highpass=f=250,lowpass=f=4200,afade=t=in:d=0.3,afade=t=out:st=0.35:d=0.45');
// hit: a sine that drops in pitch while it decays
make('hit', "aevalsrc='sin(2*PI*(55+90*exp(-t*16))*t)*exp(-t*6.5)':d=0.9:s=48000", 'volume=1.4');
// tick: a very short high sine
make('tick', "aevalsrc='sin(2*PI*1900*t)*exp(-t*80)':d=0.12:s=48000", 'volume=1');
// rise: a sine sweeping upward under a growing envelope
make('rise', "aevalsrc='sin(2*PI*(180+700*t/1.6)*t)*0.6*(t/1.6)':d=1.6:s=48000", 'afade=t=out:st=1.4:d=0.2');
console.log('sfx ready:', fs.readdirSync(B('sfx')).join(', '));
