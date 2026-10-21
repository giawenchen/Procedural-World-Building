import * as THREE from 'three'
import { launchSeed, stepSeedJourney, walkStep, seedChecks } from './worldJourney'
import type { SeedJourney } from './worldJourney'
import type { Ecology, Habitat } from './worldSystems'

export type PerspectiveMode = 'orbit' | 'seed' | 'explore'
export type PerspectiveHud = { stage: string; text: string; height: number; size: number; health: number; moisture: number; parent: boolean; checks: ReturnType<typeof seedChecks>; germination: number; offspring: number; state: SeedJourney['stage'] }
export const emptyPerspectiveHud: PerspectiveHud = { stage: 'Airborne', text: '', height: 0, size: 0, health: 1, moisture: 0, parent: true, checks: [], germination: 0, offspring: 0, state: 'airborne' }

export class LivingPerspectives {
  mode: PerspectiveMode = 'orbit'
  seed: SeedJourney | null = null
  private held = new Set<string>()
  private yaw = 0
  private pitch = -.12
  private walker = { x: 0, z: 0 }
  private dragging: number | null = null
  private pointer = { x: 0, y: 0 }
  private blocked = false
  private orb: THREE.Mesh
  private ring: THREE.Mesh
  private direction = new THREE.Vector3()
  private releaseHeight = 10
  private camera: THREE.PerspectiveCamera
  private canvas: HTMLCanvasElement
  private ecology: Ecology
  private habitat: Habitat
  private isActive: () => boolean
  private exit: () => void
  constructor(camera: THREE.PerspectiveCamera, canvas: HTMLCanvasElement,
    scene: THREE.Scene, ecology: Ecology, habitat: Habitat,
    isActive: () => boolean, exit: () => void) {
    this.camera=camera;this.canvas=canvas;this.ecology=ecology;this.habitat=habitat;this.isActive=isActive;this.exit=exit
    this.orb = new THREE.Mesh(new THREE.SphereGeometry(.45, 10, 8), new THREE.MeshBasicMaterial({ color: '#f1d591' }))
    this.ring = new THREE.Mesh(new THREE.RingGeometry(1.7, 2, 40), new THREE.MeshBasicMaterial({ color: '#e5c476', side: THREE.DoubleSide, depthTest: false }))
    this.ring.rotation.x = -Math.PI / 2; this.ring.renderOrder = 3; this.orb.visible = this.ring.visible = false; scene.add(this.orb, this.ring)
    canvas.addEventListener('keydown', this.down); canvas.addEventListener('keyup', this.up)
    canvas.addEventListener('pointerdown', this.pointerDown); canvas.addEventListener('pointermove', this.pointerMove)
    canvas.addEventListener('pointerup', this.pointerUp); canvas.addEventListener('pointercancel', this.pointerUp)
    canvas.addEventListener('blur', this.clear); window.addEventListener('blur', this.clear); document.addEventListener('visibilitychange', this.clear)
  }
  setReleaseHeight(height: number) { this.releaseHeight = height }
  suspend() { this.clear() }
  setMode(mode: PerspectiveMode, newSeed = false) {
    this.clear(); this.mode = mode; this.blocked = false
    this.camera.fov = mode === 'orbit' ? 43 : 65; this.camera.updateProjectionMatrix()
    if (mode === 'seed') {
      if (!this.seed || newSeed) { this.seed = launchSeed(this.ecology, this.habitat, this.releaseHeight); this.yaw = -.7; this.pitch = -.22 }
    } else if (mode === 'explore') {
      const near = this.seed && this.habitat(this.seed.x, this.seed.z).height > 3 ? this.seed : this.ecology.plants.slice().sort((a,b) => a.x*a.x+a.z*a.z-b.x*b.x-b.z*b.z)[0]
      this.walker = { x: near?.x ?? 0, z: near?.z ?? 0 }; this.yaw = -.7; this.pitch = -.06
    }
    this.canvas.dataset.viewpoint = mode
    this.canvas.setAttribute('aria-label', mode === 'orbit'
      ? 'Living coast. Drag to orbit; F toggles wireframe; Space pauses.'
      : `${mode === 'seed' ? 'Seed journey. WASD nudges drift before landing.' : 'Forest walk. WASD moves; Shift moves faster.'} Arrow keys or drag to look; Space pauses the world; Escape leaves this view.`)
    if (mode !== 'orbit') this.canvas.focus({ preventScroll: true })
  }
  private down = (event: KeyboardEvent) => {
    if (this.mode === 'orbit' || !this.isActive() || event.metaKey || event.ctrlKey || event.altKey) return
    if (event.code === 'Escape') { event.preventDefault(); this.exit(); return }
    if (['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(event.code)) { event.preventDefault(); this.held.add(event.code) }
  }
  private up = (event: KeyboardEvent) => { this.held.delete(event.code) }
  private pointerDown = (event: PointerEvent) => {
    if (this.mode === 'orbit' || !this.isActive()) return
    this.canvas.focus({ preventScroll: true }); this.dragging = event.pointerId; this.pointer = { x: event.clientX, y: event.clientY }; this.canvas.setPointerCapture(event.pointerId)
  }
  private pointerMove = (event: PointerEvent) => {
    if (this.mode === 'orbit' || this.dragging !== event.pointerId || !this.isActive()) return
    this.yaw -= (event.clientX - this.pointer.x) * .004
    this.pitch = THREE.MathUtils.clamp(this.pitch - (event.clientY - this.pointer.y) * .004, -1.25, 1.1)
    this.pointer = { x: event.clientX, y: event.clientY }
  }
  private pointerUp = () => { this.dragging = null }
  private clear = () => { this.held.clear(); this.dragging = null }
  private input() { return { forward: Number(this.held.has('KeyW')) - Number(this.held.has('KeyS')), right: Number(this.held.has('KeyD')) - Number(this.held.has('KeyA')), yaw: this.yaw } }
  tick(dt: number, sea: number, wind: { x: number; z: number }) {
    if (!this.seed) return
    const input = this.mode === 'seed' ? this.input() : { forward: 0, right: 0, yaw: this.yaw }
    stepSeedJourney(this.seed, this.ecology, this.habitat, dt, sea, wind, input)
  }
  draw(dt: number, sea: number) {
    if (!this.isActive() || document.hidden) { this.clear(); return }
    if (this.mode !== 'orbit') {
      this.yaw += (Number(this.held.has('ArrowLeft')) - Number(this.held.has('ArrowRight'))) * dt * 1.4
      this.pitch = THREE.MathUtils.clamp(this.pitch + (Number(this.held.has('ArrowUp')) - Number(this.held.has('ArrowDown'))) * dt, -1.25, 1.1)
      if (this.mode === 'explore') {
        const next = walkStep(this.walker, this.habitat, sea, dt, this.input(), this.held.has('ShiftLeft') || this.held.has('ShiftRight'))
        this.walker = next; this.blocked = next.blocked
        this.camera.position.set(next.x, Math.max(sea, this.habitat(next.x, next.z).height) + 2.4, next.z)
      } else if (this.seed) {
        const p = this.ecology.plants.find(p => p.id === this.seed?.plantId)
        const y = this.seed.stage === 'rooted' && p ? this.habitat(p.x,p.z).height + .65 + p.size * 9 : this.seed.y + .65
        this.camera.position.set(this.seed.x, Math.max(sea + .4, y), this.seed.z)
      }
      this.direction.set(-Math.sin(this.yaw)*Math.cos(this.pitch), Math.sin(this.pitch), -Math.cos(this.yaw)*Math.cos(this.pitch))
      this.camera.lookAt(this.camera.position.clone().add(this.direction))
    }
    const seed = this.seed
    this.orb.visible = !!seed && seed.stage === 'airborne' && this.mode !== 'seed'
    this.ring.visible = !!seed && seed.stage !== 'airborne' && this.mode !== 'seed'
    if (seed) { this.orb.position.set(seed.x, seed.y, seed.z); this.ring.position.set(seed.x, Math.max(sea, this.habitat(seed.x,seed.z).height)+.2, seed.z);(this.ring.material as THREE.MeshBasicMaterial).color.set(seed.stage==='lost'?'#b27156':seed.stage==='rooted'?'#799c66':'#e5c476') }
    // Inspectable camera coordinates also make keyboard regression checks possible.
    this.canvas.dataset.position = this.camera.position.toArray().map(v=>v.toFixed(2)).join(',')
    this.canvas.dataset.heading = this.yaw.toFixed(3)
  }
  hiddenPlantId() { return this.mode === 'seed' && this.seed?.stage === 'rooted' ? this.seed.plantId : null }
  hud(sea: number): PerspectiveHud {
    if (this.mode === 'explore') {
      const h=this.habitat(this.walker.x,this.walker.z)
      return { ...emptyPerspectiveHud, stage: 'Forest walk', height: 2.4, moisture: h.moisture, text: this.blocked ? 'Water or steep ground ahead. Find another way.' : 'Move through the same forest while its ecology unfolds.' }
    }
    const seed=this.seed
    if (!seed) return emptyPerspectiveHud
    const h=this.habitat(seed.x,seed.z), p=this.ecology.plants.find(p=>p.id===seed.plantId)
    const offspring=p?this.ecology.plants.filter(q=>q.parentId===p.id).length:0
    return { stage: seed.stage === 'airborne' ? 'Airborne' : seed.stage === 'lost' ? (seed.plantId===null?'Unable to establish':'This tree did not survive') : seed.stage==='waiting'?'Waiting for a home':seed.stage==='germinating'?'Germinating':offspring?'A new generation':p && p.size > .7 ? 'Growing tree' : 'Taking root', text: seed.reason, height: Math.max(0,this.camera.position.y-Math.max(sea,h.height)), size: p?.size ?? 0, health: p?.health ?? (seed.stage==='lost'?0:1), moisture: h.moisture, parent: seed.parentId !== null, state: seed.stage, checks:seedChecks(seed,this.ecology,this.habitat,sea), germination: Math.min(1,seed.germination/2),offspring }
  }
  dispose() {
    this.clear(); this.canvas.removeEventListener('keydown',this.down); this.canvas.removeEventListener('keyup',this.up)
    this.canvas.removeEventListener('pointerdown',this.pointerDown); this.canvas.removeEventListener('pointermove',this.pointerMove)
    this.canvas.removeEventListener('pointerup',this.pointerUp); this.canvas.removeEventListener('pointercancel',this.pointerUp)
    this.canvas.removeEventListener('blur',this.clear); window.removeEventListener('blur',this.clear); document.removeEventListener('visibilitychange',this.clear)
  }
}
