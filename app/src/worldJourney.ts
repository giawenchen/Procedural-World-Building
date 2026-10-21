import { clamp } from './worldSystems.ts'
import type { Ecology, Habitat } from './worldSystems.ts'

export type SeedJourney = {
  x: number; y: number; z: number; vx: number; vz: number;
  age: number; species: number; parentId: number | null; plantId: number | null;
  stage: 'airborne' | 'waiting' | 'germinating' | 'rooted' | 'lost'; reason: string;
  germination: number;
}
export type JourneyInput = { forward: number; right: number; yaw: number }

// These are model thresholds for a terrestrial tree, not universal seed biology.
export function seedSite(h: ReturnType<Habitat>, sea: number) {
  if (h.height < sea) return { ready: false, code: 'water', reason: 'Under water. This land-tree seed cannot root here.' }
  if (h.height < sea + 1.3) return { ready: false, code: 'shore', reason: 'Waiting for exposed ground. The tide is too close.' }
  if (h.slope > .85) return { ready: false, code: 'slope', reason: 'This slope is too steep for roots. Try a gentler landing.' }
  if (h.moisture < .24) return { ready: false, code: 'dry', reason: 'Waiting for moisture. Raise Moisture; this seed stays in place.' }
  if (h.temperature <= .15) return { ready: false, code: 'cold', reason: 'Waiting for warmth. Raise Temperature without restarting.' }
  return { ready: true, code: 'ready', reason: 'Ground and climate allow germination.' }
}

export function seedChecks(seed: SeedJourney, ecology: Ecology, habitat: Habitat, sea: number) {
  const h = habitat(seed.x, seed.z)
  const nearest = ecology.plants.filter(p => p.id !== seed.plantId).reduce((d,p)=>Math.min(d,Math.hypot(p.x-seed.x,p.z-seed.z)),Infinity)
  return [
    { label: 'Dry-ground clearance', value: `${(h.height-sea).toFixed(1)} / 1.3 u`, pass: h.height >= sea+1.3 },
    { label: 'Slope', value: `${h.slope.toFixed(2)} / max 0.85`, pass: h.slope <= .85 },
    { label: 'Moisture', value: `${Math.round(h.moisture*100)}% / min 24%`, pass: h.moisture >= .24 },
    { label: 'Temperature', value: `${h.temperature.toFixed(2)} / above 0.15`, pass: h.temperature > .15 },
    { label: 'Nearest other root', value: Number.isFinite(nearest)?`${nearest.toFixed(1)} / min 2.5 u`:'Open ground', pass: nearest >= 2.5 },
    { label: 'Population capacity', value: `${ecology.plants.length} / 300`, pass: seed.plantId !== null || ecology.plants.length < 300 },
  ]
}

// Steering is an explicit visitor intervention, not a claim that a seed chooses a home.
export function movement(input: JourneyInput) {
  const length = Math.max(1, Math.hypot(input.forward, input.right))
  return {
    x: (-Math.sin(input.yaw) * input.forward + Math.cos(input.yaw) * input.right) / length,
    z: (-Math.cos(input.yaw) * input.forward - Math.sin(input.yaw) * input.right) / length,
  }
}

export function launchSeed(ecology: Ecology, habitat: Habitat, releaseHeight = 10): SeedJourney {
  const parent = ecology.plants.filter(p => p.size > .6 && p.health > .6)
    .sort((a, b) => a.x * a.x + a.z * a.z - b.x * b.x - b.z * b.z)[0]
  // An empty island gets a visitor-supplied seed; the UI identifies this case.
  const x = (parent?.x ?? 0) + 2, z = (parent?.z ?? 0) + 2
  return { x, y: Math.max(0, habitat(x, z).height) + Math.max(6, releaseHeight), z,
    vx: 0, vz: 0, age: 0, species: parent?.species ?? 0, parentId: parent?.id ?? null,
    plantId: null, stage: 'airborne', germination: 0, reason: 'Ride the breeze. Find open ground.' }
}

export function stepSeedJourney(seed: SeedJourney, ecology: Ecology, habitat: Habitat,
  dt: number, sea: number, wind: { x: number; z: number }, input: JourneyInput) {
  if (!Number.isFinite(dt) || dt <= 0) return
  dt = Math.min(dt, .1)
  if (seed.stage === 'rooted') {
    const plant = ecology.plants.find(p => p.id === seed.plantId)
    if (!plant || plant.health <= 0) { seed.stage = 'lost'; seed.reason = 'This tree did not survive. Its descendants, if any, remain in the forest.'; return }
    const children = ecology.plants.filter(p=>p.parentId===plant.id).length
    seed.reason = children ? `${children} living offspring now share this island. Return to Whole world to see the forest.`
      : plant.health < .6 ? 'Growth is under stress. Check habitat and crowding before advancing time.'
      : plant.size > .7 ? 'A mature tree. Reproduction, open space and time can create the next generation.'
      : 'Taking root is the beginning. Advance time to watch your leaves and viewpoint grow.'
    return
  }
  if (seed.stage === 'lost') return
  const lose = (reason: string) => { seed.stage = 'lost'; seed.reason = reason }
  if (seed.stage === 'airborne') {
    seed.age += dt
    const steer = movement(input), smooth = 1 - Math.exp(-dt * 2)
    seed.vx += ((Number.isFinite(wind.x) ? wind.x : 0) + steer.x * 3 - seed.vx) * smooth
    seed.vz += ((Number.isFinite(wind.z) ? wind.z : 0) + steer.z * 3 - seed.vz) * smooth
    seed.x += seed.vx * dt; seed.z += seed.vz * dt; seed.y -= .72 * dt
    if (Math.abs(seed.x) > 74 || Math.abs(seed.z) > 74 || seed.age > 70) {
      seed.x = clamp(seed.x, -74, 74); seed.z = clamp(seed.z, -74, 74)
      lose('Beyond this study area. Try another seed and a gentler wind.'); return
    }
    const h = habitat(seed.x, seed.z)
    if (seed.y > Math.max(h.height, sea) + .16) return
  }
  const h = habitat(seed.x, seed.z)
  seed.y = Math.max(h.height, sea) + .16
  const site = seedSite(h,sea)
  if (site.code === 'water') { lose(site.reason); return }
  const wait = (reason:string) => { seed.stage='waiting';seed.germination=0;seed.reason=reason }
  if (!site.ready) { wait(site.reason); return }
  if (ecology.plants.length >= 300) { wait('The study population is at its 300-tree limit. This is a performance cap.'); return }
  if (ecology.plants.some(p => Math.hypot(p.x - seed.x, p.z - seed.z) < 2.5)) {
    wait('Waiting for space. Another root is within 2.5 units. Try an open patch.'); return
  }
  seed.stage='germinating';seed.germination+=dt;seed.reason='Suitable ground. Hold these conditions for two model seconds to germinate.'
  if (seed.germination < 2) return
  const id = ecology.nextId++
  ecology.plants.push({ id, x: seed.x, z: seed.z, age: 0, size: .12, health: 1, species: seed.species, lastSeed: ecology.time, parentId: seed.parentId })
  ecology.births++; seed.plantId = id; seed.stage = 'rooted'
  seed.reason = 'You have taken root. Water, neighbours and time now shape your growth.'
}

export function walkStep(position: { x: number; z: number }, habitat: Habitat,
  sea: number, dt: number, input: JourneyInput, fast = false) {
  const v = movement(input), speed = fast ? 13 : 6
  const x = clamp(position.x + v.x * Math.min(dt, .1) * speed, -73, 73)
  const z = clamp(position.z + v.z * Math.min(dt, .1) * speed, -73, 73)
  const h = habitat(x, z)
  // Traversal follows the height field, with water and steep slopes impassable.
  if (h.height <= sea + .3 || h.slope > 1.25) return { ...position, blocked: true }
  return { x, z, blocked: false }
}
