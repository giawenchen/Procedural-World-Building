import { useEffect, useRef, useState } from 'react'
import LivingWorld from './LivingWorld'
import VoxelLab from './VoxelLab'
import { makeLayer } from './noiseEngine'
import { cueAt, FILM_DURATION, STORIES, type ExhibitCommand, type ExhibitStory } from './exhibitionScript'
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
  const [notice, setNotice] = useState('Drag to orbit. Scroll to look closer. Reset to repeat the experiment.')
  const stage = useRef<HTMLDivElement>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const recordingFrame = useRef(0)
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
    cancelAnimationFrame(recordingFrame.current)
    if (recorder.current?.state === 'recording') recorder.current.stop()
    if (urlRef.current) URL.revokeObjectURL(urlRef.current)
  }, [])

  function recordFilm() {
    if (recording || !stage.current?.querySelector('canvas')) return
    if (typeof MediaRecorder === 'undefined') { setNotice('This browser does not support canvas recording.'); return }
    const output = document.createElement('canvas'); output.width = 1440; output.height = 810
    const ctx = output.getContext('2d')!
    const stream = output.captureStream(30)
    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find(t => MediaRecorder.isTypeSupported(t))
    let media: MediaRecorder
    try { media = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 }) }
    catch { stream.getTracks().forEach(t => t.stop()); setNotice('Canvas recording is unavailable in this browser.'); return }
    recorder.current = media
    const parts: Blob[] = []
    let started = 0, previousCue = -1, previousSecond = -1
    setRules(false); setRecording(true); setElapsed(0); setDownload('')
    setNotice('Recording real rendered frames. Keep this tab visible until the film is ready.')
    const stop = () => {
      cancelAnimationFrame(recordingFrame.current)
      document.removeEventListener('visibilitychange', visibility)
      if (media.state === 'recording') media.stop()
      stream.getTracks().forEach(t => t.stop())
      setRecording(false); send('pause')
    }
    const visibility = () => { if (document.hidden) stop() }
    stopRecording.current = stop
    document.addEventListener('visibilitychange', visibility)
    media.ondataavailable = e => { if (e.data.size) parts.push(e.data) }
    media.onerror = () => { stop(); setNotice('Recording stopped because the encoder reported an error.') }
    media.onstop = () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
      urlRef.current = URL.createObjectURL(new Blob(parts, { type: media.mimeType }))
      setDownload(urlRef.current)
      setNotice('Your captioned recording is ready. The finished MP4 adds the ambient soundtrack.')
    }
    function draw(now: number) {
      if (!started) { started = now; media.start(1000) }
      const seconds = (now - started) / 1000, cue = cueAt(seconds)
      if (previousCue !== cue.at) {
        previousCue = cue.at; setStory(cue.story)
        if (cue.command !== 'continue') send(cue.command)
      }
      if (Math.floor(seconds) !== previousSecond) { previousSecond = Math.floor(seconds); setElapsed(previousSecond) }
      ctx.fillStyle = '#f6f3e9'; ctx.fillRect(0, 0, 1440, 810)
      const source = stage.current?.querySelector<HTMLCanvasElement>('.field-canvas canvas')
      if (source?.width && source.height) {
        const scale = Math.min(1360 / source.width, 550 / source.height)
        const w = source.width * scale, h = source.height * scale
        ctx.drawImage(source, (1440 - w) / 2, 128 + (550 - h) / 2, w, h)
      }
      ctx.fillStyle = '#68755b'; ctx.font = '13px Arial'; ctx.fillText('FIELDWORK / NATURE STUDIO', 44, 34)
      ctx.fillStyle = '#293b2f'; ctx.font = '36px Georgia'; ctx.fillText(cue.title, 44, 82)
      ctx.fillStyle = '#66705f'; ctx.font = '14px Arial'; ctx.fillText(cue.detail, 44, 110)
      ctx.fillStyle = '#293b2f'; ctx.font = '27px Arial'
      const words = cue.caption.split(' '); let line = '', y = 716
      for (const word of words) {
        const next = line ? `${line} ${word}` : word
        if (ctx.measureText(next).width > 1330) { ctx.fillText(line, 44, y); y += 32; line = word } else line = next
      }
      ctx.fillText(line, 44, y)
      const stats = Array.from(stage.current?.querySelectorAll<HTMLElement>('.field-stats > span') ?? []).map(e => e.innerText.replace(/\s+/g, ' ')).join('  ·  ')
      ctx.fillStyle = '#707467'; ctx.font = '12px Arial'; ctx.fillText(stats, 44, 782, 1352)
      ctx.fillStyle = '#80906a'; ctx.fillRect(44, 797, 1352 * Math.min(1, seconds / FILM_DURATION), 2)
      if (seconds >= FILM_DURATION) stop()
      else recordingFrame.current = requestAnimationFrame(draw)
    }
    recordingFrame.current = requestAnimationFrame(draw)
  }

  return <div className={`exhibition ${rules ? 'show-rules' : ''} ${recording ? 'is-recording' : ''}`}>
    <header className="exhibition-masthead">
      <a className="exhibition-brand" href="?workspace=living&spin=0">Fieldwork <small>Nature Studio</small></a>
      <span className="exhibition-edition">A WORLD SHAPED BY RULES<small>JIAWEN CHEN / MIDTERM 2026</small></span>
      <div><button disabled={recording} aria-expanded={rules} onClick={() => setRules(v => !v)}>{rules ? 'Hide rules' : 'Show rules'}</button><a href="?workspace=living&spin=0">Research studio ↗</a></div>
    </header>
    <nav className="exhibition-stories" aria-label="Exhibition studies">{(Object.keys(STORIES) as ExhibitStory[]).map(key => <button key={key} disabled={recording} aria-pressed={story === key} onClick={() => choose(key)}><small>{STORIES[key].number}</small>{STORIES[key].title}<span>↗</span></button>)}</nav>
    <section className="exhibition-intro"><div><span>THREE EXPERIMENTS / ONE PROCEDURAL ATLAS</span><h1>{info.question}</h1></div><p>{info.note}</p></section>
    <div ref={stage} className="exhibition-stage" aria-label={info.title}>
      {story === 'cave' ? <VoxelLab key="cave" active exhibit command={command} /> : <LivingWorld key={story} active layers={LAYERS} solo={null} exhibit={story} command={command} />}
    </div>
    <section className="exhibition-actions" aria-label="Demonstration controls">
      {story === 'tide' && <><button className="primary" disabled={recording} onClick={() => send(playing ? 'pause' : 'tide-play')}>{playing ? 'Pause tide' : 'Play tide cycle'}</button><button disabled={recording} onClick={() => send('tide-high')}>High tide</button><button disabled={recording} onClick={() => send('tide-low')}>Low tide</button></>}
      {story === 'cave' && <><button className="primary" disabled={recording} onClick={() => send('cave-carve')}>Carve a tunnel</button><button disabled={recording} onClick={() => send('cave-pillar')}>Restore the pillar</button><button disabled={recording} onClick={() => send('cave-chunks')}>Edit one region</button></>}
      {story === 'forest' && <><button className="primary" disabled={recording} onClick={() => send(playing ? 'pause' : 'forest-grow')}>{playing ? 'Pause growth' : 'Run growth experiment'}</button><button disabled={recording} onClick={() => send('forest-branch3')}>Inspect branches</button><button disabled={recording} onClick={() => send('forest-crown')}>Add leaf clusters</button><button disabled={recording} onClick={() => send('forest-reset')}>Return to forest</button></>}
      <button className="exhibition-reset" disabled={recording} onClick={() => send(INITIAL[story])}>↺ Reset experiment</button>
      <p role="status">{recording ? `Recording ${elapsed} / ${FILM_DURATION} seconds — keep this tab visible.` : notice}</p>
    </section>
    <details className="exhibition-producer"><summary>Film & exhibition tools</summary><p>Capture a {FILM_DURATION}-second film from the actual 3D renderers, with English captions and live measurements. Keep this tab visible. No camera or microphone is used. Hiding this tab stops capture.</p>
      {recording ? <button onClick={() => stopRecording.current()}>Stop recording</button> : <button onClick={recordFilm}>Record 78-second film</button>}
      {download && <a className="film-download" href={download} download="fieldwork-exhibition-raw.webm">Download captioned film ↓</a>}
      <p>These are separate educational models, connected by a visual language. Tides are prescribed, caves use density fields, and forest growth is an accelerated rule-based model.</p>
    </details>
  </div>
}
