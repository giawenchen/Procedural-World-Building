"""Synthesize an original ambient score and encode an actual app capture.
Usage: python finish_film.py /path/to/fieldwork-exhibition-raw.webm
Requires numpy and ffmpeg. No downloaded samples or third-party music.
"""
from pathlib import Path
import argparse
import subprocess
import tempfile
import wave
import numpy as np

parser = argparse.ArgumentParser()
parser.add_argument('capture', type=Path, nargs='?')
parser.add_argument('--score-only', type=Path)
parser.add_argument('--duration', type=int, default=110)
parser.add_argument('--version', default='v2')
args = parser.parse_args()
rate, duration = 44100, args.duration
n = rate * duration
mix = np.zeros((n, 2), dtype=np.float32)
chords = [(50,57,61,64,69), (47,54,57,61,66), (43,50,54,57,62), (45,52,57,59,64)]

def tone(midi, onset, length, gain, pan, pluck=False):
    start = int(onset*rate)
    count = min(int(length*rate), n-start)
    if count <= 0: return
    t = np.arange(count)/rate
    f = 440*2**((midi-69)/12)
    if pluck:
        envelope = (1-np.exp(-t/0.018))*np.exp(-t/1.4)
        signal = np.sin(2*np.pi*f*t) + .16*np.sin(2*np.pi*f*2*t)
    else:
        envelope = np.minimum(t/2.8, 1)*np.minimum((length-t)/3.5, 1)
        signal = (.65*np.sin(2*np.pi*f*t+.006*np.sin(t*.8))
                  + .22*np.sin(2*np.pi*f*1.0018*t)
                  + .1*np.sin(2*np.pi*f*2*t))
    mono = signal * np.maximum(0,envelope) * gain
    mix[start:start+count,0] += mono*np.sqrt((1-pan)/2)
    mix[start:start+count,1] += mono*np.sqrt((1+pan)/2)

for block, onset in enumerate(np.arange(0, duration, 12)):
    chord = chords[block%4]
    for j, note in enumerate(chord):
        tone(note, onset, 15, .035, (j-2)*.3)
    for j, offset in enumerate((2,5.5,8,10)):
        tone(chord[(j+2)%5]+12, onset+offset, 5, .018, (-1)**j*.4, True)
# Quiet, cross-channel echoes of the sparse upper notes/pads.
for delay, gain in ((.39,.13),(.71,.09),(1.13,.055)):
    k=int(delay*rate)
    mix[k:] += mix[:-k,::-1].copy()*gain
fade=np.minimum(np.arange(n)/rate/3,1)*np.minimum((n-np.arange(n))/rate/4,1)
mix*=fade[:,None]
mix*=min(1,.45/np.max(np.abs(mix)))
score=args.score_only or Path(tempfile.gettempdir())/'fieldwork-ambient-original.wav'
with wave.open(str(score),'wb') as f:
    f.setnchannels(2);f.setsampwidth(2);f.setframerate(rate)
    f.writeframes((mix*32767).astype('<i2').tobytes())
print(f'Original score: {score}; peak {np.max(np.abs(mix)):.3f}',flush=True)
if args.capture:
    destination=Path(__file__).resolve().parents[2]/'docs'/'exhibition'
    silent=destination/f'fieldwork-midterm-{args.version}-silent.mp4'
    music=destination/f'fieldwork-midterm-{args.version}-music.mp4'
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(args.capture),'-an','-t',str(duration),'-vf','fps=30','-c:v','libx264','-preset','fast','-crf','23','-pix_fmt','yuv420p','-movflags','+faststart',str(silent)],check=True)
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(silent),'-i',str(score),'-map','0:v:0','-map','1:a:0','-c:v','copy','-c:a','aac','-b:a','160k','-af','loudnorm=I=-23:TP=-2:LRA=9','-shortest','-movflags','+faststart',str(music)],check=True)
    print(f'Finished: {music}\nSilent: {silent}')
