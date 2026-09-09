import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import './App.css'

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

const SUN_DIRECTION = new THREE.Vector3(4, 3, 5).normalize()

const stylizedVertexShader = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying float vElevation;
  uniform float uRadius;

  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vElevation = length(position) - uRadius;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const stylizedFragmentShader = /* glsl */ `
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying float vElevation;

  uniform float uElevation;
  uniform float uSteps;
  uniform float uSoftness;
  uniform float uRimStrength;
  uniform float uOpacity;
  uniform bool uIsOcean;
  uniform vec3 uSunDir;

  // Quantize lighting into bands; uSoftness widens the blend between bands.
  float toon(float x) {
    float s = x * uSteps;
    float base = floor(s);
    float frac = s - base;
    float edge = smoothstep(0.5 - uSoftness, 0.5 + uSoftness, frac);
    return clamp((base + edge) / uSteps, 0.0, 1.0);
  }

  vec3 landColor(float t) {
    vec3 sand   = vec3(0.86, 0.76, 0.48);
    vec3 grass  = vec3(0.34, 0.63, 0.36);
    vec3 forest = vec3(0.18, 0.44, 0.30);
    vec3 rock   = vec3(0.50, 0.44, 0.42);
    vec3 snow   = vec3(0.95, 0.96, 0.98);
    vec3 c = sand;
    c = mix(c, grass,  step(0.08, t));
    c = mix(c, forest, step(0.30, t));
    c = mix(c, rock,   step(0.52, t));
    c = mix(c, snow,   step(0.74, t));
    return c;
  }

  void main() {
    // Face normal from screen-space derivatives: every triangle gets one flat colour.
    vec3 flatNormal = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
    vec3 viewDir = normalize(cameraPosition - vWorldPos);

    float t = vElevation / max(uElevation, 0.001);
    vec3 albedo = uIsOcean ? vec3(0.16, 0.42, 0.82) : landColor(t);

    float ndl = max(dot(flatNormal, uSunDir), 0.0);
    float lit = toon(ndl);

    vec3 shadowTint = vec3(0.32, 0.36, 0.62);
    vec3 lightTint  = vec3(1.08, 1.02, 0.92);
    vec3 color = albedo * mix(shadowTint, lightTint, lit);

    float rim = pow(1.0 - max(dot(normalize(vWorldNormal), viewDir), 0.0), 3.0);
    color += rim * uRimStrength * (uIsOcean ? vec3(0.55, 0.75, 1.0) : vec3(1.0, 0.85, 0.65));

    gl_FragColor = vec4(color, uOpacity);
  }
`

function createStylizedMaterial(shading: Shading, settings: PlanetSettings, isOcean: boolean) {
  const hard = shading === 'lowpoly-hard'
  return new THREE.ShaderMaterial({
    vertexShader: stylizedVertexShader,
    fragmentShader: stylizedFragmentShader,
    transparent: isOcean,
    uniforms: {
      uRadius: { value: settings.radius },
      uElevation: { value: settings.elevation },
      uSteps: { value: hard ? 2 : 4 },
      uSoftness: { value: hard ? 0.02 : 0.28 },
      uRimStrength: { value: hard ? 0.35 : 0.55 },
      uOpacity: { value: isOcean ? 0.82 : 1.0 },
      uIsOcean: { value: isOcean },
      uSunDir: { value: SUN_DIRECTION.clone() },
    },
  })
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

function PlanetCanvas({ settings }: { settings: PlanetSettings }) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const planetRef = useRef<THREE.Mesh | null>(null)
  const oceanRef = useRef<THREE.Mesh | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const spinRef = useRef(settings.spin)
  const standardMaterialsRef = useRef<{ land: THREE.Material; ocean: THREE.Material } | null>(null)
  const stylizedMaterialsRef = useRef<{ land: THREE.ShaderMaterial; ocean: THREE.ShaderMaterial } | null>(null)
  const { radius, resolution, elevation, frequency, topology, wireframe, shading } = settings

  useEffect(() => {
    spinRef.current = settings.spin
  }, [settings.spin])

  useEffect(() => {
    if (!mountRef.current) {
      return
    }

    const mount = mountRef.current
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#080810')

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 1.2, 6)

    // preserveDrawingBuffer lets canvas.toDataURL() capture the scene for screenshots
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true

    const planet = new THREE.Mesh(
      buildPlanetGeometry(initialSettings),
      new THREE.MeshStandardMaterial({
        color: '#68a06a',
        roughness: 0.85,
        metalness: 0.05,
      }),
    )
    scene.add(planet)

    const ocean = new THREE.Mesh(
      new THREE.SphereGeometry(initialSettings.radius * 1.01, 96, 48),
      new THREE.MeshStandardMaterial({
        color: '#246bfe',
        transparent: true,
        opacity: 0.38,
        roughness: 0.25,
      }),
    )
    scene.add(ocean)

    scene.add(new THREE.AmbientLight('#ffffff', 0.4))
    const sun = new THREE.DirectionalLight('#ffffff', 2)
    sun.position.set(4, 3, 5)
    scene.add(sun)

    const stars = new THREE.Points(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 450 }, () => {
          const point = new THREE.Vector3(
            THREE.MathUtils.randFloatSpread(30),
            THREE.MathUtils.randFloatSpread(30),
            THREE.MathUtils.randFloatSpread(30),
          )
          return point.length() < 8 ? point.setLength(8) : point
        }),
      ),
      new THREE.PointsMaterial({ color: '#ffffff', size: 0.025 }),
    )
    scene.add(stars)

    const resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      renderer.setSize(width, height)
      camera.aspect = width / height
      // Nudge the planet right of centre so the floating control column
      // doesn't sit on top of it (desktop layout only).
      camera.setViewOffset(width, height, width > 820 ? -150 : 0, 0, width, height)
      camera.updateProjectionMatrix()
    })
    resizeObserver.observe(mount)

    const animate = () => {
      if (spinRef.current) {
        planet.rotation.y += 0.0025
        ocean.rotation.y += 0.0015
      }

      controls.update()
      renderer.render(scene, camera)
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    animate()

    sceneRef.current = scene
    rendererRef.current = renderer
    cameraRef.current = camera
    controlsRef.current = controls
    planetRef.current = planet
    oceanRef.current = ocean
    standardMaterialsRef.current = {
      land: planet.material as THREE.Material,
      ocean: ocean.material as THREE.Material,
    }

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      resizeObserver.disconnect()
      controls.dispose()
      planet.geometry.dispose()
      ocean.geometry.dispose()
      standardMaterialsRef.current?.land.dispose()
      standardMaterialsRef.current?.ocean.dispose()
      stylizedMaterialsRef.current?.land.dispose()
      stylizedMaterialsRef.current?.ocean.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [])

  useEffect(() => {
    if (!planetRef.current) {
      return
    }

    const oldGeometry = planetRef.current.geometry
    planetRef.current.geometry = buildPlanetGeometry({
      radius,
      resolution,
      elevation,
      frequency,
      topology,
      spin: false,
      wireframe: false,
      shading: 'standard',
    })
    oldGeometry.dispose()
  }, [radius, resolution, elevation, frequency, topology])

  useEffect(() => {
    const planet = planetRef.current
    const ocean = oceanRef.current
    const standard = standardMaterialsRef.current
    if (!planet || !ocean || !standard) {
      return
    }

    stylizedMaterialsRef.current?.land.dispose()
    stylizedMaterialsRef.current?.ocean.dispose()
    stylizedMaterialsRef.current = null

    if (shading === 'standard') {
      planet.material = standard.land
      ocean.material = standard.ocean
      return
    }

    const current = { ...settings, radius, elevation }
    const stylized = {
      land: createStylizedMaterial(shading, current, false),
      ocean: createStylizedMaterial(shading, current, true),
    }
    stylizedMaterialsRef.current = stylized
    planet.material = stylized.land
    ocean.material = stylized.ocean
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shading])

  useEffect(() => {
    const stylized = stylizedMaterialsRef.current
    if (!stylized) {
      return
    }
    for (const material of [stylized.land, stylized.ocean]) {
      material.uniforms.uRadius.value = radius
      material.uniforms.uElevation.value = elevation
    }
  }, [radius, elevation])

  useEffect(() => {
    if (!planetRef.current || !oceanRef.current) {
      return
    }

    // The ocean shell hides the mesh structure, so park it in wireframe mode.
    ;(planetRef.current.material as THREE.MeshStandardMaterial | THREE.ShaderMaterial).wireframe = wireframe
    oceanRef.current.visible = !wireframe
  }, [wireframe, shading])

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

function App() {
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
        <PlanetCanvas settings={settings} />
      </section>

      <header className="topbar">
        <span className="wordmark">Planet Studio</span>
        <span className="topbar-note">Procedural World Building</span>
      </header>

      <aside className="control-panel" aria-label="Planet controls">
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
        <span>{settings.resolution} segments</span>
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

export default App
