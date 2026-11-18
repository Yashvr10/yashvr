# 30-second reel in the style of the user's reference (instagram.com/reel/DdArxqMSUn0, Earl Nightingale): one speaker,
# a dark spotlight grade with grain, the words in white Cinzel capitals in the middle, a phrase at a time, a soft music bed.
# Speech: John F. Kennedy at Rice University, 12 September 1962 ("We choose to go to the Moon"), public domain
# (archive.org/details/John-F-Kennedy_Speech_Rice-Stadium). Music: "At The Edge Of Hope" by Hillaby (CC BY-SA 3.0).
#   python3 src/build.py
import subprocess
SRC = "assets/rice-1962-segment.mp4"          # 1350-1425 s of the full address
A = (25.95, 27.95)                              # "We choose to go to the moon."
B = (36.35, 64.35)                              # "We choose to go to the moon in this decade ... and one we intend to win,"
SPEECH_END = 61.30                              # cut before "and the others too"; the picture runs on 2 s under the music
def out(t): return t - A[0] if t <= A[1] else (A[1] - A[0]) + (t - B[0])
P = [("WE CHOOSE TO GO TO THE MOON", 26.18, 27.95), ("WE CHOOSE TO GO TO THE MOON", 36.6, 38.84), ("IN THIS DECADE", 38.84, 39.72),
     ("AND DO THE OTHER THINGS", 39.72, 41.40), ("NOT BECAUSE THEY ARE EASY", 41.46, 43.25), ("BUT BECAUSE THEY ARE HARD", 43.3, 45.45),
     ("BECAUSE THAT GOAL WILL SERVE", 45.5, 48.05), ("TO ORGANIZE AND MEASURE", 48.08, 49.6), ("THE BEST OF OUR ENERGIES AND SKILLS", 49.64, 52.65),
     ("BECAUSE THAT CHALLENGE", 52.7, 54.15), ("IS ONE THAT WE'RE WILLING TO ACCEPT", 54.18, 56.2), ("ONE WE ARE UNWILLING TO POSTPONE", 56.24, 59.48),
     ("AND ONE WE INTEND TO WIN", 59.52, 63.6)]
DUR = out(B[1])
# spotlight: the middle kept bright, the edges (the white crowd) pressed down hard, as in the reference
GRADE = ("crop=400:225:127:17,scale=1920:1080:flags=lanczos,eq=contrast=1.22:brightness=-0.02:saturation=0.72:gamma=0.95,"
         "vignette=angle=PI/2.3:x0=w*0.52:y0=h*0.42,vignette=angle=PI/3.6:x0=w*0.52:y0=h*0.42,noise=alls=14:allf=t,unsharp=5:5:0.4")
def esc(s): return s.replace("'", "’").replace(":", "\\:")
txt = ",".join(
    f"drawtext=fontfile=fonts/Cinzel.ttf:text='{esc(s)}':fontsize=56:fontcolor=white:x=(w-text_w)/2:y=h*0.53-text_h/2:"
    f"shadowcolor=black@0.6:shadowx=0:shadowy=2:alpha='min(1,min((t-{out(a):.3f})/0.12,({out(b):.3f}-t)/0.12))':enable='between(t,{out(a):.3f},{out(b):.3f})'"
    for s, a, b in P)
vf = (f"[0:v]trim={A[0]}:{A[1]},setpts=PTS-STARTPTS[va];[0:v]trim={B[0]}:{B[1]},setpts=PTS-STARTPTS[vb];[va][vb]concat=n=2:v=1:a=0,fps=30,{GRADE},"
      f"fade=t=in:st=0:d=0.4,fade=t=out:st={DUR - 0.8:.2f}:d=0.8,{txt}[v]")
af = (f"[0:a]atrim={A[0]}:{A[1]},asetpts=PTS-STARTPTS,afade=t=out:st={A[1]-A[0]-0.06}:d=0.06[aa];"
      f"[0:a]atrim={B[0]}:{SPEECH_END},asetpts=PTS-STARTPTS,afade=t=in:d=0.08,afade=t=out:st={SPEECH_END-B[0]-0.15}:d=0.15[ab];"
      f"[aa][ab]concat=n=2:v=0:a=1,highpass=f=80,loudnorm=I=-16:TP=-2,apad=whole_dur={DUR:.2f}[sp];"
      f"[1:a]atrim=8:{8+DUR:.2f},asetpts=PTS-STARTPTS,volume=0.22,afade=t=in:d=1.2,afade=t=out:st={DUR-2:.2f}:d=2[mu];"
      f"[sp][mu]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-14:TP=-1.5[a]")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", SRC, "-i", "assets/edge-of-hope.mp3", "-filter_complex", vf + ";" + af,
                "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-b:v", "9M", "-maxrate", "12M", "-bufsize", "18M", "-preset", "slow", "-pix_fmt", "yuv420p",
                "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "video/We-Choose-To-Go-To-The-Moon.mp4"], check=True)
print("video/We-Choose-To-Go-To-The-Moon.mp4", round(DUR, 2), "s")
