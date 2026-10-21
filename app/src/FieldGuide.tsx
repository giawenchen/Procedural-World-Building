import {useCallback,useEffect,useRef,useState} from 'react'
import {StoryMap} from './StoryMap'
import {JourneyForest} from './JourneyForest'
import {AtlasRenderer} from './atlasRenderer'
import {atlasAt,type AtlasFrame} from './atlasProgram'
import {JOURNEY,journeyAt,journeyStamp} from './journeyTimeline'
import {JourneySoundscape} from './JourneySoundscape'
import {storyBeatAt} from './journeyStoryboard'
import './FieldGuide.css'

type Props={open:boolean;onClose:()=>void;onExplore:(id:string)=>void}
const stops=['depart','noise','erosion','climate','population','cave','wind'].map(id=>JOURNEY.sections.find(s=>s.id===id)!)
const fieldNotes:Record<string,{note:string;parameters:string[]}>={
 depart:{note:'A seed carries a possibility. The landscape decides what happens next. Follow the railway, then try the rules for yourself.',parameters:['Land','Water','Life']},
 ground:{note:'Noise lifts a flat field into hills. A mesh samples that field; a shader helps us read the shore, stone and snow.',parameters:['Frequency','Resolution','Height bands']},
 water:{note:'Rain carries soil downhill. What leaves one slope can settle elsewhere. On the coast, the tide can cover a familiar path.',parameters:['Rainfall','Erosion','Tide amplitude']},
 habitat:{note:'A seed needs more than a patch of ground. Warmth, moisture and slope help decide which habitat can support it.',parameters:['Temperature','Moisture','Slope']},
 life:{note:'Branching rules describe one tree. Age, health, seeds and competition give the forest a history. A larger tree is different from a larger population.',parameters:['Growth rate','Reproduction','Competition']},
 beneath:{note:'A mountain has an inside. Subtract a shape to open a cave, then find its surface. Chunking keeps a small edit local.',parameters:['Density','CSG order','Chunk size']},
 invisible:{note:'A direction becomes visible when something follows it. Wind bends a branch; a fluid solver carries dye and corrects pressure.',parameters:['Direction','Advection','Pressure']},
 arrive:{note:'Now the route becomes an experiment. Change one rule, watch the result, and keep asking what made it happen.',parameters:['Observe','Compare','Explore']},
}
const auditionText="Well, hello there. Our little seed is ready for an adventure. Can you see the mountain on our map? A little rain will find its way down, and somewhere along that river, a forest can begin. Come along. We can discover it together, one small wonder at a time."
function FilmJourney({onClose,onExplore}:Omit<Props,'open'>){
 const dialog=useRef<HTMLDialogElement>(null),mapHost=useRef<HTMLDivElement>(null),map=useRef<StoryMap|null>(null),canvas=useRef<HTMLCanvasElement>(null),study=useRef<AtlasRenderer|null>(null),audio=useRef<HTMLAudioElement>(null),sound=useRef<JourneySoundscape|null>(null)
 const [seconds,setSeconds]=useState(0),[playing,setPlaying]=useState(false),[started,setStarted]=useState(false),[ready,setReady]=useState(false),[error,setError]=useState(''),[muted,setMuted]=useState(false),[ambience,setAmbience]=useState(.18),[frame,setFrame]=useState<AtlasFrame|null>(null)
 const audition=useRef<HTMLAudioElement>(null),forestHost=useRef<HTMLDivElement>(null),forest=useRef<JourneyForest|null>(null),stationAction=useRef<(i:number)=>void>(()=>{})
 const alive=useRef(true),lastReport=useRef(-1),lastDraw=useRef(-1),playIntent=useRef(false)
 const state=journeyAt(seconds),section=state.section,isStory=section.phase==='story'
 const beat=isStory?storyBeatAt(seconds):undefined,note=beat??fieldNotes[section.id]
 const paint=useCallback((time:number,force=false)=>{
  const at=journeyAt(time),now=performance.now();if(!force&&now-lastDraw.current<40)return;lastDraw.current=now
  if(at.section.phase==='story'){map.current?.draw(time,at.section,at.local)}
  else if(study.current&&canvas.current){
   const f=study.current.render(atlasAt(at.studyTime)),c=canvas.current.getContext('2d')!,w=canvas.current.width,h=canvas.current.height;c.fillStyle='#e9e2d5';c.fillRect(0,0,w,h)
   const fit=(src:HTMLCanvasElement,x:number,y:number,width:number,height:number,crop=false)=>{const sw=crop?Math.min(src.width,src.height*width/height):src.width;const r=Math.min(width/sw,height/src.height);c.drawImage(src,(src.width-sw)/2,0,sw,src.height,x+(width-sw*r)/2,y+(height-src.height*r)/2,sw*r,src.height*r)}
   const pair=!!f.reference&&(f.paired||f.request.compare)
   if(pair){fit(f.reference!,20,75,w/2-40,h-145,!['fluid','wind','meshing'].includes(f.request.kind));fit(f.canvas,w/2+20,75,w/2-40,h-145,!['fluid','wind','meshing'].includes(f.request.kind));c.strokeStyle='#c6c5b6';c.beginPath();c.moveTo(w/2,70);c.lineTo(w/2,h-60);c.stroke();c.fillStyle='#3c5550';c.font='600 19px Arial';c.fillText(f.referenceLabel??'BEFORE',32,48);c.fillText(f.label??'AFTER',w/2+30,48);c.font='15px Arial';c.fillText(f.referenceMetrics??'',32,h-31,w/2-60);c.fillText(f.metrics,w/2+30,h-31,w/2-60)}else fit(f.canvas,0,0,w,h)
   if(force||now-lastReport.current>140)setFrame(f)
  }
  const speaking=JOURNEY.captions.some(c=>time>=c.start&&time<c.end);sound.current?.update(at.section.ambience,time,speaking)
  if(force||now-lastReport.current>140){setSeconds(time);lastReport.current=now}
 },[])
 useEffect(()=>{
  alive.current=true;const media=audio.current;dialog.current?.showModal();sound.current=new JourneySoundscape()
  let disposed=false;const timer=setTimeout(()=>{if(!mapHost.current||disposed)return;try{map.current=new StoryMap(mapHost.current,i=>stationAction.current(i));if(forestHost.current)forest.current=new JourneyForest(forestHost.current);study.current=new AtlasRenderer();study.current.prepare();paint(audio.current?.currentTime??0,true);setReady(true)}catch(e){setError('The journey could not load. '+String(e))}},50)
  return()=>{disposed=true;alive.current=false;media?.pause();clearTimeout(timer);map.current?.dispose();forest.current?.dispose();study.current?.dispose();sound.current?.dispose();map.current=null;forest.current=null;study.current=null;sound.current=null}
 },[paint])
 useEffect(()=>{if(ready&&!playing){const id=requestAnimationFrame(()=>paint(seconds,true));return()=>cancelAnimationFrame(id)}},[ready,playing,seconds,paint])
 useEffect(()=>{let raf=0;const tick=()=>{if(audio.current)paint(audio.current.currentTime);if(playing)raf=requestAnimationFrame(tick)};if(playing)raf=requestAnimationFrame(tick);return()=>cancelAnimationFrame(raf)},[playing,paint])
 useEffect(()=>{if(audio.current)audio.current.volume=muted?0:1},[muted])
 useEffect(()=>{sound.current?.setLevel(ambience)},[ambience])
 const pause=useCallback(()=>{playIntent.current=false;audio.current?.pause();sound.current?.pause();setPlaying(false)},[])
 useEffect(()=>{const visibility=()=>{if(document.hidden){pause();audition.current?.pause()}};document.addEventListener('visibilitychange',visibility);return()=>document.removeEventListener('visibilitychange',visibility)},[pause])
 useEffect(()=>{const preview=audition.current;return()=>preview?.pause()},[])
 const play=async()=>{
  const a=audio.current;if(!a||!ready)return
  audition.current?.pause()
  playIntent.current=true
  try{if(a.currentTime>=JOURNEY.duration-.1)a.currentTime=0;await a.play();if(!alive.current||!playIntent.current){a.pause();return}sound.current?.start();sound.current?.setLevel(ambience);setStarted(true);setPlaying(true);setError('')}catch{setError('Audio could not start. Press Play to try again; chapter navigation and captions remain available.')}
 }
 const seek=(time:number)=>{audition.current?.pause();const t=Math.max(0,Math.min(JOURNEY.duration,time));if(audio.current)audio.current.currentTime=t;setStarted(true);paint(t,true)}
 useEffect(()=>{stationAction.current=(i)=>{seek(stops[i].at);void play()}})
 const leave=(workspace?:string)=>{pause();audition.current?.pause();if(workspace)onExplore(workspace);else onClose()}
 const stageLabel=isStory?'Animated story map':'Live course experiments'
 return <dialog ref={dialog} className="field-guide journey" aria-label="The Fieldwork Express animated journey" onCancel={e=>{e.preventDefault();leave()}}>
  <audio ref={audio} src={`${import.meta.env.BASE_URL}audio/fieldwork/narrator-short-v5.mp3`} preload="auto" onEnded={()=>{pause();paint(JOURNEY.duration,true)}} onError={()=>setError('The narrator audio did not load. Chapter navigation still works.')} />
  <header className="journey-header"><div><span className="journey-emblem">✳</span><span>FIELDWORK<span className="journey-small">A WORLD MADE OF CONNECTIONS</span></span></div><span className="journey-edition">THE FIELDWORK EXPRESS / {journeyStamp(JOURNEY.duration)}</span><button onClick={()=>leave()}>Return to studio ↗</button></header>
  <main className={`journey-stage ${isStory?'story-stage':'study-stage'}`}>
   <div ref={forestHost} className="journey-forest" hidden={!isStory} aria-hidden="true"/>
   <div ref={mapHost} className="journey-map" hidden={!isStory} aria-label="Illustrated island map with a railway and four animated field-note postcards" role="group" />
   <div className="journey-shade" hidden={!isStory}/>
   <div className={`journey-chapter ${isStory&&!started?'ticket-behind':''}`} key={beat?.id??section.id}><span>{beat?.label??section.session} · {isStory?'CHAPTER I':'CHAPTER II'}</span>{isStory&&<span className="field-stop-number">{String(beat?.station??section.station??0).padStart(2,'0')}</span>}<h1>{beat?.title??section.title}</h1><p>{beat?.rule??section.rule??(frame?.request.cue.note||'Watch one rule change.')}</p>{isStory&&<div className="journey-field-note"><p>{note?.note}</p><div className="field-parameter-tags">{note?.parameters.map(p=><span key={p}>{p}</span>)}</div><span className="field-note-label">LOOK A LITTLE CLOSER</span><p>Select a sticker to jump to its experiment.</p><button onClick={()=>leave(beat?.workspace??section.workspace)}>Explore this study <span>↗</span></button><small>Illustrated guide · the experiments follow in Chapter II.</small></div>}</div>
   <div className="journey-experiment" hidden={isStory}><div className="journey-world"><canvas ref={canvas} width="1280" height="720" aria-label="Measured procedural world experiments with matching before and after views"/><div className="journey-evidence">{frame?.metrics}</div></div><aside className="journey-parameters"><span>THE RULES AT WORK</span><h2>Watch what changes.</h2>{frame?.controls.map((c,i)=><div className={`journey-control ${c.active?'changing':''}`} key={c.label}><div><label htmlFor={`journey-meter-${i}`}>{c.label}</label><output>{c.value.toFixed(c.max>=40?0:2)}{c.unit??''}</output></div><meter id={`journey-meter-${i}`} min={c.min} max={c.max} value={c.value}/><small>{c.note}</small></div>)}<p>{frame?.notes.join(' · ')}</p><button onClick={()=>leave(section.workspace)}>Try these controls ↗</button></aside></div>
   {!started&&<div className="journey-ticket"><span>YOUR TICKET TO A LITTLE WONDER</span><h2>The Fieldwork<br/><em>Express.</em></h2><p>A little seed is looking for a home.<br/>Ride through a world made of rules.</p><button disabled={!ready} onClick={()=>void play()}>{ready?'All aboard — play the story':'Preparing your journey…'} <span>→</span></button><small>English narration & captions · {journeyStamp(JOURNEY.introDuration)} story + {journeyStamp(JOURNEY.duration-JOURNEY.introDuration)} experiments</small></div>}
   {started&&<div className="journey-captions" aria-live="off"><span>{state.caption|| (playing?'…':state.finished?'The journey ends. Your questions begin.':'Paused · continue whenever you are ready.')}</span></div>}
   {state.finished&&<div className="journey-finale"><span>END OF THE LINE. BEGINNING OF YOUR WORLD.</span><h2>What will you change first?</h2><button onClick={()=>leave('living')}>Take the controls ↗</button><button onClick={()=>{seek(0);void play()}}>Ride again ↺</button></div>}
  </main>
  <footer className="journey-console">
   <details className="narrator-audition"><summary>Meet the storyteller · warmer 21-second voice audition</summary><div className="narrator-audition-body"><div><strong>A gentle voice for a little adventure.</strong><p>Revised elderly storyteller sample. The short journey uses this warmer synthetic storyteller.</p><audio ref={audition} controls preload="metadata" aria-label="Elderly storyteller audition" onPlay={pause} src={`${import.meta.env.BASE_URL}audio/fieldwork/grandfather-audition-02.mp3`}/></div><details><summary>Read the audition</summary><p>{auditionText}</p></details></div></details>
   <nav className="journey-stations" aria-label="Story stations">{stops.map((s,i)=><button key={s.id} className={section.id===s.id?'current':''} aria-current={section.id===s.id?'step':undefined} onClick={()=>seek(s.at)}><b>{i===0?'◉':i===7?'↗':String(i).padStart(2,'0')}</b><span>{['Departure','Ground','Water','Habitat','Life','Beneath','Wind','Connections'][i]}</span></button>)}<button className={!isStory?'current':''} onClick={()=>seek(JOURNEY.introDuration)}><b>Ⅱ</b><span>Experiments</span></button></nav>
   <div className="journey-transport"><button className="journey-play" disabled={!ready} onClick={()=>playing?pause():void play()} aria-label={playing?'Pause journey':'Play journey'}>{playing?'Ⅱ':'▶'}<span>{playing?'Pause':'Play'}</span></button><button onClick={()=>{pause();seek(0)}} aria-label="Restart journey">↺</button><label className="journey-scrubber"><span className="sr-only">Journey position in seconds</span><input aria-label="Journey position in seconds" type="range" min="0" max={JOURNEY.duration} step=".1" value={seconds} onChange={e=>seek(+e.target.value)}/><output>{journeyStamp(seconds)} / {journeyStamp(JOURNEY.duration)}</output></label><label className="journey-chapter-select"><span className="sr-only">Jump to chapter</span><select aria-label="Jump to chapter" value={section.id} onChange={e=>seek(JOURNEY.sections.find(s=>s.id===e.target.value)?.at??0)}>{JOURNEY.sections.map(s=><option key={s.id} value={s.id}>{s.phase==='story'?'I':'II'} · {s.title}</option>)}</select></label><button aria-pressed={muted} onClick={()=>setMuted(!muted)}>{muted?'Voice off':'Voice on'}</button><label className="journey-ambience">Atmosphere<input aria-label="Atmosphere volume" type="range" min="0" max=".5" step=".01" value={ambience} onChange={e=>setAmbience(+e.target.value)}/></label></div>
   {error?<p className="journey-error" role="alert">{error}</p>:<div className="journey-footnote"><span>{stageLabel} · English captions always on</span><details><summary>About the sound & models</summary><p>Synthetic elderly storyteller (Vincent), not an actor performance. Original synthesized forest, bird, rain and stream ambience stays below the voice. Chapter I is an illustrative story map. Chapter II uses the app’s actual experiment models. The globe, height-field erosion, tidal coast, 3D caves and 2D fluid solver are separate studies, not one coupled physical simulation.</p><a href={`${import.meta.env.BASE_URL}audio/fieldwork/journey-short-v5.en.vtt`} download>Download English captions</a></details></div>}
  </footer>
 </dialog>
}
export default function FieldGuide({open,...props}:Props){return open?<FilmJourney {...props}/>:null}
