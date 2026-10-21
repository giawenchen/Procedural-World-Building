import { cueAt, FILM_DURATION, filmAt, filmCaption, filmControls, filmMetrics, type FilmLink, type FilmRendered } from './exhibitionFilm'
import type { ExhibitStory } from './exhibitionScript'

type Callbacks = {
  scene: (story: ExhibitStory) => void; progress: (seconds: number) => void;
  finish: (video: Blob, captions: Blob, complete: boolean) => void; error: (message: string) => void
}
const stamp=(seconds:number)=>{const ms=Math.round(seconds*1000);return `${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`}
export function startFilmCapture(link: {current: FilmLink}, cb: Callbacks) {
  const output=document.createElement('canvas');output.width=1440;output.height=810
  const ctx=output.getContext('2d')!, previous=document.createElement('canvas');previous.width=1440;previous.height=810
  const prev=previous.getContext('2d')!, stream=output.captureStream(30)
  const mimeType=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t))
  let media:MediaRecorder
  try{media=new MediaRecorder(stream,{mimeType,videoBitsPerSecond:8_000_000})}
  catch(error){stream.getTracks().forEach(t=>t.stop());throw error}
  const chunks:Blob[]=[], references=new Map<string,{canvas:HTMLCanvasElement;metrics:string;label:string}>()
  const subtitles:{at:number;text:string}[]=[]
  let frame=0,start=0,elapsed=0,lastSecond=-1,scene:ExhibitStory='forest',layout='',transitionAt=-1,stopped=false,failed=false
  link.current={request:filmAt(0),rendered:null};cb.scene('forest')
  media.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)}
  media.onstop=()=>{
    const srt=subtitles.map((s,i)=>`${i+1}\n${stamp(s.at)} --> ${stamp(subtitles[i+1]?.at??elapsed)}\n${s.text}\n`).join('\n')
    cb.finish(new Blob(chunks,{type:media.mimeType}),new Blob([srt],{type:'text/plain'}),elapsed>=FILM_DURATION&&!failed)
  }
  media.onerror=()=>{failed=true;stop();cb.error('The video encoder reported an error. A partial capture may be available.')}
  function stop(){if(stopped)return;stopped=true;cancelAnimationFrame(frame);document.removeEventListener('visibilitychange',visibility);if(media.state==='recording')media.stop();else cb.finish(new Blob([]),new Blob([]),false);stream.getTracks().forEach(t=>t.stop());link.current.request=null}
  function visibility(){if(document.hidden)stop()}
  document.addEventListener('visibilitychange',visibility)
  function fit(source:HTMLCanvasElement,x:number,y:number,w:number,h:number){const scale=Math.min(w/source.width,h/source.height),dw=source.width*scale,dh=source.height*scale;ctx.drawImage(source,x+(w-dw)/2,y+(h-dh)/2,dw,dh)}
  function comparison(source:HTMLCanvasElement,x:number){
    // Both views use the same central crop and camera; only the world state differs.
    const cropWidth=Math.min(source.width,source.height*493/385)
    ctx.drawImage(source,(source.width-cropWidth)/2,0,cropWidth,source.height,x,203,493,385)
  }
  function drawControls(f:FilmRendered){
    const x=1102,w=294,r=f.request
    ctx.fillStyle='#e8e8dc';ctx.beginPath();ctx.roundRect(x,140,w,506,16);ctx.fill()
    ctx.fillStyle='#3e523a';ctx.font='bold 14px Arial';ctx.fillText('PARAMETERS / LIVE',x+20,173)
    ctx.font='12px Arial';ctx.fillStyle='#6c7464';ctx.fillText('Recorded from the rendered state',x+20,195)
    filmControls(f).forEach((c,i)=>{
      const y=232+i*106,left=x+22,right=x+w-22,p=Math.max(0,Math.min(1,(c.value-c.min)/(c.max-c.min))),thumb=left+(right-left)*p
      ctx.fillStyle='#34472f';ctx.font='16px Arial';ctx.fillText(c.label,left,y)
      ctx.textAlign='right';ctx.font='bold 16px Arial';ctx.fillText(c.value.toFixed(c.label==='Volume cells'?0:2)+c.unit,right,y);ctx.textAlign='left'
      ctx.lineCap='round';ctx.lineWidth=4;ctx.strokeStyle='#c8ccb9';ctx.beginPath();ctx.moveTo(left,y+25);ctx.lineTo(right,y+25);ctx.stroke()
      ctx.strokeStyle=c.active?'#ba744b':'#72815d';ctx.beginPath();ctx.moveTo(left,y+25);ctx.lineTo(thumb,y+25);ctx.stroke()
      if(c.active){ctx.fillStyle='#ba744b28';ctx.beginPath();ctx.arc(thumb,y+25,15,0,Math.PI*2);ctx.fill()}
      ctx.fillStyle=c.active?'#ba744b':'#72815d';ctx.beginPath();ctx.arc(thumb,y+25,7,0,Math.PI*2);ctx.fill()
      ctx.fillStyle='#6c7464';ctx.font='11px Arial';ctx.fillText(c.note,left,y+54)
    })
    ctx.fillStyle='#3e523a';ctx.font='13px Arial'
    const notes=r.story==='cave'?[r.pillar?'CSG: carve → add pillar':'CSG: add pillar → carve',r.pocket?'Local pocket: ON':'Local pocket: OFF',`Rebuilt ${f.rebuilt} / ${f.chunks} chunks`]:r.story==='tide'?['Plant state held fixed','Seed 17 · same camera at comparison']:['Seed 17 · branch iterations 2','Initial density held fixed']
    notes.forEach((line,i)=>ctx.fillText(line,x+22,(r.story==='cave'?492:568)+i*23))
    ctx.font='11px Arial';ctx.fillStyle='#8b6244';ctx.fillText('Terracotta = changing control',x+22,628)
  }
  function drawView(f:FilmRendered,now:number){
    const cue=cueAt(f.request.seconds),reference=references.get(cue.reference)
    const nextLayout=`${cue.at}:${f.request.compare}`
    if(nextLayout!==layout){prev.clearRect(0,0,1440,810);prev.drawImage(output,0,0);transitionAt=layout?now:-1;layout=nextLayout}
    ctx.globalAlpha=1;ctx.fillStyle='#f6f3e9';ctx.fillRect(0,0,1440,810)
    if(f.request.compare&&reference){
      comparison(reference.canvas,44);comparison(f.canvas,567)
      ctx.fillStyle='#5d6d50';ctx.font='bold 15px Arial';ctx.fillText('BEFORE / '+reference.label,52,163);ctx.fillText('AFTER / '+cue.phase.split(' · ')[1],575,163)
      ctx.fillStyle='#68715e';ctx.font='15px Arial';ctx.fillText(reference.metrics,52,620,480);ctx.fillText(filmMetrics(f),575,620,480)
    }else{
      fit(f.canvas,40,135,1040,510)
      ctx.fillStyle='#f6f3e9ee';ctx.fillRect(54,149,Math.min(560,ctx.measureText(cue.phase).width+50),31)
      ctx.fillStyle='#43563d';ctx.font='bold 15px Arial';ctx.fillText(cue.phase.toUpperCase(),65,170)
    }
    ctx.fillStyle='#68755b';ctx.font='13px Arial';ctx.fillText('FIELDWORK / NATURE STUDIO',44,31)
    ctx.fillStyle='#293b2f';ctx.font='36px Georgia';ctx.fillText(cue.title,44,79)
    ctx.fillStyle='#6c7464';ctx.font='14px Arial'
    const detail=f.request.story==='tide'?'Prescribed tide / same terrain and fixed plant state':f.request.story==='cave'?'3D density / ordered CSG / Marching Cubes / 48³ cells':'Seed 17 / fixed branch grammar / accelerated educational ecology'
    ctx.fillText(detail,44,111)
    drawControls(f)
    const caption=filmCaption(f);ctx.fillStyle='#293b2f';ctx.font='28px Arial';let line='',y=695
    for(const word of caption.split(' ')){const next=line?line+' '+word:word;if(ctx.measureText(next).width>1340){ctx.fillText(line,44,y);y+=34;line=word}else line=next}ctx.fillText(line,44,y)
    ctx.fillStyle='#5e6e53';ctx.font='19px Arial';ctx.fillText(filmMetrics(f),44,766,1340)
    ctx.fillStyle='#80906a';ctx.fillRect(44,794,1352*Math.min(1,elapsed/FILM_DURATION),3)
    if(transitionAt>=0){const p=Math.min(1,(now-transitionAt)/700),smooth=p*p*(3-2*p);ctx.globalAlpha=1-smooth;ctx.drawImage(previous,0,0);ctx.globalAlpha=1}
    if(subtitles.at(-1)?.text!==caption)subtitles.push({at:elapsed,text:caption})
  }
  function draw(now:number){
    if(stopped)return
    if(start){elapsed=Math.min(FILM_DURATION,(now-start)/1000);const request=filmAt(elapsed);link.current.request=request;if(request.story!==scene){scene=request.story;link.current.rendered=null;cb.scene(scene)}}
    const rendered=link.current.rendered
    if(rendered&&rendered.request.story===scene){
      if(!start){start=now;media.start(1000)}
      const key=rendered.request.capture
      if(key&&!references.has(key)){const copy=document.createElement('canvas');copy.width=rendered.canvas.width;copy.height=rendered.canvas.height;copy.getContext('2d')!.drawImage(rendered.canvas,0,0);references.set(key,{canvas:copy,metrics:filmMetrics(rendered),label:cueAt(rendered.request.seconds).phase.split(' · ')[1]??'original state'})}
      drawView(rendered,now)
    }
    if(Math.floor(elapsed)!==lastSecond){lastSecond=Math.floor(elapsed);cb.progress(lastSecond)}
    if(elapsed>=FILM_DURATION)stop();else frame=requestAnimationFrame(draw)
  }
  frame=requestAnimationFrame(draw)
  return stop
}
