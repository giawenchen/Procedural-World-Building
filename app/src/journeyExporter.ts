import {StoryMap} from './StoryMap'
import {JourneyForest} from './JourneyForest'
import {AtlasProducer} from './atlasProducer'
import {JOURNEY,journeyAt} from './journeyTimeline'

const WIDTH=1440,HEIGHT=900,FPS=24
const tick=()=>new Promise<void>(resolve=>setTimeout(resolve,0))
export async function exportJourney(canvas:HTMLCanvasElement,progress:(value:number)=>void,signal:AbortSignal){
 canvas.width=WIDTH;canvas.height=HEIGHT
 const c=canvas.getContext('2d')!,host=document.createElement('div')
 Object.assign(host.style,{position:'fixed',left:'-10000px',top:'0',width:'1440px',height:'700px',pointerEvents:'none'})
 const forestHost=document.createElement('div'),mapHost=document.createElement('div')
 Object.assign(forestHost.style,{position:'absolute',width:'1440px',height:'700px'})
 Object.assign(mapHost.style,{position:'absolute',width:'1050px',height:'700px'})
 host.append(forestHost,mapHost);document.body.append(host)
 const forest=new JourneyForest(forestHost,false),map=new StoryMap(mapHost,()=>{}),studyCanvas=document.createElement('canvas')
 const study=new AtlasProducer(studyCanvas,()=>{},()=>{})
 await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())))
 const chunks:BlobPart[]=[],frames=Math.ceil(JOURNEY.duration*FPS)
 let failure:unknown
 const encoder=new VideoEncoder({output:chunk=>{
  const data=new Uint8Array(chunk.byteLength);chunk.copyTo(data)
  const header=new ArrayBuffer(12),v=new DataView(header);v.setUint32(0,data.length,true);v.setBigUint64(4,BigInt(Math.round(chunk.timestamp*FPS/1e6)),true)
  chunks.push(header,data)
 },error:error=>{failure=error}})
 try{
  const config={codec:'vp8',width:WIDTH,height:HEIGHT,bitrate:5_000_000,framerate:FPS}
  if(!(await VideoEncoder.isConfigSupported(config)).supported)throw new Error('This browser cannot encode the film. Open it in a current Chromium browser.')
  encoder.configure(config)
  function text(value:string,x:number,y:number,max:number,size=17,lineHeight=26){
   c.font=`${size}px Georgia`;let line=''
   for(const word of value.split(' ')){const next=line?line+' '+word:word;if(c.measureText(next).width>max&&line){c.fillText(line,x,y);y+=lineHeight;line=word}else line=next}
   c.fillText(line,x,y);return y+lineHeight
  }
  for(let i=0;i<frames;i++){
   if(signal.aborted)throw new Error('Export cancelled.')
   if(failure)throw failure
   const seconds=i/FPS,at=journeyAt(seconds)
   c.fillStyle='#f4ecdb';c.fillRect(0,0,WIDTH,HEIGHT)
   if(at.section.phase==='story'){
    const sky=c.createLinearGradient(0,64,1440,764);sky.addColorStop(0,'#a4bbc0');sky.addColorStop(.65,'#bad1d5');sky.addColorStop(1,'#a6c0c4');c.fillStyle=sky;c.fillRect(0,64,1440,700)
    forest.draw(seconds);c.drawImage(forestHost.querySelector('canvas')!,0,64,1440,700)
    map.draw(seconds,at.section,at.local);c.drawImage(mapHost.querySelector('canvas')!,0,64,1050,700)
    mapHost.querySelectorAll<HTMLButtonElement>('.map-station-sticker').forEach(button=>{
     const x=parseFloat(button.style.left)/100*1050,y=64+parseFloat(button.style.top)/100*700,label=button.textContent??''
     c.font='12px Arial';const w=c.measureText(label).width+25;c.fillStyle=button.classList.contains('selected')?'#60507d':'#fff5db';c.beginPath();c.roundRect(x-w/2,y-16,w,32,3);c.fill();c.strokeStyle='#fff9e8';c.lineWidth=2;c.stroke();c.fillStyle=button.classList.contains('selected')?'#fff8e7':'#5b4c76';c.textAlign='center';c.fillText(label,x,y+4);c.textAlign='left'
    })
    c.fillStyle='#fff5de';c.beginPath();c.roundRect(1090,105,310,560,[2,18,2,2]);c.fill();c.fillStyle='#c5a65e';c.fillRect(1090,105,310,6)
    c.fillStyle='#6f675d';c.font='11px Arial';c.fillText(at.section.session.toUpperCase(),1118,146,253)
    c.fillStyle='#68537f';c.font='italic 46px Georgia';c.fillText(String(at.section.station??0).padStart(2,'0'),1118,208)
    c.fillStyle='#41394e';let y=text(at.section.title,1118,261,250,32,38)+22
    c.strokeStyle='#d4c4a1';c.beginPath();c.moveTo(1118,y-15);c.lineTo(1372,y-15);c.stroke()
    y=text(at.section.rule??'A little seed is looking for a home.',1118,y+15,252,17,27)+25
    c.fillStyle='#6b7663';text(at.section.id==='depart'?'Ride the little railway. Each stop holds a rule.':at.section.id==='arrive'?'The story becomes an experiment. Change one rule and watch the result.':'Watch the landscape, then follow this idea into the experiments.',1118,y,252,16,25)
    c.fillStyle='#5c4e79';c.fillRect(1118,600,252,40);c.fillStyle='#fff7e4';c.font='12px Arial';c.fillText('THE FIELDWORK EXPRESS',1133,625)
    c.fillStyle='#324d4d';c.font='bold 19px Georgia';c.fillText('✳  FIELDWORK',32,36);c.font='10px Arial';c.fillText('A WORLD MADE OF CONNECTIONS',260,35);c.textAlign='right';c.fillText('CHAPTER I · THE JOURNEY',1407,35);c.textAlign='left'
   }else{
    study.renderAt(at.studyTime,seconds*1000)
    c.drawImage(studyCanvas,0,0)
    // Reserve a separate subtitle lane so narration never covers measured outcomes.
    c.fillStyle='#f4ecdb';c.fillRect(0,650,1440,250)
    c.fillStyle='#64755b';c.font='16px Arial';c.fillText(study.frame?.metrics??'',45,746,1340)
   }
   c.fillStyle='#344b46';text(at.caption,45,802,1340,27,37)
   c.fillStyle='#7d7b69';c.font='11px Arial';c.fillText('JIAWEN CHEN  /  PROCEDURAL WORLD BUILDING  /  SESSIONS 3–7',45,876)
   c.textAlign='right';c.fillText(at.section.phase==='story'?'Illustrated story map · real experiments follow':'Independent educational models · not one coupled Earth simulation',1395,876);c.textAlign='left'
   c.fillStyle='#b59454';c.fillRect(45,890,1350*seconds/JOURNEY.duration,3)
   if(seconds<1.2||seconds>JOURNEY.duration-1.2){c.fillStyle=`rgba(244,236,219,${seconds<1.2?1-seconds/1.2:(seconds-JOURNEY.duration+1.2)/1.2})`;c.fillRect(0,0,1440,900)}
   const frame=new VideoFrame(canvas,{timestamp:Math.round(i/FPS*1e6),duration:Math.round(1e6/FPS)})
   encoder.encode(frame,{keyFrame:i%(FPS*3)===0});frame.close()
   while(encoder.encodeQueueSize>6){await tick();if(failure)throw failure}
   if(i%12===0){progress(i/frames);await tick()}
  }
  await encoder.flush();if(failure)throw failure
  const header=new ArrayBuffer(32),v=new DataView(header)
  new Uint8Array(header).set(new TextEncoder().encode('DKIF'));v.setUint16(6,32,true)
  new Uint8Array(header,8,4).set(new TextEncoder().encode('VP80'));v.setUint16(12,WIDTH,true);v.setUint16(14,HEIGHT,true);v.setUint32(16,FPS,true);v.setUint32(20,1,true);v.setUint32(24,frames,true)
  progress(1);return new Blob([header,...chunks],{type:'video/x-ivf'})
 }finally{if(encoder.state!=='closed')encoder.close();map.dispose();forest.dispose();study.dispose();host.remove()}
}
