import { useEffect, useRef, useState } from 'react'
import { AtlasRenderer } from './atlasRenderer'
import { STUDIES, studyRequest } from './controlledStudyConfig'
import type { StudyId } from './controlledStudyConfig'
import type { AtlasFrame } from './atlasProgram'
import './ControlledStudies.css'

export default function ControlledStudies() {
  const [id,setId]=useState<StudyId>('erosion'),[value,setValue]=useState(0)
  const [rules,setRules]=useState(false),[compare,setCompare]=useState(true),[playing,setPlaying]=useState(false)
  const [frame,setFrame]=useState<AtlasFrame|null>(null),[error,setError]=useState('')
  const engine=useRef<AtlasRenderer|null>(null),left=useRef<HTMLCanvasElement>(null),right=useRef<HTMLCanvasElement>(null)
  const study=STUDIES.find(s=>s.id===id)!
  const complete=value>=study.max
  useEffect(()=>{try{engine.current=new AtlasRenderer()}catch(e){requestAnimationFrame(()=>setError(String(e)))}return()=>{engine.current?.dispose();engine.current=null}},[])
  useEffect(()=>{
    const raf=requestAnimationFrame(()=>{
      try {
        const f=engine.current?.render(studyRequest(id,value));if(!f)return
        if(left.current&&f.reference)left.current.getContext('2d')!.drawImage(f.reference,0,0)
        if(right.current)right.current.getContext('2d')!.drawImage(f.canvas,0,0)
        setFrame(f)
      } catch(e){setPlaying(false);setError('Unable to render this experiment: '+String(e))}
    });return()=>cancelAnimationFrame(raf)
  },[id,value])
  useEffect(()=>{
    if(!playing||complete)return
    const timer=setInterval(()=>{
      if(document.hidden)return
      setValue(v=>Math.min(study.max,Math.round((v+Math.max(study.step,(study.max-study.min)/30))/study.step)*study.step))
    },250)
    return()=>clearInterval(timer)
  },[playing,study,complete])
  function choose(next:StudyId){setPlaying(false);setId(next);setValue(STUDIES.find(s=>s.id===next)!.min)}
  return <main className="controlled-studies">
    <header><a href="?workspace=living&spin=0">Fieldwork <em>Nature Studio</em></a><span>ONE CHANGE. TWO POSSIBILITIES.</span><a href="?exhibition=1">Exhibition ↗</a></header>
    <nav aria-label="Controlled experiments">{STUDIES.slice(0,3).map(s=><button key={s.id} aria-pressed={id===s.id} onClick={()=>choose(s.id)}>{s.title}</button>)}<label>More studies<select aria-label="More studies" value={STUDIES.slice(0,3).some(s=>s.id===id)?'':id} onChange={e=>choose(e.target.value as StudyId)}><option value="" disabled>Terrain, caves & more</option>{STUDIES.slice(3).map(s=><option key={s.id} value={s.id}>S{s.session} · {s.title}</option>)}</select></label><button className="rules-toggle" aria-pressed={rules} onClick={()=>setRules(v=>!v)}>{rules?'Hide rules':'Show rules'}</button></nav>
    <section className="study-question"><small>SESSION {study.session} / {study.title.toUpperCase()}</small><h1>{study.question}</h1><p>{study.fixed}</p></section>
    {error&&<p role="alert">{error}</p>}
    <div className={`study-pair ${compare?'':'single-view'}`}>
      <figure hidden={!compare}><figcaption><b>A</b>{frame?.referenceLabel?.replace(/^A \/ /,'')||'Reference'}</figcaption><canvas width={1040} height={510} ref={left} aria-label="Experiment A: fixed reference"/><p>{frame?.referenceMetrics||'Preparing reference…'}</p></figure>
      <figure><figcaption><b>B</b>{frame?.label?.replace(/^B \/ /,'')||'Changed condition'}</figcaption><canvas width={1040} height={510} ref={right} aria-label="Experiment B: changed condition"/><p>{frame?.metrics||'Preparing experiment…'}</p></figure>
    </div>
    <section className="study-controls" aria-label="Experiment controls"><button onClick={()=>{if(complete){setValue(study.min);setPlaying(true)}else setPlaying(v=>!v)}} disabled={!!error}>{playing&&!complete?'Pause':complete?'Replay':'Run comparison'}</button><button onClick={()=>{setPlaying(false);setValue(study.min)}}>↺ Reset</button><label>{study.control}<output>{Number(value.toFixed(3))}</output><input aria-label={study.control} type="range" min={study.min} max={study.max} step={study.step} value={value} onChange={e=>{setPlaying(false);setValue(+e.target.value)}}/></label><button aria-pressed={compare} onClick={()=>setCompare(v=>!v)}>{compare?'Focus on B':'Compare A / B'}</button><button onClick={()=>{setPlaying(false);setValue(study.max)}}>See outcome</button></section>
    <p className="study-observation" aria-live="polite">{frame?.caption}</p>
    {rules&&<section className="study-rules"><div><small>THE RULE</small><p>{study.rule}</p></div><div><small>APPLIED VALUES</small><dl>{frame?.controls.map(c=><div key={c.label}><dt>{c.label}</dt><dd>{Number(c.value.toFixed(3))}{c.unit}</dd></div>)}</dl></div><div><small>MODEL BOUNDARY</small><p>{study.boundary}</p></div></section>}
    <footer>Live calculations from the atlas algorithms · matched cameras · repeatable starting conditions · independent studies</footer>
  </main>
}
