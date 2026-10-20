// Narration -> one WAV per scene. Cached: only changed lines are re-spoken.
import fs from 'node:fs';
import { B, run, sha, video, flags, writeJSON } from './lib.mjs';

const v = video();
const voice = { ...v.meta.voice, ...(flags().engine ? { engine: flags().engine } : {}) };

fs.mkdirSync(B('voice'), { recursive: true });
// The voice reads a respelled copy of the line; captions keep the original words.
//   "pronounce": { "Roemer": "Roh-mer", "ffmpeg": "eff eff em peg" }
const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const spoken = (text) =>
  Object.entries(v.meta.pronounce || {}).reduce((t, [from, to]) => t.replace(new RegExp(`\\b${escapeRe(from)}\\b`, 'g'), to), text);

const pending = [];
for (const s of v.scenes) {
  const text = spoken(s.narration);
  const wav = B('voice', `${s.id}.wav`);
  // Your own recordings are fingerprinted by file time too, so re-recording a
  // line (same words, new take) invalidates its captions and its scene.
  const key = voice.engine === 'manual' && fs.existsSync(wav) ? sha(voice, text, fs.statSync(wav).mtimeMs) : sha(voice, text);
  const tag = B('voice', `${s.id}.key`);
  if (fs.existsSync(wav) && fs.existsSync(tag) && fs.readFileSync(tag, 'utf8') === key) continue;
  if (voice.engine === 'manual') {
    // Your own recordings: put build/voice/<scene id>.wav in place yourself.
    if (!fs.existsSync(wav)) throw new Error(`Missing recording for ${s.id}: ${wav}`);
    fs.writeFileSync(tag, key);
    continue;
  }
  pending.push({ id: s.id, text, out: wav, tag, key });
}

if (pending.length) {
  if (voice.engine === 'say') {
    // macOS built-in voice. Free, offline, nothing to install.
    for (const j of pending) {
      run('say', ['-v', voice.name, '-r', String(voice.rate || 175), '-o', j.out, '--data-format=LEI16@24000', '--', j.text]);
      console.log('voice', j.id);
    }
  } else if (voice.engine === 'kokoro') {
    // Neural open-source voice: one Python process, model loaded once.
    writeJSON(B('voice', 'jobs.json'), pending.map(({ text, out }) => ({ text, out })));
    run('python3', ['kokoro_say.py', B('voice', 'jobs.json'), voice.name || 'af_heart', String(voice.speed || 1)]);
  } else if (voice.engine === 'command') {
    // Any command-line TTS: "command": ["my-tts", "--text", "{text}", "--out", "{out}"]
    for (const j of pending) {
      const [cmd, ...args] = voice.command.map((a) => a.replace('{text}', j.text).replace('{out}', j.out));
      run(cmd, args);
      console.log('voice', j.id);
    }
  } else throw new Error(`Unknown voice engine: ${voice.engine}`);
  for (const j of pending) fs.writeFileSync(j.tag, j.key);
}
console.log(`tts: ${pending.length} spoken, ${v.scenes.length - pending.length} cached`);
