"""Batch text-to-speech with Kokoro (open-source, runs on your CPU).

    pip install kokoro-onnx soundfile
    # then put kokoro-v1.0.onnx and voices-v1.0.bin next to this file
    # (the file names change between releases: the project's README is the source of truth)

Usage: python3 kokoro_say.py jobs.json af_heart 1.0
jobs.json = [{"text": "...", "out": "build/voice/s001.wav"}, ...]
One process speaks every job, so the model loads once instead of once per scene.
"""
import json
import sys

import soundfile as sf
from kokoro_onnx import Kokoro

jobs = json.load(open(sys.argv[1]))
voice = sys.argv[2] if len(sys.argv) > 2 else "af_heart"
speed = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0

kokoro = Kokoro("kokoro-v1.0.onnx", "voices-v1.0.bin")
for job in jobs:
    samples, rate = kokoro.create(job["text"], voice=voice, speed=speed, lang="en-us")
    sf.write(job["out"], samples, rate)
    print("spoke", job["out"])
