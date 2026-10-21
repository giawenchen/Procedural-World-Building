import PocketPortal from './PocketPortal'
import './PocketIsland.css'
import { useEffect, useRef, useState } from 'react'
import LivingWorld from './LivingWorld'
import VoxelLab from './VoxelLab'
import { makeLayer } from './noiseEngine'
import { STORIES, type ExhibitCommand, type ExhibitStory } from './exhibitionScript'
import { FILM_DURATION, type FilmLink } from './exhibitionFilm'
import { startFilmCapture } from './filmRecorder'
import './Exhibition.css'

const LAYERS = [{ ...makeLayer(1), name: 'Base terrain', weight: 1 }]
const INITIAL = { tide: 'tide-reset', cave: 'cave-solid', forest: 'forest-reset' }

export default function Exhibition() {
  const [story, setStory] = useState<ExhibitStory>('forest')
  const [command, setCommand] = useState<ExhibitCommand>({ id: 0, name: 'forest-reset' })
  const [rules, setRules] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [recording, setRecording] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [download, setDownload] = useState('')
  const [captions, setCaptions] = useState('')
  const [notice, setNotice] = useState('Drag to orbit. Scroll to look closer. Reset to repeat the experiment.')
  const stage = useRef<HTMLDivElement>(null)
  const film = useRef<FilmLink>({request:null,rendered:null})
  const captionsRef = useRef('')
  const stopRecording = useRef<() => void>(() => {})
  const urlRef = useRef('')
  const info = STORIES[story]
  function send(name: string) {
    setCommand(c => ({ id: c.id + 1, name }))
    setPlaying(['tide-play', 'forest-grow', 'resume'].includes(name))
  }
  function choose(next: ExhibitStory) {
    setStory(next); setRules(false); send(INITIAL[next])
    setNotice('Drag to orbit. Scroll to look closer. Reset to repeat the experiment.')
  }
  useEffect(() => () => {
    stopRecording.current()
    if (captionsRef.current) URL.revokeObjectURL(captionsRef.current)
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
  }, [])

  function recordFilm() {
    if (recording || !stage.current?.querySelector('canvas')) return
    if (typeof MediaRecorder === 'undefined') { setNotice('This browser does not support canvas recording.'); return }
    setRules(false);setRecording(true);setElapsed(0);setDownload('');setCaptions('')
    try {
      stopRecording.current=startFilmCapture(film,{
        scene:next=>{setStory(next);send(`film-${next}`)},
        progress:setElapsed,
        finish:(video,srt,complete)=>{
          if(urlRef.current)URL.revokeObjectURL(urlRef.current)
          if(captionsRef.current)URL.revokeObjectURL(captionsRef.current)
          urlRef.current=URL.createObjectURL(video);captionsRef.current=URL.createObjectURL(srt)
          setDownload(urlRef.current);setCaptions(captionsRef.current);setRecording(false);send('pause')
          setNotice(complete?'Your comparison film and synchronized captions are ready.':'Capture stopped early. The download contains only the recorded portion.')
        },
        error:message=>{setRecording(false);setNotice(message)},
      })
    } catch {setRecording(false);setNotice('Canvas recording is unavailable in this browser.')}
  }

  return <div className={`exhibition ${rules ? 'show-rules' : ''} ${recording ? 'is-recording' : ''}`}>
    <header className="exhibition-masthead">
      <a className="exhibition-brand" href="?workspace=living&spin=0">Fieldwork <small>Nature Studio</small></a>
      <span className="exhibition-edition">A WORLD SHAPED BY RULES<small>JIAWEN CHEN / MIDTERM 2026</small></span>
      <div><a href="?experiments=1" target="_blank" rel="noreferrer">Compare experiments ↗</a><PocketPortal/><button disabled={recording} aria-expanded={rules} onClick={() => setRules(v => !v)}>{rules ? 'Hide rules' : 'Show rules'}</button><a href="?workspace=living&spin=0">Research studio ↗</a></div>
    </header>
    <nav className="exhibition-stories" aria-label="Exhibition studies">{(Object.keys(STORIES) as ExhibitStory[]).map(key => <button key={key} disabled={recording} aria-pressed={story === key} onClick={() => choose(key)}><small>{STORIES[key].number}</small>{STORIES[key].title}<span>↗</span></button>)}</nav>
    <section className="exhibition-intro"><div><span>THREE EXPERIMENTS / ONE PROCEDURAL ATLAS</span><h1>{info.question}</h1></div><p>{info.note}</p></section>
    <div ref={stage} className="exhibition-stage" aria-label={info.title}>
      {story === 'cave' ? <VoxelLab key="cave" active exhibit command={command} film={film} /> : <LivingWorld key={story} active layers={LAYERS} solo={null} exhibit={story} command={command} film={film} />}
    </div>
    <section className="exhibition-actions" aria-label="Demonstration controls">
      {story === 'tide' && <><button className="primary" disabled={recording} onClick={() => send(playing ? 'pause' : 'tide-play')}>{playing ? 'Pause tide' : 'Play tide cycle'}</button><button disabled={recording} onClick={() => send('tide-high')}>High tide</button><button disabled={recording} onClick={() => send('tide-low')}>Low tide</button></>}
      {story === 'cave' && <><button className="primary" disabled={recording} onClick={() => send('cave-carve')}>Carve a tunnel</button><button disabled={recording} onClick={() => send('cave-pillar')}>Restore the pillar</button><button disabled={recording} onClick={() => send('cave-chunks')}>Edit one region</button></>}
      {story === 'forest' && <><button className="primary" disabled={recording} onClick={() => send(playing ? 'pause' : 'forest-grow')}>{playing ? 'Pause growth' : 'Run growth experiment'}</button><button disabled={recording} onClick={() => send('forest-branch3')}>Inspect branches</button><button disabled={recording} onClick={() => send('forest-crown')}>Add leaf clusters</button><button disabled={recording} onClick={() => send('forest-reset')}>Return to forest</button></>}
      <button className="exhibition-reset" disabled={recording} onClick={() => send(INITIAL[story])}>↺ Reset experiment</button>
      <p role="status">{recording ? `Recording ${elapsed} / ${FILM_DURATION} seconds — keep this tab visible.` : notice}</p>
    </section>
    <details className="exhibition-producer"><summary>Film & exhibition tools</summary><p><a href="?atlasfilm=1">Open the full course film: experiments + rotating planet ↗</a></p><p>Capture a {FILM_DURATION}-second film from the actual 3D renderers, with camera orbits, matched before/after views, and captions driven by rendered state. Keep this tab visible. No camera or microphone is used. Hiding this tab stops capture.</p>
      {recording ? <button onClick={() => stopRecording.current()}>Stop recording</button> : <button onClick={recordFilm}>Record {FILM_DURATION}-second comparison film</button>}
      {download && <a className="film-download" href={download} download="fieldwork-exhibition-v2-raw.webm">Download captioned film ↓</a>}
      {captions && <a className="film-download" href={captions} download="fieldwork-exhibition-v2.en.srt">Download synchronized captions ↓</a>}
      <p>These are separate educational models, connected by a visual language. Tides are prescribed, caves use density fields, and forest growth is an accelerated rule-based model.</p>
    </details>
  </div>
}
