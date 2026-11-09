# Narration: Kokoro (kokoro-onnx) per scene -> assets/vo/<id>.mp3, plus word-timed .vtt via faster-whisper.
import json, sys, os, subprocess, soundfile as sf
from kokoro_onnx import Kokoro
P = sys.argv[1]; K = sys.argv[2]
cfg = json.load(open(f"{P}/src/scenes.json"))
# Respellings for the voice only; captions keep the script text.
SAY = {"Compiègne": "Compyenn"}
def spoken(t):
    for a, b in SAY.items(): t = t.replace(a, b)
    return t
k = Kokoro(f"{K}/kokoro-v1.0.onnx", f"{K}/voices-v1.0.bin")
for s in cfg["scenes"]:
    if "text" not in s: continue
    mp3 = f"{P}/assets/vo/{s['id']}.mp3"
    stamp = f"{P}/assets/vo/.{s['id']}.txt"
    key = f"{cfg['voice']}|{cfg['speed']}|{spoken(s['text'])}"
    if os.path.exists(mp3) and os.path.exists(stamp) and open(stamp).read() == key: continue
    audio, sr = k.create(spoken(s["text"]), voice=cfg["voice"], speed=cfg["speed"], lang="en-gb")
    wav = f"/tmp/{s['id']}.wav"; sf.write(wav, audio, sr)
    subprocess.run(["ffmpeg","-y","-loglevel","error","-i",wav,"-af","loudnorm=I=-16:TP=-1.5:LRA=7","-ar","48000","-ac","1","-b:a","128k",mp3], check=True)
    open(stamp,"w").write(key); print(s["id"], round(len(audio)/sr,2))
