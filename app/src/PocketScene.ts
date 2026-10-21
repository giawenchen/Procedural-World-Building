import * as THREE from 'three'
import { buildTree, terrainMaterial, foliageMaterial, coastalWater, disposeScene } from './natureRendering'
import { biomeAt, BIOME_COLORS, random } from './worldSystems'
import { pocketHeight, pocketHabitat, GRID } from './pocketModel'
import type { PocketState } from './pocketModel'

export class PocketScene {
  readonly scene = new THREE.Scene()
  readonly renderer: THREE.WebGLRenderer
  readonly camera = new THREE.OrthographicCamera(-90, 90, 90, -90, .1, 600)
  private observer: ResizeObserver
  private ground: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>
  private water: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>
  private groundMap: THREE.DataTexture
  private trunks: THREE.InstancedMesh
  private broadleaf: THREE.InstancedMesh
  private fir: THREE.InstancedMesh
  private seeds: THREE.InstancedMesh
  private seedTrail: THREE.Line
  private focusRing: THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>
  private focusSeed: THREE.Mesh
  private aim = new THREE.Vector3(0, 5, 0)
  private overview = false
  private viewWidth = 96
  private currentWidth = 96
  private lastState: PocketState | null = null
  private rain: THREE.LineSegments
  private trails: THREE.LineSegments
  private tracers: {x:number;z:number;life:number}[] = []
  private wind = { value: new THREE.Vector2() }
  private clock = { value: 0 }
  private dummy = new THREE.Object3D()
  private lastTrees = -1
  private lastColors = -1
  private rng = random(281)
  private host: HTMLDivElement
  private raycaster = new THREE.Raycaster()
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

  constructor(host: HTMLDivElement, s: PocketState) {
    this.host = host
    this.scene.background = new THREE.Color('#dce8e5')
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))
    this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.shadowMap.autoUpdate = false; this.renderer.shadowMap.needsUpdate = true
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.12
    this.renderer.domElement.setAttribute('aria-label', 'Interactive island. Drag to steer the wind, or choose Plant and tap the land.')
    host.appendChild(this.renderer.domElement)
    this.camera.position.set(108, 106, 132); this.camera.lookAt(0, 2, 0)
    this.scene.add(new THREE.HemisphereLight('#fff6df', '#7e9390', 2))
    const sun = new THREE.DirectionalLight('#ffeac7', 2.6); sun.position.set(-65, 105, 30); sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024); Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, far: 240 }); sun.shadow.normalBias = .2
    this.scene.add(sun)
    const geo = new THREE.PlaneGeometry(160, 160, 96, 96); geo.rotateX(-Math.PI / 2)
    const pos = geo.getAttribute('position')
    for (let i = 0; i < pos.count; i++) pos.setY(i, pocketHeight(pos.getX(i), pos.getZ(i)))
    geo.computeVertexNormals(); geo.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(pos.count * 3), 3))
    this.ground = new THREE.Mesh(geo, terrainMaterial()); this.ground.receiveShadow = true; this.scene.add(this.ground)
    const data = new Uint8Array(GRID * GRID * 4)
    for (let i = 0; i < s.heights.length; i++) data.set([Math.round((s.heights[i] + 24) / 64 * 255), 0, 0, 255], i * 4)
    this.groundMap = new THREE.DataTexture(data, GRID, GRID); this.groundMap.magFilter = this.groundMap.minFilter = THREE.LinearFilter; this.groundMap.needsUpdate = true
    const waterMat = coastalWater(this.groundMap)
    // Softly dissolve the square sampling boundary into the surrounding sea.
    waterMat.fragmentShader = waterMat.fragmentShader.replace('gl_FragColor=vec4(col,', 'float edge=smoothstep(70.,80.,max(abs(world.x),abs(world.y))); col=mix(col,vec3(.70,.81,.78),edge); gl_FragColor=vec4(col,')
    this.water = new THREE.Mesh(new THREE.PlaneGeometry(160, 160, 60, 60), waterMat); this.water.rotation.x = -Math.PI / 2; this.scene.add(this.water)
    const tree = buildTree(2, 28), fir = buildTree(2, 30, 'fir'); fir.branches.dispose()
    const leaves = foliageMaterial()
    leaves.onBeforeCompile = shader => {
      shader.uniforms.pocketWind = this.wind; shader.uniforms.pocketTime = this.clock
      shader.vertexShader = 'uniform vec2 pocketWind; uniform float pocketTime;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\ntransformed.xz += pocketWind * sin(pocketTime*2.1+position.y*.8) * position.y*.055;')
    }
    this.trunks = new THREE.InstancedMesh(tree.branches, new THREE.MeshStandardMaterial({ color: '#8a6a4d', roughness: 1 }), 130)
    this.broadleaf = new THREE.InstancedMesh(tree.foliage, leaves, 130); this.fir = new THREE.InstancedMesh(fir.foliage, leaves, 130)
    for (const mesh of [this.trunks, this.broadleaf, this.fir]) { mesh.frustumCulled = false; mesh.castShadow = true; this.scene.add(mesh) }
    const rocks = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshStandardMaterial({ color: '#b0a999', roughness: 1 }), 70)
    let n = 0
    for (let i = 0; i < 500 && n < 70; i++) {
      const x = (this.rng() - .5) * 120, z = (this.rng() - .5) * 120, h = pocketHeight(x, z)
      if (h < 1.2) continue
      this.dummy.position.set(x, h, z); this.dummy.scale.set(1 + this.rng(), .5 + this.rng(), 1); this.dummy.rotation.set(0, this.rng() * 6, 0); this.dummy.updateMatrix(); rocks.setMatrixAt(n++, this.dummy.matrix)
    }
    rocks.count = n; rocks.castShadow = rocks.receiveShadow = true; this.scene.add(rocks)
    this.seeds = new THREE.InstancedMesh(new THREE.SphereGeometry(.65, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff1ad' }), 60); this.seeds.frustumCulled = false; this.scene.add(this.seeds)
    const seedTrailGeo = new THREE.BufferGeometry(); seedTrailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(96 * 3), 3))
    this.seedTrail = new THREE.Line(seedTrailGeo, new THREE.LineBasicMaterial({ color: '#b46e19', depthTest: false, transparent: true, opacity: .8 })); this.seedTrail.frustumCulled = false; this.seedTrail.renderOrder = 5; this.scene.add(this.seedTrail)
    this.focusRing = new THREE.Mesh(new THREE.RingGeometry(2.6, 3.05, 48), new THREE.MeshBasicMaterial({ color: '#f6d16c', side: THREE.DoubleSide, depthTest: false, transparent: true, opacity: .95 })); this.focusRing.rotation.x = -Math.PI / 2; this.focusRing.renderOrder = 6; this.scene.add(this.focusRing)
    this.focusSeed = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), new THREE.MeshBasicMaterial({ color: '#ffdc72', depthTest: false })); this.focusSeed.renderOrder = 7; this.scene.add(this.focusSeed)
    const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(160 * 6), 3))
    this.rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: '#eaffff', transparent: true, opacity: .8 })); this.rain.frustumCulled = false; this.scene.add(this.rain)
    const trailGeo = new THREE.BufferGeometry(); trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(90 * 6), 3))
    this.trails = new THREE.LineSegments(trailGeo, new THREE.LineBasicMaterial({ color: '#f7f2d9', transparent: true, opacity: .55 })); this.trails.frustumCulled = false; this.scene.add(this.trails)
    for (let i = 0; i < 90; i++) this.tracers.push({ x: (this.rng() - .5) * 140, z: (this.rng() - .5) * 140, life: this.rng() * 8 })
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host); this.resize(); this.draw(s, 0)
  }
  private resize() {
    const w = this.host.clientWidth, h = this.host.clientHeight
    if (!w || !h) return
    this.renderer.setSize(w, h)
    const aspect = w / h
    this.viewWidth = this.overview ? Math.max(183, 125 * aspect) : Math.max(96, 84 * aspect)
    this.applyFrustum()
  }
  setOverview(value: boolean) { this.overview = value; this.resize() }
  focusPosition(s: PocketState) {
    const f = s.focus
    if (!f) return null
    const p = new THREE.Vector3(f.x, f.stage === 'flight' ? f.y + 2 : Math.max(.3, pocketHeight(f.x, f.z)) + 3, f.z).project(this.camera)
    return { x: (p.x + 1) / 2 * this.host.clientWidth, y: (1 - p.y) / 2 * this.host.clientHeight, visible: Math.abs(p.x) < .92 && Math.abs(p.y) < .9 }
  }
  private applyFrustum() {
    const aspect = this.host.clientWidth / Math.max(1, this.host.clientHeight), width = this.currentWidth, height = width / aspect
    this.camera.left = -width / 2; this.camera.right = width / 2; this.camera.top = height / 2; this.camera.bottom = -height / 2; this.camera.updateProjectionMatrix()
  }
  groundPoint(clientX: number, clientY: number) {
    const r = this.renderer.domElement.getBoundingClientRect()
    this.raycaster.setFromCamera(new THREE.Vector2((clientX - r.left) / r.width * 2 - 1, 1 - (clientY - r.top) / r.height * 2), this.camera)
    return this.raycaster.intersectObject(this.ground)[0]?.point
  }
  draw(s: PocketState, dt: number) {
    if (s !== this.lastState) { this.lastTrees = this.lastColors = -1; this.lastState = s }
    const f = s.focus, focusY = f ? Math.max(0, pocketHeight(f.x, f.z)) + 3 : 5
    const desired = !this.overview && f ? new THREE.Vector3(Math.max(-60, Math.min(60, f.x)), focusY, Math.max(-60, Math.min(60, f.z))) : new THREE.Vector3(0, 5, 0)
    const blend = this.reducedMotion ? 1 : 1 - Math.exp(-Math.max(dt, .016) * 3)
    this.aim.lerp(desired, blend); this.currentWidth += (this.viewWidth - this.currentWidth) * blend; this.applyFrustum()
    this.camera.position.copy(this.aim).add(new THREE.Vector3(108, 106, 132)); this.camera.lookAt(this.aim)
    this.clock.value = s.time; this.wind.value.set(s.wind.x, s.wind.z)
    const u = this.water.material.uniforms
    u.time.value = s.time; u.speed.value = Math.hypot(s.current.x, s.current.z) * 2; u.direction.value = Math.atan2(s.current.z, s.current.x); u.swirl.value = .35
    if (Math.floor(s.time * 3) !== this.lastTrees || this.trunks.count !== s.plants.length) {
      const color = new THREE.Color()
      this.trunks.count = this.broadleaf.count = this.fir.count = s.plants.length
      s.plants.forEach((p, i) => {
        this.dummy.position.set(p.x, pocketHeight(p.x, p.z), p.z); this.dummy.rotation.set(0, p.id * 2.399, 0); this.dummy.scale.setScalar(p.size * 2); this.dummy.updateMatrix()
        this.trunks.setMatrixAt(i, this.dummy.matrix); (p.species ? this.fir : this.broadleaf).setMatrixAt(i, this.dummy.matrix)
        this.dummy.scale.setScalar(0); this.dummy.updateMatrix(); (p.species ? this.broadleaf : this.fir).setMatrixAt(i, this.dummy.matrix)
        color.set(p.species ? '#486e5c' : '#829459').lerp(new THREE.Color('#c0a967'), .13 + (1 - p.health) * .7)
        this.broadleaf.setColorAt(i, color); this.fir.setColorAt(i, color)
      })
      for (const mesh of [this.trunks, this.broadleaf, this.fir]) { mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true }
      this.renderer.shadowMap.needsUpdate = true; this.lastTrees = Math.floor(s.time * 3)
    }
    if (Math.floor(s.time) !== this.lastColors) {
      const p = this.ground.geometry.getAttribute('position'), colors = this.ground.geometry.getAttribute('color'), color = new THREE.Color()
      for (let i = 0; i < p.count; i++) {
        const h = pocketHabitat(s, p.getX(i), p.getZ(i)), b = biomeAt(h.height, h.slope, 0, h)
        color.set(BIOME_COLORS[b]); if (b > 1) color.lerp(new THREE.Color('#74977d'), h.moisture * .22)
        colors.setXYZ(i, color.r, color.g, color.b)
      }
      colors.needsUpdate = true; this.lastColors = Math.floor(s.time)
    }
    this.seeds.count = s.seeds.length
    s.seeds.forEach((seed, i) => { this.dummy.position.set(seed.x, seed.y, seed.z); this.dummy.scale.set(1.5, .65, .75); this.dummy.updateMatrix(); this.seeds.setMatrixAt(i, this.dummy.matrix) }); this.seeds.instanceMatrix.needsUpdate = true
    this.focusRing.visible = this.seedTrail.visible = !!f
    this.focusSeed.visible = !!f && (f.stage === 'flight' || f.stage === 'waiting')
    if (f) {
      const ground = Math.max(.2, pocketHeight(f.x, f.z) + .2), pulse = this.reducedMotion ? 1 : 1 + Math.sin(s.time * 3) * .08
      this.focusRing.position.set(f.x, ground, f.z); this.focusRing.scale.setScalar(pulse)
      this.focusRing.material.color.set(f.stage === 'lost' ? '#ba6d43' : f.stage === 'rooted' ? '#f5e8ad' : '#e9b73e')
      this.focusSeed.position.set(f.x, f.stage === 'flight' ? f.y : ground + .8, f.z); this.focusSeed.scale.set(1.5, .65, .8)
      const positions = this.seedTrail.geometry.getAttribute('position')
      f.path.forEach((p, i) => positions.setXYZ(i, p.x, p.y, p.z)); positions.needsUpdate = true; this.seedTrail.geometry.setDrawRange(0, f.path.length)
    }
    const rain = this.rain.geometry.getAttribute('position')
    for (let i = 0; i < 160; i++) {
      const x = Math.sin(i * 127.1) * 64, z = Math.cos(i * 311.7) * 64, y = 40 - ((s.time * 27 + i * 2.7) % 40), base = Math.max(0, pocketHeight(x, z))
      rain.setXYZ(i * 2, x, base + y, z); rain.setXYZ(i * 2 + 1, x - s.wind.x * .35, base + y + 2, z - s.wind.z * .35)
    }
    rain.needsUpdate = true; this.rain.visible = s.rain > .1 && !this.reducedMotion
    const trails = this.trails.geometry.getAttribute('position')
    this.tracers.forEach((p, i) => {
      const sea = pocketHeight(p.x, p.z) < 0, v = sea ? s.current : s.wind, speed = sea ? 4 : 3
      const oldX = p.x, oldZ = p.z
      p.x += v.x * dt * speed; p.z += v.z * dt * speed; p.life -= dt
      if (Math.abs(p.x) > 74 || Math.abs(p.z) > 74 || p.life < 0 || (sea && pocketHeight(p.x, p.z) >= 0)) { p.x = (this.rng() - .5) * 145; p.z = (this.rng() - .5) * 145; p.life = 4 + this.rng() * 4 }
      const y = Math.max(.3, pocketHeight(p.x, p.z) + 10)
      const moved = Math.abs(p.x - oldX) + Math.abs(p.z - oldZ) < 10
      trails.setXYZ(i * 2, p.x, y, p.z); trails.setXYZ(i * 2 + 1, moved ? p.x - v.x * 1.7 : p.x, y, moved ? p.z - v.z * 1.7 : p.z)
    }); trails.needsUpdate = true; this.trails.visible = !this.reducedMotion
    this.renderer.render(this.scene, this.camera)
  }
  dispose() { this.observer.disconnect(); this.groundMap.dispose(); disposeScene(this.scene); this.renderer.dispose(); this.renderer.domElement.remove() }
}
