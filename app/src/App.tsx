import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import './App.css'
import StudyMark from './StudyMark'
import NoiseLab from './NoiseLab'
import SimulationMap from './SimulationMap'
import { makeLayer } from './noiseEngine'
import type { Layer } from './noiseEngine'
import { createAtlasMaterial, applyAppearance, PAPER } from './worldStyle'
import type { Appearance, Palette, Surface } from './worldStyle'

const LivingWorld = lazy(() => import('./LivingWorld'))
const VoxelLab = lazy(() => import('./VoxelLab'))
const FieldLab = lazy(() => import('./FieldLab'))

type Topology = 'uv' | 'ico'
type Shading = 'standard' | 'lowpoly-hard' | 'lowpoly-soft'

type PlanetSettings = {
  radius: number
  resolution: number
  elevation: number
  frequency: number
  spin: boolean
  topology: Topology
  wireframe: boolean
  shading: Shading
}

const initialSettings: PlanetSettings = {
  radius: 2,
  resolution: 80,
  elevation: 0.35,
  frequency: 2.8,
  spin: true,
  topology: 'uv',
  wireframe: false,
  shading: 'lowpoly-soft',
}

function terrainNoise(direction: THREE.Vector3, frequency: number) {
  const x = direction.x * frequency
  const y = direction.y * frequency
  const z = direction.z * frequency

  return (
    Math.sin(x * 2.1 + y * 1.3) * 0.45 +
    Math.sin(y * 3.7 + z * 2.4) * 0.3 +
    Math.sin(z * 4.2 + x * 1.7) * 0.25
  )
}

function buildPlanetGeometry(settings: PlanetSettings) {
  // Icosphere "detail" grows triangle count 4x per step, so map the
  // 16-128 resolution slider down to a 1-6 subdivision level.
  const geometry =
    settings.topology === 'ico'
      ? new THREE.IcosahedronGeometry(
          settings.radius,
          Math.max(1, Math.min(6, Math.round(settings.resolution / 20))),
        )
      : new THREE.SphereGeometry(
          settings.radius,
          settings.resolution,
          settings.resolution / 2,
        )
  const position = geometry.attributes.position
  const normal = new THREE.Vector3()

  for (let i = 0; i < position.count; i += 1) {
    normal.fromBufferAttribute(position, i).normalize()
    const height = terrainNoise(normal, settings.frequency) * settings.elevation
    position.setXYZ(
      i,
      normal.x * (settings.radius + height),
      normal.y * (settings.radius + height),
      normal.z * (settings.radius + height),
    )
  }

  geometry.computeVertexNormals()
  return geometry
}

function PlanetCanvas({ settings, appearance }: { settings: PlanetSettings; appearance: Appearance }) {
  const mountRef = useRef<HTMLDivElement>(null)
  const runtime = useRef<{ planet: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>; ocean: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial> } | null>(null)
  const spin = useRef(settings.spin)
  useEffect(() => { spin.current = settings.spin }, [settings.spin])
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(PAPER)
    const camera = new THREE.PerspectiveCamera(45, 1, .1, 100)
    camera.position.set(0, 1.2, 7.2)
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    mount.appendChild(renderer.domElement)
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    const planet = new THREE.Mesh(buildPlanetGeometry(initialSettings), createAtlasMaterial(false))
    const ocean = new THREE.Mesh(new THREE.SphereGeometry(1, 96, 48), createAtlasMaterial(false))
    ocean.material.uniforms.ocean.value = true
    scene.add(planet, ocean)
    runtime.current = { planet, ocean }
    const observer = new ResizeObserver(() => {
      const width = mount.clientWidth, height = mount.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    })
    observer.observe(mount)
    let frame = 0
    const animate = () => {
      if (mount.clientWidth && !document.hidden) {
        if (spin.current) { planet.rotation.y += .0025; ocean.rotation.y += .0015 }
        controls.update(); renderer.render(scene, camera)
      }
      frame = requestAnimationFrame(animate)
    }
    animate()
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); controls.dispose()
      planet.geometry.dispose(); ocean.geometry.dispose()
      planet.material.dispose(); ocean.material.dispose(); renderer.dispose()
      mount.removeChild(renderer.domElement); runtime.current = null
    }
  }, [])
  const { radius, resolution, elevation, frequency, topology, wireframe, shading } = settings
  useEffect(() => {
    const rt = runtime.current
    if (!rt) return
    rt.planet.geometry.dispose()
    rt.planet.geometry = buildPlanetGeometry({ ...initialSettings, radius, resolution, elevation, frequency, topology })
    rt.ocean.scale.setScalar(radius * 1.01)
  }, [radius, resolution, elevation, frequency, topology])
  useEffect(() => {
    const rt = runtime.current
    if (!rt) return
    for (const mesh of [rt.planet, rt.ocean]) {
      applyAppearance(mesh.material, appearance)
      mesh.material.uniforms.radius.value = radius
      mesh.material.uniforms.amplitude.value = elevation
      mesh.material.uniforms.interval.value = .05
      mesh.material.uniforms.markScale.value = 5
      mesh.material.uniforms.flatShading.value = shading !== 'standard'
      mesh.material.uniforms.hard.value = shading === 'lowpoly-hard'
    }
    rt.planet.material.wireframe = wireframe
    rt.ocean.visible = !wireframe
  }, [appearance, radius, elevation, wireframe, shading])
  return <div ref={mountRef} className="planet-canvas" aria-label="Procedural planet preview" />
}

// URL presets (e.g. ?shading=lowpoly-hard&spin=0) make screenshots reproducible.
function settingsFromUrl(): PlanetSettings {
  const params = new URLSearchParams(window.location.search)
  const shading = params.get('shading')
  const spin = params.get('spin')
  return {
    ...initialSettings,
    shading:
      shading === 'standard' || shading === 'lowpoly-hard' || shading === 'lowpoly-soft'
        ? shading
        : initialSettings.shading,
    spin: spin === null ? initialSettings.spin : spin !== '0',
  }
}

function OriginalPlanet({ appearance }: { appearance: Appearance }) {
  const [settings, setSettings] = useState(settingsFromUrl)

  const updateSetting = <Key extends keyof PlanetSettings>(
    key: Key,
    value: PlanetSettings[Key],
  ) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  const shadingLabel: Record<Shading, string> = {
    standard: 'Standard',
    'lowpoly-hard': 'Low-poly hard',
    'lowpoly-soft': 'Low-poly soft',
  }

  return (
    <main className="app-shell">
      <section className="viewport">
        <PlanetCanvas settings={settings} appearance={appearance} />
      </section>

      <header className="topbar">
        <div><span className="sim-eyebrow">01 / RADIAL FIELD</span><h1 className="wordmark">Original planet</h1></div>
        <span className="topbar-note">Noise, topology and a continuous surface.</span>
      </header>

      <div className="world-key planet-key" aria-label="Planet material legend"><span><i className="key-water"/>Ocean</span><span><i className="key-sand"/>Coast</span><span><i className="key-green"/>Vegetation</span><span><i className="key-rock"/>Rock</span><span><i className="key-snow"/>Highland snow</span><small>Illustrative elevation bands, not a climate model.</small></div>
      <aside className="control-panel" aria-label="Planet controls"><div className="inspector-heading"><span className="atlas-label">PLANET INSPECTOR</span><span className="inspector-dot"/>Form & surface</div>
        <section className="group">
          <h2>Terrain</h2>
          <SliderRow index="01" label="Radius" value={settings.radius.toFixed(1)}
            min={1} max={3} step={0.1} current={settings.radius}
            onChange={(v) => updateSetting('radius', v)} />
          <SliderRow index="02" label="Resolution" value={String(settings.resolution)}
            min={16} max={128} step={8} current={settings.resolution}
            onChange={(v) => updateSetting('resolution', v)} />
          <SliderRow index="03" label="Elevation" value={settings.elevation.toFixed(2)}
            min={0} max={0.8} step={0.01} current={settings.elevation}
            onChange={(v) => updateSetting('elevation', v)} />
          <SliderRow index="04" label="Noise frequency" value={settings.frequency.toFixed(1)}
            min={0.8} max={7} step={0.1} current={settings.frequency}
            onChange={(v) => updateSetting('frequency', v)} />
        </section>

        <section className="group">
          <h2>Look</h2>
          <ChoiceRow index="05" label="Topology" value={settings.topology}
            options={[
              { value: 'uv', label: 'UV sphere' },
              { value: 'ico', label: 'Icosphere' },
            ]}
            onChange={(v) => updateSetting('topology', v as Topology)} />
          <ChoiceRow index="06" label="Shading" value={settings.shading}
            options={[
              { value: 'standard', label: 'Standard' },
              { value: 'lowpoly-hard', label: 'Low-poly hard' },
              { value: 'lowpoly-soft', label: 'Low-poly soft' },
            ]}
            onChange={(v) => updateSetting('shading', v as Shading)} />
        </section>

        <section className="group">
          <h2>View</h2>
          <ToggleRow index="07" label="Wireframe" on={settings.wireframe}
            onChange={(v) => updateSetting('wireframe', v)} />
          <ToggleRow index="08" label="Auto spin" on={settings.spin}
            onChange={(v) => updateSetting('spin', v)} />
        </section>
      </aside>

      <footer className="statusline">
        <span>{shadingLabel[settings.shading]}</span>
        <span className="dot" />
        <span>{settings.topology === 'uv' ? 'UV sphere' : 'Icosphere'}</span>
        <span className="dot" />
        <span>{settings.resolution} segments</span><span>Optional radial contours · 0.05 u</span>
      </footer>
    </main>
  )
}

type SliderRowProps = {
  index: string
  label: string
  value: string
  min: number
  max: number
  step: number
  current: number
  onChange: (value: number) => void
}

function SliderRow({ index, label, value, min, max, step, current, onChange }: SliderRowProps) {
  return (
    <label className="row">
      <span className="row-index">{index}</span>
      <span className="row-label">{label}</span>
      <span className="row-value">{value}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

type ChoiceRowProps = {
  index: string
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
}

function ChoiceRow({ index, label, value, options, onChange }: ChoiceRowProps) {
  return (
    <div className="row" role="radiogroup" aria-label={label}>
      <span className="row-index">{index}</span>
      <span className="row-label">{label}</span>
      <span className="row-choices">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={option.value === value}
            className={option.value === value ? 'choice on' : 'choice'}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </span>
    </div>
  )
}

type ToggleRowProps = {
  index: string
  label: string
  on: boolean
  onChange: (value: boolean) => void
}

function ToggleRow({ index, label, on, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      className={on ? 'row toggle on' : 'row toggle'}
      onClick={() => onChange(!on)}
    >
      <span className="row-index">{index}</span>
      <span className="row-label">{label}</span>
      <span className="row-value">
        <span className="toggle-dot" />
        {on ? 'On' : 'Off'}
      </span>
    </button>
  )
}

function App() {
  const [tab, setTab] = useState(() => {
    const workspace = new URLSearchParams(window.location.search).get('workspace')
    return workspace && ['planet', 'noise', 'simulation', 'living', 'voxels', 'fields'].includes(workspace) ? workspace : 'simulation'
  })
  const [visited,setVisited] = useState<string[]>([tab])
  const changeTab=(id:string)=>{setVisited(v=>v.includes(id)?v:[...v,id]);setTab(id)}
  useEffect(()=>{const url=new URL(window.location.href);url.searchParams.set('workspace',tab);window.history.replaceState(null,'',url)},[tab])
  const [layers,setLayers]=useState<Layer[]>([{...makeLayer(1),name:'Base terrain',weight:1}])
  const [solo,setSolo]=useState<number|null>(null)
  const [appearance, setAppearance] = useState<Appearance>(() => {
    const surface = new URLSearchParams(window.location.search).get('surface')
    return { surface: surface && ['studio','illustrated','relief','contours','stipple'].includes(surface) ? surface as Surface : 'studio' }
  })
  const [interfacePalette, setInterfacePalette] = useState<Palette>('forest')
  const studies = [
    { id: 'planet', name: 'Original planet', subtitle: 'Form & topology', number: '01' },
    { id: 'noise', name: 'Noise laboratory', subtitle: 'Layers & height fields', number: '02' },
    { id: 'simulation', name: 'Simulation map', subtitle: 'Erosion & height fields', number: '03' },
    { id: 'living', name: 'Living coast', subtitle: 'Biomes, tides & life', number: '04' },
    { id: 'voxels', name: 'Voxel terrain', subtitle: 'Caves & solid space', number: '05' },
    { id: 'fields', name: 'Fluid laboratory', subtitle: 'Wind & transported dye', number: '06' },
  ]
  return <div className="atlas workbench" data-palette={interfacePalette} data-surface={appearance.surface}>
    <header className="atlas-masthead"><div className="studio-wordmark"><span className="studio-seal" aria-hidden="true">✳</span><div><span className="atlas-brand">Fieldwork <span>Nature Studio</span></span><p>A small world, a closer look.</p></div></div><span className="atlas-edition">PROCEDURAL WORLD BUILDING<br/><b>OBSERVE · EXPERIMENT · UNDERSTAND</b></span></header>
    <aside className="studio-library"><span className="atlas-label">YOUR FIELD STUDIES</span><nav className="workspace-nav" role="tablist" aria-label="Workspace" aria-orientation="vertical">
      {studies.map(study=><button key={study.id} role="tab" id={`tab-${study.id}`} aria-controls={`study-${study.id}`} aria-selected={tab===study.id} tabIndex={tab===study.id?0:-1} onKeyDown={event=>{
        const keys=['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End']
        if(!keys.includes(event.key))return
        event.preventDefault()
        const current=studies.findIndex(item=>item.id===study.id)
        const next=event.key==='Home'?0:event.key==='End'?studies.length-1:(current+(['ArrowUp','ArrowLeft'].includes(event.key)?-1:1)+studies.length)%studies.length
        changeTab(studies[next].id);document.getElementById(`tab-${studies[next].id}`)?.focus()
      }} onClick={()=>changeTab(study.id)}><StudyMark kind={study.id}/><span><strong>{study.name}</strong><small>{study.subtitle}</small></span><i>{study.number}</i></button>)}
    </nav><section className="library-note"><span className="atlas-label">IN THE FIELD</span><h2>Look for the<br/>little connections.</h2><p>Shape the ground.<br/>Follow the water.<br/>Find where trees belong.</p><div className="library-colors" aria-hidden="true"><i/><i/><i/><i/></div></section><div className="library-foot"><span className="inspector-dot"/> An interactive field notebook</div></aside>
    <div className="atlas-appearance"><div className="appearance-domain"><span className="atlas-label">WORLD</span><label>Rendering<select disabled={["living","voxels","fields"].includes(tab)} aria-label="World rendering" value={appearance.surface} onChange={e=>setAppearance({surface:e.target.value as Surface})}><option value="studio">Natural illustration</option><option value="illustrated">Illustrated map · archive</option><option value="relief">Natural materials</option><option value="contours">Materials + contours</option><option value="stipple">Materials + stipple</option></select></label></div><div className="appearance-domain"><label>Panel accent<select aria-label="Interface accent" value={interfacePalette} onChange={e=>setInterfacePalette(e.target.value as Palette)}><option value="forest">Sage</option><option value="graphite">Graphite</option></select></label></div><span className="atlas-appearance-note">{["living","voxels","fields"].includes(tab)?"This study uses its own material and data views.":"Same world. A different way to see it."}</span></div>
    <div className="studio-content" role="tabpanel" id="study-planet" aria-labelledby="tab-planet" hidden={tab!=='planet'}><OriginalPlanet appearance={appearance}/></div>
    <div className="studio-content" role="tabpanel" id="study-noise" aria-labelledby="tab-noise" hidden={tab!=='noise'}><NoiseLab {...{layers,setLayers,solo,setSolo,appearance}}/></div>
    {(visited.includes('simulation')||tab==='simulation')&&<div hidden={tab!=='simulation'} className="studio-content" role="tabpanel" id="study-simulation" aria-labelledby="tab-simulation"><SimulationMap {...{layers,solo,appearance}} active={tab==='simulation'}/></div>}
    <Suspense fallback={<div className="studio-content field-note">Preparing the field study…</div>}>
      {(visited.includes('living')||tab==='living')&&<div className="studio-content" role="tabpanel" id="study-living" aria-labelledby="tab-living" hidden={tab!=='living'}><LivingWorld layers={layers} solo={solo} active={tab==='living'}/></div>}
      {(visited.includes('voxels')||tab==='voxels')&&<div className="studio-content" role="tabpanel" id="study-voxels" aria-labelledby="tab-voxels" hidden={tab!=='voxels'}><VoxelLab active={tab==='voxels'}/></div>}
      {(visited.includes('fields')||tab==='fields')&&<div className="studio-content" role="tabpanel" id="study-fields" aria-labelledby="tab-fields" hidden={tab!=='fields'}><FieldLab active={tab==='fields'}/></div>}
    </Suspense>
  </div>
}
export default App
