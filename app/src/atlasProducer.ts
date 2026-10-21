import { AtlasRenderer } from './atlasRenderer'
import { ATLAS_DURATION, atlasAt, type AtlasFrame } from './atlasProgram'
const stamp=(s:number)=>{const ms=Math.round(s*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`}
export class AtlasProducer {
 frame:AtlasFrame|null=null
 readonly world=new AtlasRenderer()
 private canvas:HTMLCanvasElement
 private context:CanvasRenderingContext2D
 private previous=document.createElement('canvas')
 private layout=''
 private transition=-1
 private elapsed=0
 private playing=false
 private raf=0
 private last=0
 private reported=-1
 private media:MediaRecorder|null=null
 private stream:MediaStream|null=null
 private chunks:Blob[]=[]
 private subtitles:{at:number;text:string}[]=[]
 private observations:Record<string,unknown>={}
 private onProgress:(seconds:number,playing:boolean,caption:string)=>void
 private onFinish:(video:Blob,srt:Blob,data:Blob,complete:boolean)=>void
 constructor(canvas:HTMLCanvasElement,onProgress:AtlasProducer['onProgress'],onFinish:AtlasProducer['onFinish']){
  this.canvas=canvas;canvas.width=1440;canvas.height=810;this.context=canvas.getContext('2d')!;this.previous.width=1440;this.previous.height=810;this.onProgress=onProgress;this.onFinish=onFinish
  this.world.prepare();this.paint(0);document.addEventListener('visibilitychange',this.hidden)
 }
 renderAt(seconds:number,clockMilliseconds:number){this.elapsed=Math.max(0,Math.min(ATLAS_DURATION,seconds));this.paint(clockMilliseconds)}
 private hidden=()=>{if(document.hidden){if(this.media)this.stopRecording();else this.pause()}}
 dispose(){this.pause();this.stopRecording();document.removeEventListener('visibilitychange',this.hidden);this.world.dispose()}
 seek(seconds:number){if(this.media)return;this.elapsed=Math.max(0,Math.min(ATLAS_DURATION,seconds));this.layout='';this.paint(performance.now());this.last=0}
 play(){if(this.playing)return;if(this.elapsed>=ATLAS_DURATION)this.seek(0);this.playing=true;this.last=0;this.raf=requestAnimationFrame(this.tick)}
 pause(){this.playing=false;cancelAnimationFrame(this.raf);this.onProgress(this.elapsed,false,'')}
 private tick=(now:number)=>{if(!this.playing)return;if(this.last)this.elapsed=Math.min(ATLAS_DURATION,this.elapsed+(now-this.last)/1000);this.last=now;this.paint(now);if(this.elapsed>=ATLAS_DURATION){this.pause();this.stopRecording()}else this.raf=requestAnimationFrame(this.tick)}
 record(){if(this.media)return;this.pause();this.seek(0);this.subtitles=[];this.observations={};this.chunks=[];this.stream=this.canvas.captureStream(30)
  const mimeType=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));this.media=new MediaRecorder(this.stream,{mimeType,videoBitsPerSecond:8_000_000});const type=this.media.mimeType
  this.media.ondataavailable=e=>{if(e.data.size)this.chunks.push(e.data)}
  this.media.onstop=()=>{const srt=this.subtitles.map((s,i)=>`${i+1}\n${stamp(s.at)} --> ${stamp(this.subtitles[i+1]?.at??this.elapsed)}\n${s.text}\n`).join('\n');this.onFinish(new Blob(this.chunks,{type}),new Blob([srt],{type:'text/plain'}),new Blob([JSON.stringify({duration:this.elapsed,capturedAt:new Date().toISOString(),observations:this.observations},null,2)],{type:'application/json'}),this.elapsed>=ATLAS_DURATION)}
  this.media.start(1000);this.play()
 }
 stopRecording(){if(!this.media)return;const m=this.media;this.media=null;this.pause();if(m.state!=='inactive')m.stop();this.stream?.getTracks().forEach(t=>t.stop());this.stream=null}
 private fit(source:HTMLCanvasElement,x:number,y:number,w:number,h:number){const scale=Math.min(w/source.width,h/source.height),dw=source.width*scale,dh=source.height*scale;this.context.drawImage(source,x+(w-dw)/2,y+(h-dh)/2,dw,dh)}
 private comparison(source:HTMLCanvasElement,x:number,diagram:boolean){if(diagram){this.fit(source,x,206,498,354);return}const sw=Math.min(source.width,source.height*498/370);this.context.drawImage(source,(source.width-sw)/2,0,sw,source.height,x,194,498,370)}
 private controls(f:AtlasFrame){const c=this.context,x=1102,w=294;c.fillStyle='#e8e8dc';c.beginPath();c.roundRect(x,140,w,506,16);c.fill();c.fillStyle='#3e523a';c.font='bold 14px Arial';c.fillText('PARAMETERS / LIVE',x+20,171);c.font='12px Arial';c.fillStyle='#6c7464';c.fillText('These values drive the rendered state',x+20,192)
  const step=f.controls.length>4?64:94
  f.controls.forEach((a,i)=>{const y=224+i*step,l=x+20,right=x+w-20,p=Math.max(0,Math.min(1,(a.value-a.min)/(a.max-a.min))),thumb=l+(right-l)*p;c.fillStyle='#34472f';c.font='14px Arial';c.fillText(a.label,l,y);c.textAlign='right';c.font='bold 14px Arial';const precision=a.label.includes('Rain')?3:a.unit==='°'||a.max>=40||a.label.includes('Iterations')?0:2;c.fillText(a.value.toFixed(precision)+(a.unit??''),right,y);c.textAlign='left';c.lineCap='round';c.lineWidth=4;c.strokeStyle='#c8ccb9';c.beginPath();c.moveTo(l,y+19);c.lineTo(right,y+19);c.stroke();c.strokeStyle=a.active?'#ba744b':'#72815d';c.beginPath();c.moveTo(l,y+19);c.lineTo(thumb,y+19);c.stroke();c.fillStyle=c.strokeStyle;c.beginPath();c.arc(thumb,y+19,6,0,Math.PI*2);c.fill();c.fillStyle='#6c7464';c.font='11px Arial';c.fillText(a.note,l,y+39,252)})
  c.fillStyle='#536049';c.font='12px Arial';if(f.controls.length<=4)f.notes.forEach((n,i)=>c.fillText(n,x+20,570+i*20,250));c.fillStyle='#8b6244';c.font='11px Arial';c.fillText('Terracotta = changing control',x+20,629)
 }
 private paint(now:number){const f=this.world.render(atlasAt(this.elapsed));this.frame=f;const c=this.context,pair=!!f.reference&&(f.paired||f.request.compare),layout=f.request.kind+':'+pair
  if(layout!==this.layout){this.previous.getContext('2d')!.drawImage(this.canvas,0,0);this.transition=this.layout?now:-1;this.layout=layout}
  c.globalAlpha=1;c.fillStyle='#f6f3e9';c.fillRect(0,0,1440,810)
  if(pair){const diagram=['fluid','wind'].includes(f.request.kind);this.comparison(f.reference!,44,diagram);this.comparison(f.canvas,567,diagram);c.fillStyle='#5d6d50';c.font='bold 15px Arial';c.fillText(f.referenceLabel??'BEFORE',52,163);c.fillText(f.label||'AFTER / same camera',575,163);c.font='14px Arial';c.fillText(f.referenceMetrics??'',52,615,490);c.fillText(f.metrics,575,615,490)}else this.fit(f.canvas,40,135,1040,510)
  c.fillStyle='#68755b';c.font='13px Arial';c.fillText('FIELDWORK / NATURE STUDIO',44,31);c.textAlign='right';c.fillText(f.request.cue.session,1396,31);c.textAlign='left';c.fillStyle='#293b2f';c.font='36px Georgia';c.fillText(f.request.cue.title,44,79,1330);c.fillStyle='#6c7464';c.font='14px Arial';c.fillText(f.request.cue.note,44,111,1340);this.controls(f)
  c.fillStyle='#293b2f';c.font='26px Arial';let line='',y=693;for(const word of f.caption.split(' ')){const next=line?line+' '+word:word;if(c.measureText(next).width>1340){c.fillText(line,44,y);y+=34;line=word}else line=next}c.fillText(line,44,y);c.fillStyle='#5e6e53';c.font='18px Arial';c.fillText(f.metrics,44,765,1340);c.fillStyle='#80906a';c.fillRect(44,794,1352*this.elapsed/ATLAS_DURATION,3)
  if(this.transition>=0){const p=Math.min(1,(now-this.transition)/650),ease=p*p*(3-2*p);c.globalAlpha=1-ease;c.drawImage(this.previous,0,0);c.globalAlpha=1}
  if(this.media){if(this.subtitles.at(-1)?.text!==f.caption)this.subtitles.push({at:this.elapsed,text:f.caption});this.observations[f.request.kind]={at:this.elapsed,metrics:f.metrics,controls:f.controls,measurements:f.measurements}}
  if(Math.floor(this.elapsed)!==this.reported||!this.playing){this.reported=Math.floor(this.elapsed);this.onProgress(this.elapsed,this.playing,f.caption)}
 }
}
