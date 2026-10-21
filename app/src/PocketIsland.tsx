import { useEffect, useRef, useState } from 'react'
import { PocketScene } from './PocketScene'
import { createPocket, stepPocket, blow, shower, plantAt, tiltVector, seedStory, GRID } from './pocketModel'
import type { Wind } from './pocketModel'
import PocketPortal from './PocketPortal'
import './PocketIsland.css'

type MotionPermission = { requestPermission?: () => Promise<string> }
type SensorState = 'off' | 'requesting' | 'waiting' | 'on' | 'unavailable'
function Icon({ name }: { name: 'wind' | 'rain' | 'seed' | 'reset' | 'pause' | 'play' }) {
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{name === 'wind' ? <><path d="M3 8h12c4 0 4-5 1-5-2 0-2 1-2 2M3 12h16c4 0 4 5 1 5M3 16h8c4 0 4 5 1 5"/></> : name === 'rain' ? <><path d="M6 14a4 4 0 0 1-1-8 6 6 0 0 1 11-1 4.5 4.5 0 1 1 1 9H6M8 17l-1 3m6-3-1 3m6-3-1 3"/></> : name === 'seed' ? <><path d="M12 21V11M12 15C4 16 3 11 3 7c6 0 10 1 9 8Zm0-4c0-7 5-9 9-9 0 6-3 10-9 9Z"/></> : name === 'reset' ? <><path d="M4 8a8 8 0 1 1 0 8M4 3v5h5"/></> : name === 'pause' ? <><path d="M8 5v14M16 5v14"/></> : <path d="m8 4 12 8-12 8Z"/>}</svg>
}
export default function PocketIsland() {
  const mount = useRef<HTMLDivElement>(null), renderer = useRef<PocketScene | null>(null), model = useRef(createPocket()), target = useRef<Wind>({ x: 0, z: 0 })
  const marker = useRef<HTMLSpanElement>(null)
  const [started, setStarted] = useState(false), [paused, setPaused] = useState(false), [planting, setPlanting] = useState(false), [help, setHelp] = useState(false)
  const [overview, setOverview] = useState(false), [speed, setSpeed] = useState(1)
  const [sensor, setSensor] = useState<SensorState>('off'), [sensorNote, setSensorNote] = useState(''), [error, setError] = useState('')
  const [hud, setHud] = useState({ wind: 0, moisture: 0, births: 0, trees: 0, rain: 0, time: 0, message: '', story: seedStory(model.current) })
  const live = useRef({ started, paused, planting, speed }); useEffect(() => { live.current = { started, paused, planting, speed } }, [started, paused, planting, speed])
  const sensorClean = useRef<() => void>(() => {}), helpDialog = useRef<HTMLDialogElement>(null), sensorTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestGeneration = useRef(0), neutral = useRef<{beta:number;gamma:number;angle:number}|null>(null)
  const drag = useRef<{x:number;y:number;id:number}|null>(null)
  useEffect(() => {
    const el = mount.current; if (!el) return
    let scene: PocketScene
    try { scene = new PocketScene(el, model.current); renderer.current = scene } catch { /* Renderer capability failures are reported once at mount. */
      // oxlint-disable-next-line react/set-state-in-effect
      setError('This browser could not draw the island. Please try Safari or Chrome.'); return }
    let frame = 0, last = performance.now(), accumulator = 0, lastHud = -1
    function animate(now: number) {
      frame = requestAnimationFrame(animate)
      const dt = Math.min((now - last) / 1000, .08); last = now
      if (document.hidden) { accumulator = 0; return }
      const active = live.current.started && !live.current.paused
      if (active) { accumulator += dt * live.current.speed; while (accumulator >= .05) { stepPocket(model.current, .05, target.current); accumulator -= .05 } }
      scene.draw(model.current, active ? dt : 0)
      if (marker.current) {
        const position = scene.focusPosition(model.current), f = model.current.focus
        marker.current.hidden = !position?.visible
        if (position && f) { marker.current.style.left = `${position.x}px`; marker.current.style.top = `${position.y}px`; marker.current.textContent = f.stage === 'flight' ? '✧ Follow this seed' : f.stage === 'waiting' ? '◌ Waiting for rain' : f.stage === 'rooted' ? '✳ New life' : '× No roots here' }
      }
      if (now - lastHud > 250) {
        const s = model.current; let moisture = 0, count = 0
        for (let i = 0; i < GRID * GRID; i++) if (s.heights[i] > 1) { moisture += s.moisture[i]; count++ }
        setHud({ wind: Math.hypot(s.wind.x, s.wind.z), moisture: moisture / count, births: s.births, trees: s.plants.length, rain: s.rain, time: s.time, message: s.time < s.messageUntil ? s.message : '', story: seedStory(s) }); lastHud = now
      }
    }
    frame = requestAnimationFrame(animate)
    const hidden = () => { if (document.hidden) { target.current = { x: 0, z: 0 }; drag.current = null } }
    document.addEventListener('visibilitychange', hidden)
    return () => { cancelAnimationFrame(frame); scene.dispose(); renderer.current = null; document.removeEventListener('visibilitychange', hidden) }
  }, [])
  useEffect(() => { renderer.current?.setOverview(overview) }, [overview])
  useEffect(() => () => { requestGeneration.current++; sensorClean.current(); if (sensorTimeout.current) clearTimeout(sensorTimeout.current) }, [])
  useEffect(() => { if (help) helpDialog.current?.showModal(); else helpDialog.current?.close() }, [help])
  function stopSensors() { requestGeneration.current++; sensorClean.current(); if (sensorTimeout.current) clearTimeout(sensorTimeout.current); target.current = { x: 0, z: 0 }; neutral.current = null; setSensor('off'); setSensorNote('Drag the island to steer the breeze.') }
  async function enableMotion() {
    setStarted(true); setPaused(false)
    if (!window.isSecureContext || !('DeviceMotionEvent' in window || 'DeviceOrientationEvent' in window)) { setSensor('unavailable'); setSensorNote('Motion is unavailable here. Drag to make a breeze.'); return }
    sensorClean.current(); if (sensorTimeout.current) clearTimeout(sensorTimeout.current)
    const generation = ++requestGeneration.current; neutral.current = null; setSensor('requesting'); setSensorNote('')
    const m = window.DeviceMotionEvent as unknown as MotionPermission | undefined, o = window.DeviceOrientationEvent as unknown as MotionPermission | undefined
    // Both permission requests start inside the visitor's click activation.
    const requests = [m, o].map(api => { try { return api?.requestPermission ? api.requestPermission() : Promise.resolve(api ? 'granted' : 'denied') } catch { return Promise.resolve('denied') } })
    const result = await Promise.allSettled(requests)
    if (generation !== requestGeneration.current) return
    const allowed = result.map(r => r.status === 'fulfilled' && r.value === 'granted')
    if (!allowed.some(Boolean)) { setSensor('unavailable'); setSensorNote('No motion access. Touch works just as well.'); return }
    let received = false, lastShake = -Infinity, gravity: {x:number;y:number;z:number} | null = null
    const ready = () => { if (!received) { received = true; setSensor('on'); setSensorNote('Gently shake for a gust. Tilt to steer.'); if (sensorTimeout.current) clearTimeout(sensorTimeout.current) } }
    const orientation = (e: DeviceOrientationEvent) => {
      if (e.beta === null || e.gamma === null || !Number.isFinite(e.beta + e.gamma)) return
      ready(); if (document.hidden || live.current.paused) return
      const angle = screen.orientation?.angle ?? 0
      if (!neutral.current || neutral.current.angle !== angle) neutral.current = { beta: e.beta, gamma: e.gamma, angle }
      const v = tiltVector(e.beta, e.gamma, neutral.current.beta, neutral.current.gamma, angle)
      target.current = { x: (v.x + v.z) / Math.SQRT2, z: (v.z - v.x) / Math.SQRT2 }
    }
    const motion = (e: DeviceMotionEvent) => {
      const a = e.acceleration, g = e.accelerationIncludingGravity
      let magnitude = 0
      if (a?.x != null && a.y != null && a.z != null && Number.isFinite(a.x + a.y + a.z)) magnitude = Math.hypot(a.x, a.y, a.z)
      else if (g?.x != null && g.y != null && g.z != null && Number.isFinite(g.x + g.y + g.z)) {
        if (!gravity) gravity = { x: g.x, y: g.y, z: g.z }
        magnitude = Math.hypot(g.x - gravity.x, g.y - gravity.y, g.z - gravity.z)
        gravity.x += (g.x - gravity.x) * .12; gravity.y += (g.y - gravity.y) * .12; gravity.z += (g.z - gravity.z) * .12
      } else return
      ready(); const now = performance.now()
      if (!document.hidden && !live.current.paused && magnitude > 3 && now - lastShake > 1000) { blow(model.current, Math.min(1, magnitude / 9)); lastShake = now }
    }
    if (allowed[0]) window.addEventListener('devicemotion', motion)
    if (allowed[1]) window.addEventListener('deviceorientation', orientation)
    sensorClean.current = () => { window.removeEventListener('devicemotion', motion); window.removeEventListener('deviceorientation', orientation) }
    setSensor('waiting'); setSensorNote('Hold comfortably, then tilt a little.')
    sensorTimeout.current = setTimeout(() => { if (!received) { sensorClean.current(); setSensor('unavailable'); setSensorNote('No sensor signal. Drag to steer, or try motion again.') } }, 5500)
  }
  function reset() { model.current = createPocket(); target.current = { x: 0, z: 0 }; neutral.current = null; setPlanting(false); setPaused(false); setOverview(false); setSpeed(1) }
  return <main className="pocket-island">
    <header className="pocket-header"><a href="?mobile=1" className="pocket-brand">✳ <span>Fieldwork<small>POCKET ISLAND</small></span></a><div><button aria-label={paused ? 'Resume the island' : 'Pause the island'} onClick={() => setPaused(v => !v)} disabled={!started}><Icon name={paused ? 'play' : 'pause'}/></button><button aria-label="Reset the same island" onClick={reset} disabled={!started}><Icon name="reset"/></button><button aria-label="How this world works" onClick={() => setHelp(true)}>?</button><span className="pocket-desktop-share"><PocketPortal/></span></div></header>
    <section className={`pocket-stage ${planting ? 'is-planting' : ''}`} aria-label="Pocket island experiment">
      <div className="pocket-heading"><span>ONE SEED / MANY POSSIBLE FUTURES</span><h1>{started ? hud.story.title : 'A world in your hands.'}</h1>{started && <ol className="pocket-story" aria-label="A seed's journey">{['Wind', 'Habitat', 'Life'].map((name, index) => <li key={name} className={hud.story.step === index ? 'current' : hud.story.step > index ? 'complete' : ''} aria-current={hud.story.step === index ? 'step' : undefined}><span>{index + 1}</span>{name}</li>)}</ol>}</div>
      {started && <button className="pocket-view" aria-pressed={overview} onClick={() => setOverview(v => !v)}>{overview ? '↗ Look closer' : '↙ Whole island'}</button>}
      <div className="pocket-canvas" ref={mount} onPointerDown={e => {
        if (!started || paused) return
        e.currentTarget.setPointerCapture(e.pointerId); drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
      }} onPointerMove={e => {
        const d = drag.current; if (!d || d.id !== e.pointerId || planting || paused) return
        const x = Math.max(-1, Math.min(1, (e.clientX - d.x) / 70)), z = Math.max(-1, Math.min(1, (e.clientY - d.y) / 70))
        target.current = { x: (x + z) / Math.SQRT2, z: (z - x) / Math.SQRT2 }
      }} onPointerUp={e => {
        const d = drag.current
        if (d?.id === e.pointerId && planting && !paused && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 12) { const p = renderer.current?.groundPoint(e.clientX, e.clientY); if (p) plantAt(model.current, p.x, p.z); else { model.current.message = 'Choose a clearing on the island.'; model.current.messageUntil = model.current.time + 4 } }
        drag.current = null; target.current = { x: 0, z: 0 }
      }} onPointerCancel={() => { drag.current = null; target.current = { x: 0, z: 0 } }} ><span className="pocket-marker" ref={marker} hidden aria-hidden="true"/></div>
      {error && <p className="pocket-error" role="alert">{error}</p>}
      {!started && !error && <div className="pocket-welcome"><p>A breeze carries a seed.<br/>Will it find a place to grow?</p><button className="pocket-primary" onClick={enableMotion}>Enter with motion <span>↗</span></button><button className="pocket-touch" onClick={() => { setStarted(true); setSensorNote('Drag the island to steer the breeze.') }}>Explore with touch</button></div>}
      {started && <div className="pocket-observation"><p aria-live="polite">{planting ? 'Tap an open patch. Rain can wake a seed in dry soil.' : hud.story.caption}</p><div className="pocket-readings"><span><i className={hud.wind > .6 ? 'active' : ''}/>{paused ? 'Paused' : hud.wind > 2 ? 'Gust' : hud.wind > .6 ? 'Breeze' : 'Still'}</span><span>{hud.moisture > .55 ? 'Damp soil' : hud.moisture > .32 ? 'Living soil' : 'Dry soil'}</span><span>{hud.births} new {hud.births === 1 ? 'tree' : 'trees'}</span></div></div>}
    </section>
    {started && <footer className="pocket-controls"><div className="pocket-actions"><button disabled={paused} onClick={() => { setPlanting(false); blow(model.current) }}><Icon name="wind"/><span>Breeze</span></button><button disabled={paused} className={hud.rain > .1 ? 'selected' : ''} onClick={() => { setPlanting(false); shower(model.current) }}><Icon name="rain"/><span>Rain</span></button><button disabled={paused} aria-pressed={planting} className={planting ? 'selected' : ''} onClick={() => setPlanting(v => !v)}><Icon name="seed"/><span>Plant</span></button></div><div className="pocket-sensor"><span role="status">{sensorNote || 'Drag to make a breeze.'}</span><button aria-label={speed === 1 ? 'Speed up time to four times' : 'Return time to normal speed'} onClick={() => setSpeed(v => v === 1 ? 4 : 1)}>Time {speed}×</button>{sensor === 'on' ? <><button onClick={() => { neutral.current = null; target.current = { x: 0, z: 0 }; setSensorNote('Hold comfortably. This is your new neutral position.') }}>Recenter</button><button onClick={stopSensors}>Touch only</button></> : <button disabled={sensor === 'requesting' || sensor === 'waiting'} onClick={enableMotion}>{sensor === 'waiting' || sensor === 'requesting' ? 'Connecting…' : 'Use motion'}</button>}</div></footer>}
    <dialog className="pocket-about" ref={helpDialog} onCancel={() => setHelp(false)} onClick={e => { if (e.target === helpDialog.current) setHelp(false) }}><button className="pocket-share-close" aria-label="Close explanation" onClick={() => setHelp(false)}>×</button><small>SMALL GESTURES / REAL CONNECTIONS</small><h2>Nothing grows<br/>on its own.</h2><ol><li><strong>Wind carries.</strong> Tilt sets a vector. A gentle shake adds a gust. Follow the golden seed and its trail; the ring marks its landing. Surface currents respond more slowly than wind.</li><li><strong>Water makes habitat.</strong> Rain raises soil moisture; extra moisture moves downhill. Seeds on suitable but dry ground wait up to 60 simulated seconds for rain.</li><li><strong>Life needs room.</strong> Seeds become trees only on suitable land. Nearby roots compete. The story follows the actual outcome, including failed landings.</li></ol><p>Look closer or pull back to the whole island. Time 4× advances the entire simulation, including rain, flight and growth.</p><p>A simplified, accelerated teaching model. Wind-driven surface flow is separate from tides. This island does not simulate full fluid physics. Seed markers are enlarged for readability.</p><p>Motion stays on your device. Use touch at any time.</p><small>SESSIONS 3–4 · TERRAIN & HABITAT<br/>SESSION 6 · VECTOR FIELDS<br/>SESSION 7 · GROWTH & DISTRIBUTION</small></dialog>
  </main>
}
