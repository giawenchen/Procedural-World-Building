"""Mix the actual frame-rendered app film with its existing narrator and a quiet original score."""
from pathlib import Path
import argparse, json, subprocess, wave
import numpy as np
p=argparse.ArgumentParser();p.add_argument('frames',type=Path);p.add_argument('--score',type=Path,required=True);p.add_argument('--version',choices=['v4','v5'],default='v4');args=p.parse_args()
root=Path(__file__).resolve().parents[2];out=root/'docs/exhibition';manifest=json.loads((root/('app/src/journeyShort.json' if args.version=='v5' else 'app/src/journeyAudio.json')).read_text());duration=manifest['duration'];rate=32000
version=args.version;narrator='narrator-short-v5.mp3' if version=='v5' else 'narrator-preview.mp3'
nature=Path(f'/private/tmp/fieldwork-express-{version}-nature.wav');rng=np.random.default_rng(17)
with wave.open(str(nature),'wb') as w:
 w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate)
 for sec in range(int(duration)):
  raw=rng.normal(0,.06,rate+64);cs=np.cumsum(raw);soft=(cs[64:]-cs[:-64])/8
  t=np.arange(rate)/rate
  # Soft original filtered noise with occasional paired, bird-like tones.
  signal=soft*.16
  if sec%11==4 and (sec<manifest['introDuration'] or any(s['ambience']=='forest' and s['at']<=sec<s['end'] for s in manifest['sections'])):
   for offset,f in [(0.15,1700),(.39,2080)]:
    q=t-offset;mask=(q>0)&(q<.20);envelope=np.sin(np.clip(q/.2,0,1)*np.pi)**2
    signal+=mask*envelope*.012*np.sin(2*np.pi*(f*q+1400*q*q))
  fade=min(1,sec/3,(duration-sec)/4);w.writeframes((signal*fade*32767).clip(-32768,32767).astype('<i2').tobytes())
def stamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02},{ms%1000:03}'
srt=out/f'fieldwork-express-{version}.en.srt';srt.write_text('\n'.join(f"{i+1}\n{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}\n" for i,c in enumerate(manifest['captions'])))
meta=Path(f'/private/tmp/fieldwork-express-{version}.ffmeta');metadata=';FFMETADATA1\ntitle=The Fieldwork Express\nartist=Jiawen Chen\ncomment=Local review. Synthetic narration; independent educational course models.\n'
for s in manifest['sections']:metadata+=f"[CHAPTER]\nTIMEBASE=1/1000\nSTART={round(s['at']*1000)}\nEND={round(s['end']*1000)}\ntitle={s['title']}\n"
meta.write_text(metadata)
destination=out/f'fieldwork-express-{version}-review.mp4'
cmd=['/opt/homebrew/bin/ffmpeg','-hide_banner','-loglevel','warning','-y','-i',str(args.frames),'-i',str(root/'app/public/audio/fieldwork'/narrator),'-i',str(args.score),'-i',str(nature),'-i',str(srt),'-i',str(meta),'-filter_complex','[1:a]volume=1[voice];[2:a]volume=0.16[music];[3:a]volume=0.32[nature];[voice][music][nature]amix=inputs=3:normalize=0:duration=first,alimiter=limit=0.89[a]','-map','0:v','-map','[a]','-map','4:s','-map_metadata','5','-map_chapters','5','-c:v','libx264','-preset','fast','-crf','21','-pix_fmt','yuv420p','-c:a','aac','-b:a','160k','-c:s','mov_text','-metadata:s:s:0','language=eng','-t',str(duration),'-movflags','+faststart',str(destination)]
print('Encoding full review film',flush=True);subprocess.run(cmd,check=True);print(destination,flush=True)
