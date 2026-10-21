"""Assemble the concise narration on the same clock as the app and film."""
from pathlib import Path
import json, re, subprocess, wave
import numpy as np
root=Path(__file__).resolve().parents[2]
p=root/'app/src/journeyShort.json';manifest=json.loads(p.read_text());rate=32000
folder=root/'app/public/audio/fieldwork';mix=np.zeros(round(manifest['duration']*rate),dtype=np.float32);report=[]
for s in manifest['sections']:
 source=folder/'short-v5'/f"{s['id']}.mp3"
 raw=subprocess.check_output(['/opt/homebrew/bin/ffmpeg','-v','error','-i',str(source),'-f','f32le','-ac','1','-ar',str(rate),'-'])
 signal=np.frombuffer(raw,dtype='<f4').copy()
 # Trim only exterior near-silence; keep expressive pauses inside each sentence.
 block=320;energy=np.array([np.sqrt(np.mean(signal[i:i+block]**2)) for i in range(0,len(signal),block)])
 active=np.flatnonzero(energy>max(.002,energy.max()*.025))
 if not len(active):raise ValueError(f"Silent narration: {s['id']}")
 lo=max(0,int(active[0]*block)-round(.06*rate));hi=min(len(signal),int((active[-1]+1)*block)+round(.09*rate));signal=signal[lo:hi]
 lead=.65 if s['id']=='depart' else .25;available=s['duration']-lead-.2;speed=max(1,len(signal)/rate/available)
 if speed>1.12:raise ValueError(f"Rewrite rather than rush {s['id']}: {speed:.2f}x")
 if speed>1:
  raw=subprocess.check_output(['/opt/homebrew/bin/ffmpeg','-v','error','-f','f32le','-ac','1','-ar',str(rate),'-i','-','-af',f'atempo={speed:.8f}','-f','f32le','-'],input=signal.astype('<f4').tobytes());signal=np.frombuffer(raw,dtype='<f4').copy()
 rms=np.sqrt(np.mean(signal**2));signal*=min(.115/max(rms,1e-6),.88/max(np.max(np.abs(signal)),1e-6))
 fade=min(480,len(signal)//2);signal[:fade]*=np.linspace(0,1,fade);signal[-fade:]*=np.linspace(1,0,fade)
 start=round((s['at']+lead)*rate);end=min(start+len(signal),round((s['end']-.1)*rate));mix[start:end]=signal[:end-start]
 report.append({'id':s['id'],'start':start/rate,'end':end/rate,'speed':round(speed,4),'words':len(s['lines'][0].split())})
 # Hold the relevant line through the visual result; never carry it into the next shot.
 caption=next(c for c in manifest['captions'] if c['text']==s['lines'][0]);caption.update(start=start/rate,end=s['end']-.1)
with wave.open('/private/tmp/fieldwork-short-v5-voice.wav','wb') as w:
 w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate);w.writeframes((mix*32767).astype('<i2').tobytes())
subprocess.run(['/opt/homebrew/bin/ffmpeg','-v','error','-y','-i','/private/tmp/fieldwork-short-v5-voice.wav','-c:a','libmp3lame','-b:a','160k',str(folder/'narrator-short-v5.mp3')],check=True)
p.write_text(json.dumps(manifest,indent=2)+'\n');(root/'tools/journey/short-voice-timing-v5.json').write_text(json.dumps(report,indent=2)+'\n')
def stamp(t):
 ms=round(t*1000);return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'
(folder/'journey-short-v5.en.vtt').write_text('WEBVTT\n\n'+'\n'.join(f"{stamp(c['start'])} --> {stamp(c['end'])}\n{c['text']}\n" for c in manifest['captions']))
print(json.dumps(report,indent=2))
