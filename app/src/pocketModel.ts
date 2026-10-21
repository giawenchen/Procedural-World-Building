import { makeLayer } from './noiseEngine.ts'
import { heightAt, climateAt, clamp, random } from './worldSystems.ts'

export const POCKET_SEED = 17
export const GRID = 41
export const EXTENT = 80
export const CELL = EXTENT * 2 / (GRID - 1)
export type Wind = { x: number; z: number }
export type PocketPlant = { id: number; x: number; z: number; size: number; health: number; age: number; species: number }
export type FlyingSeed = { id: number; x: number; z: number; y: number; life: number; species: number }
export type SeedFocus = {
  id: number; x: number; z: number; y: number; plantId?: number;
  stage: 'flight' | 'waiting' | 'rooted' | 'lost'; reason: string;
  path: { x: number; y: number; z: number }[];
}
type WaitingSeed = { id: number; x: number; z: number; species: number; expires: number }
export type PocketState = {
  time: number; wind: Wind; current: Wind; gust: number; rain: number; moisture: Float32Array;
  heights: Float32Array; plants: PocketPlant[]; seeds: FlyingSeed[]; births: number; losses: number;
  nextId: number; nextRelease: number; rng: () => number; message: string; messageUntil: number;
  nextSeedId: number; waiting: WaitingSeed[]; focus: SeedFocus | null;
}
const layers = [{ ...makeLayer(1), name: 'Base terrain', weight: 1 }]
export const pocketHeight = (x: number, z: number) => heightAt(layers, null, x, z, .85)
export const gridIndex = (x: number, z: number) => Math.round(clamp((z + EXTENT) / CELL, 0, GRID - 1)) * GRID + Math.round(clamp((x + EXTENT) / CELL, 0, GRID - 1))
export function pocketHabitat(s: PocketState, x: number, z: number) {
  const height = pocketHeight(x, z)
  const slope = Math.hypot(pocketHeight(x + .5, z) - pocketHeight(x - .5, z), pocketHeight(x, z + .5) - pocketHeight(x, z - .5))
  return { height, slope, ...climateAt(x, z, height, { temperature: .77, moisture: .48 }), moisture: s.moisture[gridIndex(x, z)] }
}
export function createPocket(): PocketState {
  const heights = new Float32Array(GRID * GRID), moisture = new Float32Array(GRID * GRID)
  for (let i = 0; i < heights.length; i++) {
    const x = i % GRID * CELL - EXTENT, z = Math.floor(i / GRID) * CELL - EXTENT
    heights[i] = pocketHeight(x, z)
    moisture[i] = clamp(.42 + Math.sin(z * .045 + x * .013) * .13 - Math.max(0, heights[i]) * .005, .22, .65)
  }
  const s: PocketState = { time: 0, wind: { x: .15, z: 0 }, current: { x: .06, z: 0 }, gust: 0, rain: 0, moisture, heights, plants: [], seeds: [], births: 0, losses: 0, nextId: 0, nextRelease: 2, nextSeedId: 0, waiting: [], focus: null, rng: random(POCKET_SEED), message: 'Follow a seed. Find its place in the world.', messageUntil: 0 }
  for (let z = -48; z <= 48; z += 9) for (let x = -48; x <= 48; x += 9) {
    const px = x + (s.rng() - .5) * 5, pz = z + (s.rng() - .5) * 5, h = pocketHabitat(s, px, pz)
    if (s.rng() > .69 || h.height < 2 || h.slope > .9 || h.height > 22) continue
    s.plants.push({ id: s.nextId++, x: px, z: pz, age: 12, size: .65 + s.rng() * .3, health: 1, species: s.rng() > .68 ? 1 : 0 })
  }
  return s
}
export function tell(s: PocketState, text: string) { s.message = text; s.messageUntil = s.time + 5 }
export function blow(s: PocketState, strength = 1) {
  s.gust = clamp(s.gust + strength * 2.5, 0, 3.5)
  releaseSeeds(s, true)
  tell(s, 'A gust carries seeds beyond the parent trees.')
}
export function shower(s: PocketState) { s.rain = 1; tell(s, 'Rain soaks the soil. Wetter ground can welcome a seed.') }
export function plantAt(s: PocketState, x: number, z: number, species = 0, tracked = true, seedId?: number): boolean {
  if (!Number.isFinite(x + z) || Math.abs(x) > 73 || Math.abs(z) > 73) return false
  if (tracked && (seedId === undefined || s.focus?.id !== seedId)) s.focus = { id: seedId ?? s.nextSeedId++, x, z, y: pocketHeight(x, z) + .6, stage: 'waiting', reason: '', path: [] }
  const reject = (reason: string) => { tell(s, reason); if (tracked && s.focus) { s.focus.stage = 'lost'; s.focus.reason = reason } return false }
  const h = pocketHabitat(s, x, z)
  if (h.height < 1.1) return reject('Water carried it away. Try another breeze.')
  if (h.slope > 1.1 || h.temperature < .2) return reject('Too steep or cold. A different landing may help.')
  if (s.plants.length >= 130 || s.plants.some(p => Math.hypot(x - p.x, z - p.z) < 3.5)) return reject('Too close to other roots. Try an open clearing.')
  if (h.moisture < .32) {
    const id = seedId ?? s.focus?.id ?? s.nextSeedId++
    const existing = s.waiting.find(seed => Math.hypot(seed.x - x, seed.z - z) < 2)
    if (existing && tracked && s.focus) { s.focus.id = existing.id; s.focus.x = existing.x; s.focus.z = existing.z }
    else if (!existing && s.waiting.length < 60) s.waiting.push({ id, x, z, species, expires: s.time + 60 })
    else if (!existing) return reject('Too many waiting seeds. Give this ground some time.')
    if (tracked && s.focus) { s.focus.stage = 'waiting'; s.focus.reason = 'Dry soil. Bring rain to this waiting seed.' }
    tell(s, 'Dry soil. Bring rain to this waiting seed.'); return false
  }
  s.plants.push({ id: s.nextId++, x, z, size: .12, health: 1, age: 0, species }); s.births++
  if (tracked && s.focus) { s.focus.stage = 'rooted'; s.focus.plantId = s.nextId - 1; s.focus.reason = '' }
  tell(s, 'A seed takes root: water, warmth and room to grow.')
  return true
}
export function releaseSeeds(s: PocketState, follow = false) {
  const mature = s.plants.filter(p => p.size > .65 && p.health > .6)
  mature.sort((a, b) => a.x * a.x + a.z * a.z - b.x * b.x - b.z * b.z)
  for (let n = 0; n < Math.min(10, mature.length); n++) {
    if (s.seeds.length >= 60) break
    const p = mature[follow && n === 0 ? 0 : Math.floor(s.rng() * mature.length)]
    const seed = { id: s.nextSeedId++, x: p.x, z: p.z, y: pocketHeight(p.x, p.z) + 6, life: 20, species: p.species }
    s.seeds.push(seed)
    if (follow && n === 0) s.focus = { ...seed, stage: 'flight', reason: '', path: [{ x: seed.x, y: seed.y, z: seed.z }] }
  }
}
// Fixed-step teaching model: prescribed wind, lagged surface current, downhill
// moisture transfer, and wind-borne seeds. This is not a coupled CFD solver.
export function stepPocket(s: PocketState, dt: number, target: Wind) {
  dt = clamp(dt, 0, .1); s.time += dt
  const tx = Number.isFinite(target.x) ? clamp(target.x, -1, 1) : 0, tz = Number.isFinite(target.z) ? clamp(target.z, -1, 1) : 0
  const length = Math.hypot(tx, tz), dir = length > .08 ? { x: tx / length, z: tz / length } : { x: .9, z: -.35 }
  const force = Math.min(1, length) * 2.4 + s.gust
  const blend = 1 - Math.exp(-dt * 2.4)
  s.wind.x += (dir.x * force - s.wind.x) * blend; s.wind.z += (dir.z * force - s.wind.z) * blend
  s.current.x += (s.wind.x * .32 - s.current.x) * (1 - Math.exp(-dt * .5)); s.current.z += (s.wind.z * .32 - s.current.z) * (1 - Math.exp(-dt * .5))
  s.gust *= Math.exp(-dt * .5); s.rain = Math.max(0, s.rain - dt * .12)
  const delta = new Float32Array(s.moisture.length)
  for (let i = 0; i < s.moisture.length; i++) {
    if (s.heights[i] < 0) continue
    delta[i] += dt * (s.rain * .085 - .0018 - Math.hypot(s.wind.x, s.wind.z) * .0003)
    const row = Math.floor(i / GRID), col = i % GRID
    let lower = i
    for (const j of [col > 0 ? i - 1 : i, col < GRID - 1 ? i + 1 : i, row > 0 ? i - GRID : i, row < GRID - 1 ? i + GRID : i]) if (s.heights[j] < s.heights[lower]) lower = j
    if (lower !== i && s.moisture[i] > .6) {
      const flow = Math.min(s.moisture[i] - .6, .045 * dt * (s.heights[i] - s.heights[lower]))
      delta[i] -= flow
      if (s.heights[lower] >= 0) delta[lower] += flow
    }
  }
  for (let i = 0; i < s.moisture.length; i++) s.moisture[i] = clamp(s.moisture[i] + delta[i], .05, 1)
  const landed: FlyingSeed[] = []
  s.seeds = s.seeds.filter(seed => {
    seed.x += s.wind.x * dt * 2.7; seed.z += s.wind.z * dt * 2.7; seed.life -= dt; seed.y -= dt * 1.1
    if (s.focus?.id === seed.id) {
      Object.assign(s.focus, { x: seed.x, y: seed.y, z: seed.z })
      const last = s.focus.path.at(-1)
      if (!last || Math.hypot(seed.x - last.x, seed.y - last.y, seed.z - last.z) > .35) {
        s.focus.path.push({ x: seed.x, y: seed.y, z: seed.z }); if (s.focus.path.length > 96) s.focus.path.shift()
      }
    }
    if (seed.life <= 0 || Math.abs(seed.x) > 78 || Math.abs(seed.z) > 78) {
      if (s.focus?.id === seed.id) { s.focus.stage = 'lost'; s.focus.reason = 'Beyond the island. Try a gentler breeze.' }
      return false
    }
    if (seed.y <= Math.max(0, pocketHeight(seed.x, seed.z)) + .3) { landed.push(seed); return false }
    return true
  })
  for (const seed of landed) {
    // Failed airborne seeds do not interrupt an explicit visitor action's explanation.
    const oldMessage = s.message, oldUntil = s.messageUntil
    const tracked = s.focus?.id === seed.id
    if (!plantAt(s, seed.x, seed.z, seed.species, tracked, seed.id) && !tracked) { s.message = oldMessage; s.messageUntil = oldUntil }
    if (tracked && (Math.abs(seed.x) > 73 || Math.abs(seed.z) > 73)) { s.focus!.stage = 'lost'; s.focus!.reason = 'Beyond the island. Try a gentler breeze.' }
  }
  s.waiting = s.waiting.filter(seed => {
    const tracked = s.focus?.id === seed.id
    if (seed.expires <= s.time) { if (tracked) { s.focus!.stage = 'lost'; s.focus!.reason = 'No rain arrived in time. Try a new seed.' } return false }
    if (s.moisture[gridIndex(seed.x, seed.z)] < .32) return true
    const oldMessage = s.message, oldUntil = s.messageUntil
    plantAt(s, seed.x, seed.z, seed.species, tracked, seed.id)
    if (!tracked) { s.message = oldMessage; s.messageUntil = oldUntil }
    return false
  })
  if (s.time >= s.nextRelease) { if (Math.hypot(s.wind.x, s.wind.z) > .8) releaseSeeds(s); s.nextRelease = s.time + 3 }
  for (const p of s.plants) {
    const h = pocketHabitat(s, p.x, p.z), neighbors = s.plants.filter(q => q.id !== p.id && Math.hypot(q.x - p.x, q.z - p.z) < 8).length
    p.age += dt
    p.health = clamp(p.health + dt * (h.moisture > .23 ? .04 : -.08))
    p.size = clamp(p.size + dt * .024 * p.health * clamp((h.moisture - .18) * 3) / (1 + neighbors * .35), .1, 1.2)
  }
  const count = s.plants.length; s.plants = s.plants.filter(p => p.health > .01); s.losses += count - s.plants.length
  if (s.focus?.stage === 'rooted' && !s.plants.some(p => p.id === s.focus!.plantId)) { s.focus.stage = 'lost'; s.focus.reason = 'The soil dried out. This seedling could not survive.' }
}

export function seedStory(s: PocketState) {
  const f = s.focus
  if (!f) return { step: 0, title: 'Every forest begins somewhere.', caption: 'Make a breeze. Follow one golden seed.' }
  if (f.stage === 'flight') return { step: 0, title: 'A little wind. A new beginning.', caption: 'The golden trail follows this seed through the air.' }
  if (f.stage === 'waiting') return { step: 1, title: 'A place to land. A little rain.', caption: f.reason }
  if (f.stage === 'lost') return { step: 1, title: 'Not every seed finds a home.', caption: f.reason }
  const plant = s.plants.find(p => p.id === f.plantId)
  return { step: 2, title: 'Room for one more life.', caption: plant && plant.size > .4 ? 'Water supports growth. Nearby roots share the space.' : 'This seed took root. Watch the ring for new growth.' }
}
// Screen-relative tilt with neutral calibration; no absolute compass required.
export function tiltVector(beta: number, gamma: number, neutralBeta: number, neutralGamma: number, angle = 0): Wind {
  if (![beta, gamma, neutralBeta, neutralGamma, angle].every(Number.isFinite)) return { x: 0, z: 0 }
  const x = clamp((gamma - neutralGamma) / 28, -1, 1), z = clamp((beta - neutralBeta) / 28, -1, 1), a = angle * Math.PI / 180
  return { x: x * Math.cos(a) + z * Math.sin(a), z: z * Math.cos(a) - x * Math.sin(a) }
}
