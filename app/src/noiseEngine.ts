import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js'
export type Layer = { id: number; name: string; enabled: boolean; type: string; seed: number; frequency: number; amplitude: number; octaves: number; persistence: number; modifier: string; strength: number; steps: number; power: number; warp: number; blend: string; weight: number }
export const makeLayer = (id: number): Layer => ({ id, name: `Layer ${id}`, enabled: true, type: 'Perlin', seed: id * 17, frequency: 2, amplitude: 1, octaves: 3, persistence: .5, modifier: 'None', strength: 1, steps: 6, power: 2, warp: .5, blend: 'Add', weight: .5 })
const perlin = new ImprovedNoise()
const clamp = (n: number) => Math.max(-1, Math.min(1, n))
function hash(x: number, y: number, z: number) { const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return n - Math.floor(n) }
function base(type: string, x: number, y: number, z: number) {
  if (type === 'Sine') return (Math.sin(x * 3 + z) + Math.sin(y * 3 - z)) / 2
  if (type !== 'Cellular') return clamp(perlin.noise(x, y, z) * 1.6)
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
  let distance = Infinity
  for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
    const u = ix+a, v = iy+b, w = iz+c
    distance = Math.min(distance, Math.hypot(x-u-hash(u,v,w), y-v-hash(u+31,v+17,w), z-w-hash(u,v+47,w+11)))
  }
  return clamp(distance * 2 - 1)
}
export function layerValue(l: Layer, x: number, y: number, z: number) {
  x = x*l.frequency + l.seed*.731; y = y*l.frequency + l.seed*.193; z = z*l.frequency + l.seed*.417
  if (l.modifier === 'Domain warping') {
    const a = perlin.noise(x+17,y,z), b = perlin.noise(x,y+37,z), c = perlin.noise(x,y,z+61)
    x += a*l.warp*3; y += b*l.warp*3; z += c*l.warp*3
  }
  let value = 0, sum = 0, amplitude = 1, frequency = 1
  for (let i=0;i<l.octaves;i++) {
    let n = base(l.type,x*frequency,y*frequency,z*frequency)
    if (l.modifier === 'Turbulence') n = Math.abs(n)*2-1
    value += n*amplitude; sum += amplitude; amplitude *= l.persistence; frequency *= 2
  }
  value /= sum
  let shaped = value
  if (l.modifier === 'Ridged') shaped = 1-2*Math.abs(value)
  if (l.modifier === 'Billow') shaped = 2*Math.abs(value)-1
  if (l.modifier === 'Terracing') shaped = Math.round((value+1)*.5*l.steps)/l.steps*2-1
  if (l.modifier === 'Power curve') shaped = Math.pow((value+1)*.5,l.power)*2-1
  if (l.modifier === 'Invert') shaped = -value
  return (value+(shaped-value)*l.strength)*l.amplitude
}
export function sample(layers: Layer[], solo: number | null, x: number, y: number, z: number) {
  let result = 0, first = true
  for (const l of layers) {
    if (!l.enabled || (solo !== null && l.id !== solo)) continue
    const n = layerValue(l,x,y,z)
    if (first) { result = n*l.weight; first = false; continue }
    if (l.blend === 'Mix') result = result*(1-l.weight)+n*l.weight
    else if (l.blend === 'Multiply') result *= 1-l.weight+n*l.weight
    else if (l.blend === 'Max') result += (Math.max(result,n)-result)*l.weight
    else result += n*l.weight
  }
  return clamp(result)
}
export function coordinates(u: number, v: number, planet: boolean): [number,number,number] {
  if (!planet) return [(u-.5)*3, (v-.5)*3, .37]
  const phi = u*Math.PI*2, theta = v*Math.PI
  return [-Math.cos(phi)*Math.sin(theta), Math.cos(theta), Math.sin(phi)*Math.sin(theta)]
}
