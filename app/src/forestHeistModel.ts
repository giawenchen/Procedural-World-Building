import { clamp, hash, seedEcology, stepEcology } from './worldSystems.ts'
import type { Ecology, Habitat, Plant } from './worldSystems.ts'

export type HeistChapter = 'invitation' | 'arrival' | 'collect' | 'scan' | 'clearing' | 'recovery' | 'ending'
export type FieldSeed = { id: number; parentId: number; x: number; z: number; age: number; status: 'waiting' | 'rooted' | 'lost'; reason: string; plantId: number | null }
export type HeistWorld = { ecology: Ecology; cargo: Plant[]; seeds: FieldSeed[]; initialCount: number }
export type ReturnSite = { id: number; x: number; z: number }
export const HEIST_LIMIT = 3
export const RECOVERY_SECONDS = 40

// A small, fixed teaching island. The renderer samples this exact height field.
export function heistHeight(x: number, z: number) {
  const r = Math.hypot(x / 1.05, z)
  const hill = 1.4 * Math.exp(-((x + 10) ** 2 + (z + 5) ** 2) / 170)
  const pond = 3.8 * Math.exp(-((x - 16) ** 2 + (z - 5) ** 2) / 33)
  return 2.1 + hill + .38 * Math.sin(x * .21) * Math.cos(z * .19) - pond - Math.max(0, r - 22) * .6
}
export const heistHabitat: Habitat = (x, z) => {
  const h = heistHeight(x, z), e = .15
  const dx = (heistHeight(x + e, z) - heistHeight(x - e, z)) / (2 * e)
  const dz = (heistHeight(x, z + e) - heistHeight(x, z - e)) / (2 * e)
  return { height: h, slope: Math.hypot(dx, dz), moisture: clamp(.67 - .5 * Math.exp(-((x + 18) ** 2 + (z - 8) ** 2) / 60)), temperature: .72 }
}

export function makeHeistWorld(): HeistWorld {
  const ecology = seedEcology(heistHabitat, 71, 1)
  ecology.plants.forEach(p => {
    p.size = p.id % 4 === 0 ? .35 : .84 + hash(p.id, 9) * .21
    p.age = p.size < .7 ? 2 : 12
  })
  return { ecology, cargo: [], seeds: [], initialCount: ecology.plants.length }
}

export function cloneHeist(world: HeistWorld): HeistWorld {
  return { ...world, ecology: { ...world.ecology, plants: world.ecology.plants.map(p => ({ ...p })) }, cargo: world.cargo.map(p => ({ ...p })), seeds: world.seeds.map(s => ({ ...s })) }
}

export function collectTree(world: HeistWorld, id: number): boolean {
  const p = world.ecology.plants.find(p => p.id === id)
  if (!p || p.size <= .7 || world.cargo.length >= HEIST_LIMIT) return false
  world.cargo.push({ ...p })
  world.ecology.plants = world.ecology.plants.filter(p => p.id !== id)
  // The fictional beam shakes loose a finite, visible seed cohort before removal.
  // Abduction is relocation, not an ecological death or a new birth.
  for (let i = 0; i < 7; i++) {
    const a = hash(id + 1, i + 12) * Math.PI * 2, r = 2.8 + hash(i + 2, id + 18) * 6
    world.seeds.push({ id: world.seeds.length, parentId: id, x: p.x + Math.cos(a) * r, z: p.z + Math.sin(a) * r, age: 0, status: 'waiting', reason: 'Waiting for suitable ground and space.', plantId: null })
  }
  return true
}

export function returnSiteReason(world: HeistWorld, x: number, z: number) {
  const h = heistHabitat(x, z)
  if (h.height < 1.3) return 'That is water or shoreline. Choose higher ground.'
  if (h.slope > .85) return 'That slope is too steep. Try the clearing.'
  if (h.moisture < .24) return 'That patch is too dry. Try greener ground.'
  if (world.ecology.plants.some(p => Math.hypot(p.x - x, p.z - z) < 2.5)) return 'Another tree is too close. Leave a little room.'
  return ''
}

export function placeMother(world: HeistWorld, site: ReturnSite): boolean {
  const p = world.cargo.find(p => p.id === site.id)
  if (!p || returnSiteReason(world, site.x, site.z)) return false
  world.ecology.plants.push({ ...p, x: site.x, z: site.z })
  world.cargo = world.cargo.filter(q => q.id !== site.id)
  return true
}

export function stepHeist(world: HeistWorld, dt: number) {
  stepEcology(world.ecology, heistHabitat, dt, 0, 1.3, .85, 7, 3.6)
  for (const s of world.seeds) {
    if (s.status !== 'waiting') continue
    s.age += dt
    const h = heistHabitat(s.x, s.z)
    const crowded = world.ecology.plants.some(p => Math.hypot(p.x - s.x, p.z - s.z) < 2.5)
    const suitable = h.height > 1.3 && h.slope <= .85 && h.moisture >= .24 && h.temperature > .15
    s.reason = h.height <= 1.3 ? 'Water or shoreline.' : h.moisture < .24 ? 'Ground too dry.' : h.slope > .85 ? 'Slope too steep.' : crowded ? 'Too close to another tree.' : 'Suitable ground. Germinating.'
    if (s.age >= 2.5 && suitable && !crowded && world.ecology.plants.length < 300) {
      s.status = 'rooted'; s.plantId = world.ecology.nextId++
      const parent = world.cargo.find(p => p.id === s.parentId) || world.ecology.plants.find(p => p.id === s.parentId)
      world.ecology.plants.push({ id: s.plantId, x: s.x, z: s.z, age: 0, size: .12, health: 1, species: parent?.species ?? 0, lastSeed: world.ecology.time, parentId: s.parentId })
      world.ecology.births++
      s.reason = 'A real new plant, with a recorded parent.'
    } else if (s.age >= 14) { s.status = 'lost'; s.reason += ' This seed cohort expired.' }
  }
}

// Always replay from the same checkpoint at a fixed step, including slider rewinds.
export function recoverHeist(checkpoint: HeistWorld, seconds: number, returned: ReturnSite | null = null): HeistWorld {
  const world = cloneHeist(checkpoint)
  if (returned) placeMother(world, returned)
  const end = clamp(seconds, 0, RECOVERY_SECONDS), fullSteps = Math.floor(end * 10 + 1e-7)
  for (let i = 0; i < fullSteps; i++) stepHeist(world, .1)
  const remainder = end - fullSteps * .1
  if (remainder > 1e-7) stepHeist(world, remainder)
  return world
}

// Cache immutable 0.1 s states so forward playback does not replay its whole past.
// A rewind selects the same state; the visitor's checkpoint is never modified.
export function createHeistTimeline(checkpoint: HeistWorld, returned: ReturnSite | null = null) {
  const initial = cloneHeist(checkpoint)
  if (returned) placeMother(initial, returned)
  const frames = [initial]
  return (seconds: number) => {
    const index = Math.round(clamp(seconds, 0, RECOVERY_SECONDS) * 10)
    while (frames.length <= index) { const next = cloneHeist(frames[frames.length - 1]); stepHeist(next, .1); frames.push(next) }
    return frames[index]
  }
}

export function heistMetrics(world: HeistWorld) {
  return { living: world.ecology.plants.length, births: world.ecology.births, deaths: world.ecology.deaths, rooted: world.seeds.filter(s => s.status === 'rooted').length, lost: world.seeds.filter(s => s.status === 'lost').length, waiting: world.seeds.filter(s => s.status === 'waiting').length, mature: world.ecology.plants.filter(p => p.size > .7 && p.health > .65).length }
}
