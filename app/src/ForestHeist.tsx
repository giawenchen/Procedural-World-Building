import { useEffect, useMemo, useRef, useState } from 'react'
import { ForestHeistScene } from './ForestHeistScene'
import type { HeistView } from './ForestHeistScene'
import { cloneHeist, collectTree, createHeistTimeline, HEIST_LIMIT, heistMetrics, makeHeistWorld, RECOVERY_SECONDS, returnSiteReason } from './forestHeistModel'
import type { HeistChapter, ReturnSite } from './forestHeistModel'
import './ForestHeist.css'

const CHAPTERS: { id: HeistChapter; name: string }[] = [
  { id: 'invitation', name: 'A terrible plan' }, { id: 'collect', name: 'The collection' },
  { id: 'scan', name: 'Inside a tree' }, { id: 'clearing', name: 'What remains' }, { id: 'recovery', name: 'Another future' },
]

function captionFor(chapter: HeistChapter, elapsed: number, cargo: number, births: number, rooted: number, returned: boolean, angle: number, iterations: number) {
  switch (chapter) {
    case 'invitation': return { who: 'FIELD NOTE 07', line: 'A small forest. An enormous misunderstanding.' }
    case 'arrival': return elapsed < 3 ? { who: 'THE COLLECTOR', line: 'Headquarters requested a forest. How difficult could that be?' } : { who: 'ONBOARD COMPUTER', line: 'Large green objects detected. Probably broccoli.' }
    case 'collect': return cargo === 0 ? { who: 'THE COLLECTOR', line: 'Hold still, enormous vegetable. This is for science.' } : cargo < 3 ? { who: 'ONBOARD COMPUTER', line: `${cargo} tree${cargo === 1 ? '' : 's'} collected. Some small golden things fell out. Probably unimportant.` } : { who: 'THE COLLECTOR', line: 'Three trees. A complete forest! My promotion is practically guaranteed.' }
    case 'scan': return { who: 'ONBOARD COMPUTER', line: `${5 ** iterations} branch segments. ${angle}° turns. A tree built by repeating a rule. Definitely not broccoli.` }
    case 'clearing': return { who: 'FIELD NOTE', line: 'The parents left. Their seeds stayed. A collection of trees is only part of a forest.' }
    case 'recovery': return elapsed < 2.5 ? { who: returned ? 'THE COLLECTOR' : 'FIELD NOTE', line: returned ? 'One mother tree returned. Same beginning. One different decision.' : 'The seeds have landed. They still need suitable ground, space and time.' } : births ? { who: 'FIELD NOTE', line: `${births} new plant${births === 1 ? '' : 's'}. ${rooted} from the fallen seeds. The rest come from surviving parents. Watch who finds room.` } : { who: 'FIELD NOTE', line: 'No new plants yet. Seeds arriving does not guarantee that they can establish.' }
    case 'ending': return { who: 'ONBOARD COMPUTER', line: 'Mission report corrected: we collected trees. The forest kept making connections.' }
  }
}

export default function ForestHeist() {
  const [chapter, setChapter] = useState<HeistChapter>('invitation')
  const [checkpoint, setCheckpoint] = useState(makeHeistWorld)
  const [returned, setReturned] = useState<ReturnSite | null>(null)
  const [seconds, setSeconds] = useState(0), [phaseTime, setPhaseTime] = useState(0)
  const [playing, setPlaying] = useState(false), [paused, setPaused] = useState(false)
  const [angle, setAngle] = useState(28), [iterations, setIterations] = useState(2), [skeleton, setSkeleton] = useState(true)
  const [lineage, setLineage] = useState(true), [rules, setRules] = useState(false), [view, setView] = useState<HeistView>('director')
  const [placing, setPlacing] = useState(false), [hovered, setHovered] = useState<number | null>(null)
  const [notice, setNotice] = useState(''), [error, setError] = useState('')
  const [liftEnd, setLiftEnd] = useState(0)
  const collecting = chapter === 'collect' && phaseTime < liftEnd
  const host = useRef<HTMLDivElement>(null), renderer = useRef<ForestHeistScene | null>(null)
  const actions = useRef({ select: (_id: number) => {}, place: (_x: number, _z: number) => {} })
  const recovery = ['recovery', 'ending'].includes(chapter)
  const timeline = useMemo(() => createHeistTimeline(checkpoint, returned), [checkpoint, returned])
  const referenceTimeline = useMemo(() => createHeistTimeline(checkpoint), [checkpoint])
  const displayWorld = useMemo(() => recovery ? timeline(seconds) : checkpoint, [checkpoint, recovery, seconds, timeline])
  const metrics = heistMetrics(displayWorld)
  const caption = captionFor(chapter, chapter === 'recovery' ? seconds : phaseTime, checkpoint.cargo.length, metrics.births, metrics.rooted, !!returned, angle, iterations)
  const chapterIndex = chapter === 'arrival' ? 0 : chapter === 'ending' ? 4 : CHAPTERS.findIndex(c => c.id === chapter)
  const mature = checkpoint.ecology.plants.filter(p => p.size > .7).sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z))
  const target = mature.find(p => p.id === hovered) ?? mature[0]
  const mother = checkpoint.cargo[0]

  function go(next: HeistChapter) { setChapter(next); setPhaseTime(0); setView('director'); setNotice(''); setPlacing(false); setPaused(false) }
  function take(id: number) {
    if (chapter !== 'collect' || paused || collecting) return
    const next = cloneHeist(checkpoint)
    if (!collectTree(next, id)) { setNotice('Only mature trees fit the collection brief. The little ones stay.'); return }
    setCheckpoint(next); setLiftEnd(phaseTime + 2.8); setNotice('Seeds fell onto the ground. They belong to this tree.'); setHovered(null)
  }
  function place(x: number, z: number) {
    if (!mother || returned || !recovery || !placing) return
    const reason = returnSiteReason(checkpoint, x, z)
    if (reason) { setNotice(reason); return }
    setReturned({ id: mother.id, x, z }); setSeconds(0); setPlaying(true); setPlacing(false)
    setNotice('Rewound to the same starting time. One mother tree is now back on the island.')
  }
  function restart() { const fresh = makeHeistWorld(); setCheckpoint(fresh); setReturned(null); setSeconds(0); setPlaying(false); setPaused(false); setAngle(28); setIterations(2); setSkeleton(true); setLineage(true); setLiftEnd(0); go('invitation') }

  useEffect(() => { actions.current = { select: take, place } })
  useEffect(() => {
    if (!host.current) return
    try { renderer.current = new ForestHeistScene(host.current, { select: id => actions.current.select(id), hover: setHovered, place: (x, z) => actions.current.place(x, z), error: setError }) }
    catch { requestAnimationFrame(() => setError('This story needs WebGL. Try a desktop browser with hardware acceleration enabled. Your research studio is still available.')) }
    return () => { renderer.current?.dispose(); renderer.current = null }
  }, [])
  useEffect(() => { renderer.current?.setFrame({ chapter, world: displayWorld, chapterTime: phaseTime, time: seconds, angle, iterations, skeleton, lineage, view, placing, returned, paused }) }, [chapter, displayWorld, phaseTime, seconds, angle, iterations, skeleton, lineage, view, placing, returned, paused])
  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => {
      if (document.hidden) return
      setPhaseTime(v => v + .1)
      if (playing && recovery && !placing) setSeconds(v => Math.min(RECOVERY_SECONDS, Math.round((v + .2) * 10) / 10))
    }, 100)
    return () => clearInterval(timer)
  }, [paused, playing, recovery, placing])
  useEffect(() => { if (chapter === 'arrival' && phaseTime >= 7) { const frame = requestAnimationFrame(() => go('collect')); return () => cancelAnimationFrame(frame) } }, [chapter, phaseTime])
  useEffect(() => { const old = document.title; document.title = 'How to steal a forest · Fieldwork'; return () => { document.title = old } }, [])
  useEffect(() => {
    const keys = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches('input,button,select,a,textarea')) return
      if (e.code === 'Space') { e.preventDefault(); setPaused(v => !v) }
      if (e.key === 'Escape') { setPlacing(false); setRules(false) }
    }
    window.addEventListener('keydown', keys); return () => window.removeEventListener('keydown', keys)
  }, [])

  const reference = useMemo(() => returned && recovery ? heistMetrics(referenceTimeline(seconds)) : null, [returned, recovery, referenceTimeline, seconds])
  return <main className={`forest-heist chapter-${chapter}`}>
    <header className="heist-header"><a href="?workspace=living&spin=0" className="heist-brand">Fieldwork <span>/ curious encounters</span></a><div><span className="heist-session">SESSION 07</span><button onClick={() => setRules(v => !v)} aria-expanded={rules}>{rules ? 'Close field notes' : 'Field notes'}</button><a href="?experiments=1">Studies ↗</a></div></header>
    <section className="heist-stage" aria-label="How to steal a forest interactive story">
      <div ref={host} className={`heist-canvas ${placing ? 'is-placing' : ''}`} />
      <div className="heist-grain" aria-hidden="true" />
      <div key={chapter} className="heist-transition" aria-hidden="true" />
      {error && <div className="heist-error" role="alert"><p>{error}</p><a href="?workspace=living&spin=0">Return to the studio</a></div>}
      {chapter === 'invitation' ? <div className="heist-title"><span className="heist-eyebrow">AN INTERACTIVE FIELD TALE · 3–5 MINUTES</span><h1>How to steal<br/>a <em>forest.</em></h1><p>A visitor from very far away.<br/>A rather questionable collection strategy.</p><button className="heist-primary" onClick={() => go('arrival')} disabled={!!error}>Accept the extremely bad plan <span>↗</span></button><small>You control the collection. The forest follows its rules.</small></div> : <div className="heist-chapter-title"><span className="heist-eyebrow">{chapter === 'arrival' ? '00 / THE ARRIVAL' : `${String(chapterIndex + 1).padStart(2, '0')} / ${CHAPTERS[chapterIndex]?.name.toUpperCase()}`}</span><h1>{chapter === 'arrival' ? 'A visitor. With a list.' : chapter === 'collect' ? '“One forest, to go.”' : chapter === 'scan' ? 'Very large broccoli?' : chapter === 'clearing' ? 'Some things stayed.' : chapter === 'recovery' ? 'The forest has other plans.' : 'You can take a tree.'}</h1></div>}
      {chapter !== 'invitation' && <div className="heist-camera" aria-label="Camera perspective"><button aria-pressed={view === 'director'} onClick={() => setView('director')}>Director</button><button aria-pressed={view === 'ground'} onClick={() => setView('ground')}>Tree level</button><button aria-pressed={view === 'above'} onClick={() => setView('above')}>From above</button></div>}
      {['arrival', 'collect'].includes(chapter) && <aside className="heist-receipt"><span>INTERGALACTIC CARGO RECEIPT</span><strong>{String(checkpoint.cargo.length).padStart(2, '0')} <small>/ 03</small></strong><p>TREES COLLECTED</p><i>Forest sold separately.</i></aside>}
      {chapter === 'scan' && <aside className="heist-scanner"><span className="heist-eyebrow">SPECIMEN 01 / REVISED CLASSIFICATION</span><h2>A branching rule.</h2><code>F → F[+F]F[−F][&amp;F]</code><label>Branch angle <output>{angle}°</output><input aria-label="Branch angle" type="range" min="16" max="48" value={angle} onChange={e => setAngle(+e.target.value)} /></label><label>Rule repetitions <output>{iterations} → {5 ** iterations} segments</output><input aria-label="Rule repetitions" type="range" min="1" max="3" value={iterations} onChange={e => setIterations(+e.target.value)} /></label><button aria-pressed={skeleton} onClick={() => setSkeleton(v => !v)}>{skeleton ? 'Put the leaves back' : 'See the branch skeleton'}</button><small>Shape changes here. Ecological time is paused.</small></aside>}
      {recovery && <aside className="heist-counter"><span>BACK ON THE GROUND</span><div><strong>{metrics.living}</strong><small>living trees</small></div><div><strong>+{metrics.births}</strong><small>new plants</small></div><div><strong>{metrics.mature}</strong><small>mature seed sources</small></div>{reference && <p>Without the returned mother: <b>{reference.living}</b> trees / <b>{reference.births}</b> births at the same time.<br/>A parent is also a neighbor. More seed sources can mean more competition.</p>}</aside>}
      {chapter === 'ending' && <div className="heist-ending"><h2>A forest is<br/><em>what happens next.</em></h2><p>{metrics.living} trees. {metrics.births} new lives. A web of remembered parents.</p></div>}
      {chapter !== 'invitation' && <div className="heist-subtitle" aria-live={chapter === 'scan' || recovery ? 'off' : 'polite'}><span>{caption.who}</span><p>{caption.line}</p></div>}
      {chapter === 'invitation' && <div className="heist-intro-stamp">NO FORESTS WERE<br/><em>UNDERSTOOD</em><br/>IN THE MAKING OF THIS PLAN.</div>}
    </section>
    <section className="heist-console" aria-label="Story controls">
      <div className="heist-command">
        {chapter === 'invitation' && <p><span className="heist-spark">✳</span> Branching. Growth. Distribution. One very confused visitor.</p>}
        {chapter === 'arrival' && <><p>Look up. Something has mistaken your field study for a grocery store.</p><button onClick={() => go('collect')}>Skip arrival →</button></>}
        {chapter === 'collect' && <><div><b>{checkpoint.cargo.length >= HEIST_LIMIT ? 'Cargo hold full. Curiosity still empty.' : 'Point at a mature tree. Click to collect.'}</b><small>{checkpoint.cargo.length >= HEIST_LIMIT ? 'The little golden dots on the ground are seeds.' : 'Or use the collect button below. Young trees stay on the ground.'}</small></div><button disabled={!target || checkpoint.cargo.length >= HEIST_LIMIT || paused || collecting} onClick={() => target && take(target.id)}>{collecting ? 'Collecting…' : 'Collect marked tree ↑'}</button><button className="heist-primary" disabled={checkpoint.cargo.length === 0 || paused || collecting} onClick={() => go('scan')}>Scan the specimen →</button></>}
        {chapter === 'scan' && <><p>Change one rule. Watch the silhouette answer.</p><button className="heist-primary" onClick={() => go('clearing')}>What did we leave behind? ↓</button></>}
        {chapter === 'clearing' && <><div><b>{checkpoint.seeds.length} seeds fell before the trees left.</b><small>The soil and the surviving plants are still here. Recovery is not guaranteed.</small></div><button className="heist-primary" onClick={() => { setSeconds(0); setPlaying(true); go('recovery') }}>Let time answer →</button></>}
        {recovery && <><button className="heist-primary" onClick={() => { if (seconds >= RECOVERY_SECONDS) { setSeconds(0); setPlaying(true) } else setPlaying(v => !v); setPaused(false) }}>{playing && seconds < RECOVERY_SECONDS ? 'Pause growth' : seconds >= RECOVERY_SECONDS ? 'Replay growth' : 'Watch it grow'}</button><label className="heist-time">Ecological time <output>{seconds.toFixed(1)} s</output><input aria-label="Ecological time" type="range" min="0" max={RECOVERY_SECONDS} step=".1" value={seconds} onChange={e => { setPlaying(false); setSeconds(+e.target.value) }} /></label><button aria-pressed={lineage} onClick={() => setLineage(v => !v)}>{lineage ? 'Hide family connections' : 'Show family connections'}</button>{!returned && mother && <button onClick={() => { setPlacing(v => !v); setPlaying(false); setNotice('Click an open patch of land to return one mother tree, or choose its original clearing below.') }}>{placing ? 'Cancel placement' : 'Return a mother tree ↓'}</button>}{returned && <button onClick={() => { setReturned(null); setSeconds(0); setPlaying(false); setNotice('Rewound to the original clearing, without the returned tree.') }}>Compare without her</button>}{chapter === 'recovery' && <button onClick={() => { setPlaying(false); setLineage(true); go('ending') }}>Pull back ↗</button>}{chapter === 'ending' && <button onClick={restart}>Tell it differently ↺</button>}</>}
      </div>
      {placing && mother && <div className="heist-placement"><span>Place her on open, suitable land. This rewinds the experiment to its shared start.</span><button onClick={() => place(mother.x, mother.z)}>Use her original clearing</button></div>}
      {notice && <p className="heist-notice" role="status">{notice}</p>}
      <div className="heist-bottom"><ol aria-label="Story chapters">{CHAPTERS.map((c, i) => <li key={c.id} aria-current={chapterIndex === i ? 'step' : undefined} className={i < chapterIndex ? 'visited' : ''}><span>{String(i + 1).padStart(2, '0')}</span>{c.name}</li>)}</ol><div><button aria-pressed={paused} onClick={() => setPaused(v => !v)}>{paused ? 'Resume' : 'Pause motion'}</button><button onClick={restart}>Restart ↺</button></div></div>
    </section>
    {rules && <aside className="heist-notes" role="dialog" aria-label="Forest story field notes"><button className="heist-close" onClick={() => setRules(false)} aria-label="Close field notes">×</button><span className="heist-eyebrow">SESSION 07 / WHAT IS ACTUALLY HAPPENING</span><h2>Fiction overhead.<br/>Rules underfoot.</h2><dl><dt>Form</dt><dd>The bracketed L-system rewrites F in parallel. Angle and repetition change the scanner specimen. They do not age the forest.</dd><dt>Disturbance</dt><dd>The beam relocates up to three mature trees. Each releases seven modeled seeds. Collected trees are not counted as deaths.</dd><dt>Establishment</dt><dd>Fallen seeds need ground above 1.3 u, slope ≤ 0.85, moisture ≥ 0.24 and 2.5 u of spacing. They can establish after 2.5 model seconds; unestablished seeds expire after 14.</dd><dt>Growth & distribution</dt><dd>Plants retain age, size, health and parent identity. Healthy mature plants reproduce; nearby neighbors reduce health recovery and growth. The clock uses the existing educational ecology model.</dd><dt>A fair replay</dt><dd>The time slider replays the same checkpoint with fixed 0.1-second steps. Returning a mother rewinds time. The comparison keeps the same starting forest and seed cohort.</dd></dl><p>Fictional abduction, simplified seed release and accelerated model time. No real years, light-budget solver, branch regrowth or guaranteed recovery. Scanner geometry is not inherited by offspring. This story has its own state; the desktop studio and mobile island are unchanged.</p></aside>}
    <footer className="heist-footer"><span>AN ORIGINAL FIELDWORK ENCOUNTER</span><span>L-SYSTEMS → INDIVIDUALS → POPULATIONS</span><span>JIAWEN CHEN · 2026</span></footer>
  </main>
}
