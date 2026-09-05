import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import './App.css'

type Topology = 'uv' | 'ico'

type PlanetSettings = {
  radius: number
  resolution: number
  elevation: number
  frequency: number
  spin: boolean
  topology: Topology
  wireframe: boolean
}

const initialSettings: PlanetSettings = {
  radius: 2,
  resolution: 80,
  elevation: 0.35,
  frequency: 2.8,
  spin: true,
  topology: 'uv',
  wireframe: false,
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
  const { radius, resolution, elevation, frequency, topology, wireframe } = settings

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

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      resizeObserver.disconnect()
      controls.dispose()
      planet.geometry.dispose()
      ocean.geometry.dispose()
      ;(planet.material as THREE.Material).dispose()
      ;(ocean.material as THREE.Material).dispose()
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
    })
    oldGeometry.dispose()
  }, [radius, resolution, elevation, frequency, topology])

  useEffect(() => {
    if (!planetRef.current || !oceanRef.current) {
      return
    }

    // The ocean shell hides the mesh structure, so park it in wireframe mode.
    ;(planetRef.current.material as THREE.MeshStandardMaterial).wireframe = wireframe
    oceanRef.current.visible = !wireframe
  }, [wireframe])

  return <div ref={mountRef} className="planet-canvas" aria-label="Procedural planet preview" />
}

function App() {
  const [settings, setSettings] = useState(initialSettings)

  const updateSetting = <Key extends keyof PlanetSettings>(
    key: Key,
    value: PlanetSettings[Key],
  ) => {
    setSettings((current) => ({ ...current, [key]: value }))
  }

  return (
    <main className="app-shell">
      <aside className="control-panel">
        <p className="eyebrow">Procedural World Building</p>
        <h1>Planet Studio</h1>
        <p className="intro">
          React owns these controls and settings. Three.js owns the 3D canvas.
        </p>

        <label>
          Radius <span>{settings.radius.toFixed(1)}</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.1"
            value={settings.radius}
            onChange={(event) => updateSetting('radius', Number(event.target.value))}
          />
        </label>

        <label>
          Resolution <span>{settings.resolution}</span>
          <input
            type="range"
            min="16"
            max="128"
            step="8"
            value={settings.resolution}
            onChange={(event) => updateSetting('resolution', Number(event.target.value))}
          />
        </label>

        <label>
          Elevation <span>{settings.elevation.toFixed(2)}</span>
          <input
            type="range"
            min="0"
            max="0.8"
            step="0.01"
            value={settings.elevation}
            onChange={(event) => updateSetting('elevation', Number(event.target.value))}
          />
        </label>

        <label>
          Noise frequency <span>{settings.frequency.toFixed(1)}</span>
          <input
            type="range"
            min="0.8"
            max="7"
            step="0.1"
            value={settings.frequency}
            onChange={(event) => updateSetting('frequency', Number(event.target.value))}
          />
        </label>

        <label>
          Topology <span>{settings.topology === 'uv' ? 'UV sphere' : 'Icosphere'}</span>
          <select
            value={settings.topology}
            onChange={(event) => updateSetting('topology', event.target.value as Topology)}
          >
            <option value="uv">UV sphere (lat/long grid)</option>
            <option value="ico">Icosphere (subdivided d20)</option>
          </select>
        </label>

        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.wireframe}
            onChange={(event) => updateSetting('wireframe', event.target.checked)}
          />
          Wireframe
        </label>

        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.spin}
            onChange={(event) => updateSetting('spin', event.target.checked)}
          />
          Auto spin
        </label>
      </aside>

      <section className="viewport">
        <PlanetCanvas settings={settings} />
      </section>
    </main>
  )
}

export default App
