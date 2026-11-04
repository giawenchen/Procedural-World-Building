import * as THREE from 'three'
import { buildTree, disposeScene, foliageMaterial, terrainMaterial } from './natureRendering'
import { hash } from './worldSystems'
import { heistHeight } from './forestHeistModel'
import type { HeistChapter, HeistWorld, ReturnSite } from './forestHeistModel'

export type HeistView = 'director' | 'ground' | 'above'
export type HeistFrame = {
  chapter: HeistChapter; world: HeistWorld; chapterTime: number; time: number;
  angle: number; iterations: number; skeleton: boolean; lineage: boolean;
  view: HeistView; placing: boolean; returned: ReturnSite | null; paused: boolean;
}
type Callbacks = { select: (id: number) => void; hover: (id: number | null) => void; place: (x: number, z: number) => void; error: (message: string) => void }

function islandGeometry() {
  const positions: number[] = [], colors: number[] = [], indices: number[] = []
  const sectors = 128, rings = 56, green = new THREE.Color('#70875c'), dry = new THREE.Color('#baac74'), beach = new THREE.Color('#c9b28c')
  for (let r = 0; r <= rings; r++) for (let j = 0; j <= sectors; j++) {
    const a = j / sectors * Math.PI * 2, radius = r / rings * 37
    const x = Math.cos(a) * radius, z = Math.sin(a) * radius, h = heistHeight(x, z)
    positions.push(x, h, z)
    const c = h < .9 ? beach.clone() : green.clone().lerp(dry, .15 + .22 * Math.sin(x * .13 + z * .07))
    if (x < -12 && z > 2) c.lerp(dry, .55)
    colors.push(c.r, c.g, c.b)
    if (r < rings && j < sectors) { const i = r * (sectors + 1) + j, n = i + sectors + 1; indices.push(i, i + 1, n, i + 1, n + 1, n) }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3)); g.setIndex(indices); g.computeVertexNormals()
  return g
}

function waterMaterial() {
  return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { time: { value: 0 } }, vertexShader: `varying vec3 p; void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`, fragmentShader: `
    varying vec3 p; uniform float time;
    void main(){
      float r=length(vec2(p.x/1.05,p.z));
      float h=2.1+1.4*exp(-(pow(p.x+10.,2.)+pow(p.z+5.,2.))/170.)+.38*sin(p.x*.21)*cos(p.z*.19)-3.8*exp(-(pow(p.x-16.,2.)+pow(p.z-5.,2.))/33.)-max(0.,r-22.)*.6;
      if(h>0.)discard;
      float edge=1.-smoothstep(45.,64.,length(p.xz));
      float foam=(1.-smoothstep(0.,.8,-h))*(.65+.15*sin(p.x*3.+p.z*2.-time));
      float ripple=pow(.5+.5*sin(p.x*.65+p.z*.3+sin(p.z*.4)-time*.6),28.);
      vec3 c=mix(vec3(.22,.47,.48),vec3(.11,.26,.30),smoothstep(0.,9.,-h));
      c+=ripple*.045;c=mix(c,vec3(.85,.89,.69),foam*.65);
      gl_FragColor=vec4(c,edge*.88);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }` })
}

function beamMaterial() {
  return new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
    uniforms: { time: { value: 0 }, strength: { value: 0 } },
    vertexShader: `varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `varying vec2 v;uniform float time,strength;void main(){float bands=pow(.5+.5*sin(v.y*95.-time*5.),12.);float edge=pow(abs(sin(v.x*3.14159)),2.);float fade=smoothstep(0.,.08,v.y)*(1.-smoothstep(.9,1.,v.y));gl_FragColor=vec4(.72,.92,.56,(.06+bands*.09)*edge*fade*strength);}` })
}

function makeSaucer() {
  const g = new THREE.Group(), cream = new THREE.MeshStandardMaterial({ color: '#d6d5af', metalness: .55, roughness: .3 }), plum = new THREE.MeshStandardMaterial({ color: '#6f6689', metalness: .45, roughness: .38 })
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), cream); hull.scale.set(4.3, .72, 4.3); hull.castShadow = true; g.add(hull)
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.45, .24, 12, 80), plum); ring.rotation.x = Math.PI / 2; g.add(ring)
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.1, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: '#9ed4c3', transparent: true, opacity: .38, roughness: .12, metalness: .15, depthWrite: false })); dome.position.y = .45; g.add(dome)
  const alien = new THREE.Mesh(new THREE.SphereGeometry(.72, 16, 12), new THREE.MeshStandardMaterial({ color: '#a8b474', roughness: 1 })); alien.position.set(0, .95, .4); alien.scale.set(1, 1.2, .8); g.add(alien)
  for (const x of [-.27, .27]) { const eye = new THREE.Mesh(new THREE.SphereGeometry(.2, 12, 8), new THREE.MeshBasicMaterial({ color: '#24373a' })); eye.position.set(x, 1.12, .92); eye.scale.set(.7, 1.3, .5); g.add(eye) }
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, light = new THREE.Mesh(new THREE.SphereGeometry(.14, 8, 6), new THREE.MeshBasicMaterial({ color: i % 3 ? '#ecdda0' : '#b3e5b8' })); light.position.set(Math.sin(a) * 3.8, -.3, Math.cos(a) * 3.8); g.add(light) }
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, 1.4, 6), plum); antenna.position.set(-1, 2.1, -.2); antenna.rotation.z = .35; g.add(antenna)
  const bobble = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), new THREE.MeshBasicMaterial({ color: '#e4a36c' })); bobble.position.set(-1.25, 2.8, -.2); g.add(bobble)
  return g
}

export class ForestHeistScene {
  private scene = new THREE.Scene()
  private camera = new THREE.PerspectiveCamera(40, 1, .1, 350)
  private renderer: THREE.WebGLRenderer
  private land = new THREE.Group()
  private laboratory = new THREE.Group()
  private saucer = makeSaucer()
  private beamMat = beamMaterial()
  private beam = new THREE.Mesh(new THREE.CylinderGeometry(.9, 4, 1, 48, 1, true), this.beamMat)
  private waterMat = waterMaterial()
  private sun = new THREE.DirectionalLight('#ffe0ac', 3)
  private beamLight = new THREE.SpotLight('#dbffc4', 0, 45, .24, .6, 1)
  private leafMat = foliageMaterial()
  private ghostLeaves = foliageMaterial()
  private woodMat = new THREE.MeshStandardMaterial({ color: '#806b59', roughness: .92 })
  private forestGeometry = buildTree(2, 28)
  private trunks = new THREE.InstancedMesh(this.forestGeometry.branches, this.woodMat, 300)
  private leaves = new THREE.InstancedMesh(this.forestGeometry.foliage, this.leafMat, 300)
  private seedMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(.12, 8, 6), new THREE.MeshBasicMaterial({ color: '#efca79' }), 100)
  private stumpMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(.19, .28, .48, 10), this.woodMat, 3)
  private ghost = new THREE.Group()
  private specimen = new THREE.Group()
  private specimenTree: ReturnType<typeof buildTree> | null = null
  private specimenWood = new THREE.MeshStandardMaterial({ color: '#a6bda1', roughness: .65, emissive: '#3b624a', emissiveIntensity: .25 })
  private specimenLeaves = foliageMaterial()
  private scanTime = { value: 0 }
  private ring = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.35, 64).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#f8dc9c', transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false }))
  private familyLines = new THREE.LineSegments(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#f7d99a', transparent: true, opacity: .65, depthTest: false }))
  private ground: THREE.Mesh
  private frame: HeistFrame | null = null
  private observer: ResizeObserver
  private raf = 0
  private previous = 0
  private filmTime = 0
  private lastWorld: HeistWorld | null = null
  private lastSpec = ''
  private lastChapter = ''
  private ids: number[] = []
  private hovered: number | null = null
  private liftedId: number | null = null
  private liftStart = 0
  private look = new THREE.Vector3(0, 4, 0)
  private pointer = new THREE.Vector2()
  private ray = new THREE.Raycaster()
  private down = { x: 0, y: 0 }
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches
  private visible = true
  private intersection: IntersectionObserver
  private host: HTMLDivElement
  private callbacks: Callbacks

  constructor(host: HTMLDivElement, callbacks: Callbacks) {
    this.host = host; this.callbacks = callbacks
    this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6)); this.renderer.shadowMap.enabled = true; this.renderer.shadowMap.type = THREE.PCFShadowMap
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping; this.renderer.toneMappingExposure = 1.18
    const canvas = this.renderer.domElement; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', 'Interactive forest story: an alien saucer, procedural trees, seeds and their descendants.'); host.appendChild(canvas)
    this.scene.background = new THREE.Color('#294047'); this.scene.fog = new THREE.Fog('#294047', 85, 170)
    this.scene.add(new THREE.HemisphereLight('#d1e4ce', '#494050', 2.1))
    this.sun.position.set(-28, 50, 14); this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048); this.sun.shadow.camera.left = -40; this.sun.shadow.camera.right = 40; this.sun.shadow.camera.top = 40; this.sun.shadow.camera.bottom = -40; this.sun.shadow.camera.far = 130; this.sun.shadow.normalBias = .06
    this.scene.add(this.sun, this.land, this.laboratory, this.saucer, this.beam, this.beamLight, this.beamLight.target, this.ghost)
    this.ground = new THREE.Mesh(islandGeometry(), terrainMaterial()); this.ground.receiveShadow = true; this.land.add(this.ground)
    const sea = new THREE.Mesh(new THREE.CircleGeometry(66, 128).rotateX(-Math.PI / 2), this.waterMat); sea.position.y = .03; this.land.add(sea)
    this.trunks.castShadow = this.leaves.castShadow = true; this.leaves.receiveShadow = true; this.trunks.frustumCulled = this.leaves.frustumCulled = false
    this.land.add(this.trunks, this.leaves, this.stumpMesh, this.seedMesh, this.ring, this.familyLines)
    this.seedMesh.count = this.stumpMesh.count = 0
    this.leafMat.onBeforeCompile = shader => {
      shader.uniforms.storyTime = this.scanTime
      shader.vertexShader = 'uniform float storyTime;varying vec3 leafP;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n leafP=position;transformed.x += sin(storyTime*.7+position.y*1.5)*.045*max(0.,position.y-1.);')
      shader.fragmentShader = 'varying vec3 leafP;\n' + shader.fragmentShader.replace('#include <color_fragment>', '#include <color_fragment>\nfloat patch=sin(leafP.x*5.+sin(leafP.z*4.))*sin(leafP.y*4.);diffuseColor.rgb*=.96+smoothstep(-.3,.6,patch)*.08;').replace('#include <opaque_fragment>', 'float rim=pow(1.-max(0.,dot(normal,normalize(vViewPosition))),3.);outgoingLight+=vec3(.12,.11,.055)*rim;\n#include <opaque_fragment>')
    }
    this.ghostLeaves.color.set('#9cb57a')
    this.specimenWood.onBeforeCompile = shader => {
      shader.uniforms.storyTime = this.scanTime
      shader.vertexShader = 'varying float branchY;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nbranchY=position.y;')
      shader.fragmentShader = 'varying float branchY;uniform float storyTime;\n' + shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\nfloat scan=pow(.5+.5*sin(branchY*2.2-storyTime*2.),24.);totalEmissiveRadiance+=vec3(.35,.9,.65)*scan*.8;')
    }
    const platform = new THREE.Mesh(new THREE.CylinderGeometry(6.6, 6.9, .35, 96), new THREE.MeshStandardMaterial({ color: '#35484a', roughness: .7, metalness: .4 })); platform.position.y = -.2; platform.receiveShadow = true; this.laboratory.add(platform, this.specimen)
    for (let i = 0; i < 3; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(3.6 + i * 1.1, .025, 8, 96), new THREE.MeshBasicMaterial({ color: '#a8cbb1' })); r.rotation.x = Math.PI / 2; r.position.y = .02; this.laboratory.add(r) }
    this.laboratory.visible = false
    this.addDetails()
    this.camera.position.set(47, 32, 59)
    this.observer = new ResizeObserver(() => this.resize()); this.observer.observe(host); this.resize()
    this.intersection = new IntersectionObserver(entries => { this.visible = entries[0]?.isIntersecting ?? true }); this.intersection.observe(host)
    canvas.addEventListener('pointermove', this.pointerMove); canvas.addEventListener('pointerdown', this.pointerDown); canvas.addEventListener('pointerup', this.pointerUp); canvas.addEventListener('pointerleave', this.pointerLeave); canvas.addEventListener('webglcontextlost', this.contextLost)
    this.raf = requestAnimationFrame(this.animate)
  }

  private addDetails() {
    const d = new THREE.Object3D(), color = new THREE.Color()
    const stones = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.6, 1), new THREE.MeshStandardMaterial({ color: '#a3a79b', roughness: 1 }), 55)
    const grass = new THREE.InstancedMesh(new THREE.ConeGeometry(.15, .8, 3).translate(0, .4, 0), new THREE.MeshStandardMaterial({ color: '#aeb97d', side: THREE.DoubleSide }), 800)
    let n = 0, k = 0
    for (let i = 0; i < 1600; i++) {
      const x = (hash(i, 11) - .5) * 62, z = (hash(i, 23) - .5) * 60, h = heistHeight(x, z)
      if (h < .8) continue
      d.position.set(x, h, z); d.rotation.set(0, hash(i, 7) * 6, .15); d.scale.setScalar(.5 + hash(i, 6)); d.updateMatrix()
      if (i % 19 === 0 && n < 55) { stones.setMatrixAt(n++, d.matrix) }
      else if (k < 800) { grass.setMatrixAt(k, d.matrix); color.setHSL(.19 + hash(i, 2) * .04, .23, .42 + hash(i, 3) * .18); grass.setColorAt(k++, color) }
    }
    stones.count = n; grass.count = k; stones.castShadow = true; grass.receiveShadow = true; this.land.add(stones, grass)
    const stars = new THREE.BufferGeometry(), p: number[] = []
    for (let i = 0; i < 140; i++) p.push((hash(i, 1) - .5) * 220, 36 + hash(i, 2) * 75, -50 - hash(i, 3) * 75)
    stars.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); this.scene.add(new THREE.Points(stars, new THREE.PointsMaterial({ color: '#d3dfc0', size: .2, transparent: true, opacity: .55 })))
  }

  setFrame(frame: HeistFrame) {
    this.frame = frame
    if (frame.world !== this.lastWorld) { this.syncForest(frame.world); this.lastWorld = frame.world }
    const key = `${frame.iterations}/${frame.angle}`
    if (key !== this.lastSpec) {
      this.specimen.clear(); this.specimenTree?.branches.dispose(); this.specimenTree?.foliage.dispose()
      this.specimenTree = buildTree(frame.iterations, frame.angle)
      const trunk = new THREE.Mesh(this.specimenTree.branches, this.specimenWood), crown = new THREE.Mesh(this.specimenTree.foliage, this.specimenLeaves)
      trunk.castShadow = crown.castShadow = true; this.specimen.add(trunk, crown)
      // Normalize only the specimen display so every grammar fits the scanner.
      const bounds = new THREE.Box3().setFromBufferAttribute(this.specimenTree.branches.getAttribute('position') as THREE.BufferAttribute), size = bounds.getSize(new THREE.Vector3())
      this.specimen.scale.setScalar(7.7 / Math.max(size.y, size.x, size.z)); this.specimen.position.y = .8; this.lastSpec = key
    }
    this.specimen.children[1].visible = !frame.skeleton
    if (this.lastChapter !== frame.chapter) { this.hovered = null; this.callbacks.hover(null); this.lastChapter = frame.chapter }
    this.familyLines.visible = frame.lineage && ['clearing', 'recovery', 'ending'].includes(frame.chapter)
  }

  private syncForest(world: HeistWorld) {
    const d = new THREE.Object3D(), c = new THREE.Color(); this.ids = []
    world.ecology.plants.forEach((p, i) => {
      d.position.set(p.x, heistHeight(p.x, p.z), p.z); d.rotation.set(0, hash(p.id, 4) * 6.28, 0); d.scale.setScalar(p.size * 1.65); d.updateMatrix()
      this.trunks.setMatrixAt(i, d.matrix); this.leaves.setMatrixAt(i, d.matrix)
      c.set(p.species ? '#8f9f68' : '#739778').lerp(new THREE.Color('#c7ab65'), hash(p.id, 6) * .32).multiplyScalar(.7 + p.health * .3)
      this.leaves.setColorAt(i, c); this.ids.push(p.id)
    })
    this.trunks.count = this.leaves.count = world.ecology.plants.length; this.trunks.instanceMatrix.needsUpdate = this.leaves.instanceMatrix.needsUpdate = true; if (this.leaves.instanceColor) this.leaves.instanceColor.needsUpdate = true
    world.cargo.forEach((p, i) => { d.position.set(p.x, heistHeight(p.x, p.z) + .24, p.z); d.rotation.set(0, 0, 0); d.scale.setScalar(1); d.updateMatrix(); this.stumpMesh.setMatrixAt(i, d.matrix) }); this.stumpMesh.count = world.cargo.length; this.stumpMesh.instanceMatrix.needsUpdate = true
    let n = 0
    for (const s of world.seeds) if (s.status === 'waiting') { d.position.set(s.x, Math.max(.05, heistHeight(s.x, s.z)) + .2, s.z); d.rotation.set(0, 0, 0); d.scale.set(1.4, .75, 1); d.updateMatrix(); this.seedMesh.setMatrixAt(n++, d.matrix) }
    this.seedMesh.count = n; this.seedMesh.instanceMatrix.needsUpdate = true
    const lines: number[] = []
    for (const p of world.ecology.plants) {
      if (p.parentId == null) continue
      const mother = [...world.ecology.plants, ...world.cargo].find(q => q.id === p.parentId)
      if (!mother) continue
      const a = new THREE.Vector3(mother.x, Math.max(0, heistHeight(mother.x, mother.z)) + .7, mother.z), b = new THREE.Vector3(p.x, heistHeight(p.x, p.z) + .7, p.z)
      for (let k = 0; k < 12; k++) for (const t of [k / 12, (k + 1) / 12]) { const v = a.clone().lerp(b, t); v.y += Math.sin(t * Math.PI) * 2.2; lines.push(v.x, v.y, v.z) }
    }
    this.familyLines.geometry.dispose(); this.familyLines.geometry = new THREE.BufferGeometry(); this.familyLines.geometry.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3))
    const last = world.cargo.at(-1)
    if (last && last.id !== this.liftedId && this.frame?.chapter === 'collect') {
      this.liftedId = last.id; this.liftStart = this.filmTime; this.ghost.clear()
      this.ghost.add(new THREE.Mesh(this.forestGeometry.branches, this.woodMat), new THREE.Mesh(this.forestGeometry.foliage, this.ghostLeaves)); this.ghost.scale.setScalar(last.size * 1.65)
    }
    if (!world.cargo.length) this.liftedId = null
  }

  private resize() { const w = this.host.clientWidth, h = this.host.clientHeight; if (!w || !h) return; this.renderer.setSize(w, h); this.camera.aspect = w / h; this.camera.updateProjectionMatrix() }
  private hit(event: PointerEvent) { const r = this.renderer.domElement.getBoundingClientRect(); this.pointer.set((event.clientX - r.left) / r.width * 2 - 1, -(event.clientY - r.top) / r.height * 2 + 1); this.ray.setFromCamera(this.pointer, this.camera) }
  private pointerDown = (e: PointerEvent) => { this.down = { x: e.clientX, y: e.clientY } }
  private pointerMove = (e: PointerEvent) => {
    if (!this.frame) return
    this.hit(e)
    if (this.frame.placing) { const hit = this.ray.intersectObject(this.ground)[0]; if (hit) { this.ring.visible = true; this.ring.position.set(hit.point.x, hit.point.y + .12, hit.point.z) }; return }
    if (this.frame.chapter !== 'collect') return
    const hit = this.ray.intersectObjects([this.trunks, this.leaves])[0]
    const id = hit?.instanceId != null ? this.ids[hit.instanceId] : null
    const p = this.frame.world.ecology.plants.find(p => p.id === id)
    const next = p && p.size > .7 ? p.id : null
    if (next !== this.hovered) { this.hovered = next; this.callbacks.hover(next) }
  }
  private pointerUp = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y) > 8 || !this.frame) return
    this.hit(e)
    if (this.frame.placing) { const hit = this.ray.intersectObject(this.ground)[0]; if (hit) this.callbacks.place(hit.point.x, hit.point.z); return }
    if (this.frame.chapter === 'collect') { const hit = this.ray.intersectObjects([this.trunks, this.leaves])[0]; if (hit?.instanceId != null) this.callbacks.select(this.ids[hit.instanceId]) }
  }
  private pointerLeave = () => { this.hovered = null; this.callbacks.hover(null) }
  private contextLost = (e: Event) => { e.preventDefault(); this.callbacks.error('The graphics context was interrupted. Reload this story to start again; your other studies are separate.') }

  private animate = (now: number) => {
    this.raf = requestAnimationFrame(this.animate)
    const dt = Math.min(.05, (now - (this.previous || now)) / 1000); this.previous = now
    const f = this.frame; if (!f || document.hidden || !this.visible) return
    if (!f.paused) this.filmTime += dt
    const t = this.reduced ? 0 : this.filmTime, scanning = f.chapter === 'scan', dawn = ['clearing', 'recovery', 'ending'].includes(f.chapter)
    this.scanTime.value = t; this.waterMat.uniforms.time.value = t; this.beamMat.uniforms.time.value = t
    this.land.visible = !scanning; this.laboratory.visible = scanning
    this.sun.intensity = THREE.MathUtils.lerp(this.sun.intensity, dawn ? 3.6 : scanning ? 2 : 2.5, .035)
    const sky = new THREE.Color(scanning ? '#213337' : dawn ? '#9caeaa' : '#294047'); (this.scene.background as THREE.Color).lerp(sky, .025); (this.scene.fog as THREE.Fog).color.copy(this.scene.background as THREE.Color)
    const mature = f.world.ecology.plants.filter(p => p.size > .7).sort((a, b) => Math.hypot(a.x, a.z) - Math.hypot(b.x, b.z))
    const target = f.world.ecology.plants.find(p => p.id === this.hovered) ?? mature[0]
    const lifted = f.world.cargo.find(p => p.id === this.liftedId), lift = this.reduced ? 2.7 : Math.max(0, this.filmTime - this.liftStart), lifting = f.chapter === 'collect' && !!lifted && lift < 2.7
    const bx = lifting ? lifted!.x : target?.x ?? 0, bz = lifting ? lifted!.z : target?.z ?? 0, by = heistHeight(bx, bz)
    const arrival = f.chapter === 'arrival' ? Math.min(1, f.chapterTime / 7) : 1
    this.saucer.visible = !dawn
    const ship = scanning ? new THREE.Vector3(13, 10, -10) : new THREE.Vector3(bx + (1 - arrival) * 36, 22 + Math.sin(t * .7) * .25, bz - (1 - arrival) * 24)
    this.saucer.position.lerp(ship, this.reduced ? 1 : 1 - Math.exp(-dt * 3)); this.saucer.rotation.z = Math.sin(t * .5) * .025; this.saucer.rotation.y = -.3 + Math.sin(t * .2) * .15
    const lit = ['collect', 'arrival'].includes(f.chapter) && (f.chapter !== 'arrival' || arrival > .6)
    this.beam.visible = lit; this.beamLight.intensity = lit ? 28 : 0; this.beamMat.uniforms.strength.value = lifting ? 1.6 : .7
    this.beam.position.set(this.saucer.position.x, (this.saucer.position.y + by) / 2, this.saucer.position.z); this.beam.scale.y = this.saucer.position.y - by
    this.beamLight.position.copy(this.saucer.position); this.beamLight.target.position.set(bx, by, bz)
    this.ghost.visible = lifting
    if (lifting) { this.ghost.position.set(lifted!.x + Math.sin(t * 15) * .035, heistHeight(lifted!.x, lifted!.z) + 20 * (1 - Math.cos(Math.min(1, lift / 2.7) * Math.PI / 2)), lifted!.z); this.ghost.rotation.y = lift * .9 }
    if (lifting) {
      const d = new THREE.Object3D(), progress = Math.min(1, lift / 2.4); let n = 0
      for (const s of f.world.seeds) if (s.status === 'waiting') {
        const ground = Math.max(.05, heistHeight(s.x, s.z)) + .2
        if (s.parentId === lifted!.id) { d.position.set(THREE.MathUtils.lerp(lifted!.x, s.x, progress), THREE.MathUtils.lerp(by + 6, ground, progress) + Math.sin(progress * Math.PI) * 2, THREE.MathUtils.lerp(lifted!.z, s.z, progress)); d.scale.setScalar(2.2 - progress * .8) }
        else { d.position.set(s.x, ground, s.z); d.scale.set(1.4, .75, 1) }
        d.updateMatrix(); this.seedMesh.setMatrixAt(n++, d.matrix)
      }
      this.seedMesh.instanceMatrix.needsUpdate = true
    }
    if (!f.placing) { this.ring.visible = f.chapter === 'collect' && !!target; if (target) this.ring.position.set(target.x, heistHeight(target.x, target.z) + .08, target.z) }
    this.specimen.rotation.y = this.reduced ? .3 : t * .14
    let pos = new THREE.Vector3(44, 32, 53), aim = new THREE.Vector3(0, 3, 0)
    if (scanning) { pos.set(13, 10.5, 17); aim.set(0, 4.5, 0) }
    else if (f.chapter === 'arrival') { const a = this.reduced ? 1 : arrival; pos.set(32 + a * 12, 8 + a * 24, 42 + a * 11); aim.set(0, 5 + Math.sin(a * Math.PI) * 7, 0) }
    else if (f.chapter === 'clearing') { pos.set(22, 14, 32); aim.set(0, 2, 0) }
    else if (f.chapter === 'ending') { pos.set(54, 48, 65); aim.set(0, 2, 0) }
    if (lifting && f.view === 'director') { pos.set(bx + 30, 24, bz + 37); aim.set(bx, 9, bz) }
    if (f.view === 'ground') { pos.set(scanning ? 11 : 21, scanning ? 5 : 7, scanning ? 14 : 28); aim.set(0, scanning ? 4 : 3, 0) }
    if (f.view === 'above') { pos.set(scanning ? 2 : 5, scanning ? 23 : 65, scanning ? 6 : 18); aim.set(0, 1, 0) }
    if (this.camera.aspect < 1) { pos.sub(aim).multiplyScalar(1.3).add(aim) }
    const smooth = this.reduced ? 1 : 1 - Math.exp(-dt * 2.1)
    this.camera.position.lerp(pos, smooth); this.look.lerp(aim, smooth); this.camera.lookAt(this.look)
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    cancelAnimationFrame(this.raf); this.observer.disconnect(); this.intersection.disconnect()
    const c = this.renderer.domElement; c.removeEventListener('pointermove', this.pointerMove); c.removeEventListener('pointerdown', this.pointerDown); c.removeEventListener('pointerup', this.pointerUp); c.removeEventListener('pointerleave', this.pointerLeave); c.removeEventListener('webglcontextlost', this.contextLost)
    this.sun.shadow.dispose(); disposeScene(this.scene); this.specimenWood.dispose(); this.specimenLeaves.dispose(); this.ghostLeaves.dispose(); this.renderer.dispose(); c.remove()
  }
}
