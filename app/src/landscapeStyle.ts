import * as THREE from 'three'
import { createAtlasMaterial } from './worldStyle.ts'

export type GroveSettings = { density: number; clustering: number; size: number }
export const DEFAULT_GROVE: GroveSettings = { density: .53, clustering: .3, size: 1 }

export type Mood = 'lakeside' | 'storybook'
export const MOODS = {
  lakeside: { label: 'Natural materials', sky: '#f4f3ee', mist: '#f4f3ee', shadow: '#263c32', foliage: '#355635', leaf: '#6f8a45', water: '#327b9d', land: ['#92734f', '#c8ac72', '#75934f', '#365d3d', '#8a837a', '#edece1'] },
  storybook: { label: 'Natural materials', sky: '#f4f3ee', mist: '#f4f3ee', shadow: '#263c32', foliage: '#355635', leaf: '#6f8a45', water: '#327b9d', land: ['#92734f', '#c8ac72', '#75934f', '#365d3d', '#8a837a', '#edece1'] },
} as const

// Rise / run from the sampled field, rather than a decorative texture.
export function slopeAt(field: Float32Array, n: number, spacing: number, i: number) {
  const x = i % n, z = Math.floor(i / n)
  const left = Math.max(0, x - 1), right = Math.min(n - 1, x + 1)
  const up = Math.max(0, z - 1), down = Math.min(n - 1, z + 1)
  return Math.hypot(
    (field[z * n + right] - field[z * n + left]) / ((right - left) * spacing),
    (field[down * n + x] - field[up * n + x]) / ((down - up) * spacing),
  )
}

export const createLandscapeMaterial = createAtlasMaterial

// A bounded number of instances; the same world coordinates produce the same candidates.
export function createGrove() {
  const group = new THREE.Group(), capacity = 650
  const crownGeometry = new THREE.SphereGeometry(1, 9, 7)
  // A stepped silhouette reads as a conifer without adding tree instances.
  const pineGeometry = new THREE.LatheGeometry([
    new THREE.Vector2(0, -1), new THREE.Vector2(.95, -.85),
    new THREE.Vector2(.5, -.3), new THREE.Vector2(.75, -.38),
    new THREE.Vector2(.32, .25), new THREE.Vector2(.52, .12),
    new THREE.Vector2(0, 1),
  ], 7)
  const trunkGeometry = new THREE.CylinderGeometry(.12, .22, 1, 5)
  const crownMaterial = new THREE.MeshToonMaterial({ fog: false, color: MOODS.lakeside.foliage })
  const leafMaterial = new THREE.MeshToonMaterial({ fog: false, color: MOODS.lakeside.leaf })
  const trunkMaterial = new THREE.MeshToonMaterial({ fog: false, color: '#605b52' })
  const crowns = new THREE.InstancedMesh<THREE.BufferGeometry, THREE.MeshToonMaterial>(crownGeometry, crownMaterial, capacity)
  const leaves = new THREE.InstancedMesh<THREE.BufferGeometry, THREE.MeshToonMaterial>(crownGeometry, leafMaterial, capacity)
  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, capacity)
  for (const mesh of [crowns, leaves, trunks]) { mesh.frustumCulled = false; mesh.castShadow = true; group.add(mesh) }
  const dummy = new THREE.Object3D()
  function hash(x: number, z: number) { const a = Math.sin(x * 127.1 + z * 311.7) * 43758.5453; return a - Math.floor(a) }
  return {
    group,
    recolor(mood: Mood, illustrated = false, studio = false) {
      crowns.geometry = illustrated || studio ? pineGeometry : crownGeometry
      leaves.geometry = illustrated ? pineGeometry : crownGeometry
      for (const material of [crownMaterial, leafMaterial, trunkMaterial]) {
        if (material.fog !== studio) { material.fog = studio; material.needsUpdate = true }
      }
      crownMaterial.color.set(studio ? '#48694a' : illustrated ? '#244c3d' : MOODS[mood].foliage)
      leafMaterial.color.set(studio ? '#849c63' : illustrated ? '#476b4c' : MOODS[mood].leaf)
    },
    update(field: Float32Array, wet: Float32Array, n: number, span: number, sea: number, centerX: number, centerZ: number, original: boolean, settings: GroveSettings = DEFAULT_GROVE) {
      const spacing = span / (n - 1); let count = 0
      const cell = 6
      for (let wz = Math.ceil((centerZ - span / 2 + 4) / cell) * cell; wz < centerZ + span / 2 - 4; wz += cell) {
        for (let wx = Math.ceil((centerX - span / 2 + 4) / cell) * cell; wx < centerX + span / 2 - 4; wx += cell) {
          if (count >= capacity) break
          const random = hash(wx, wz)
          const cluster = Math.sin(wx * .045) * Math.cos(wz * .057)
          const chance = Math.max(0, Math.min(1, settings.density * (1 + cluster * settings.clustering / .53)))
          if (random >= chance) continue
          const x = wx - centerX + (random - .5) * 3, z = wz - centerZ + (hash(wz, wx) - .5) * 3
          const ix = Math.max(0, Math.min(n - 1, Math.round((x + span / 2) / spacing)))
          const iz = Math.max(0, Math.min(n - 1, Math.round((z + span / 2) / spacing)))
          const i = iz * n + ix, y = field[i]
          if (y < sea + 2 || y > sea + 21 || slopeAt(field, n, spacing, i) > .7 || (!original && wet[i] > .3)) continue
          // Anchor at the exact sample used to evaluate height and slope.
          const px = ix * spacing - span / 2, pz = iz * spacing - span / 2
          const size = (4.5 + random * 4.5) * settings.size
          dummy.position.set(px, y + size * .35, pz); dummy.scale.set(1, size * .7, 1); dummy.updateMatrix(); trunks.setMatrixAt(count, dummy.matrix)
          dummy.position.set(px, y + size * .83, pz); dummy.scale.set(size * (random > .5 ? .4 : .27), size * (random > .5 ? .43 : .7), size * .32); dummy.updateMatrix(); crowns.setMatrixAt(count, dummy.matrix)
          dummy.position.set(px - size * .16, y + size * .9, pz + size * .08); dummy.scale.set(size * .23, size * .43, size * .22); dummy.updateMatrix(); leaves.setMatrixAt(count, dummy.matrix)
          count++
        }
      }
      for (const mesh of [crowns, leaves, trunks]) { mesh.count = count; mesh.instanceMatrix.needsUpdate = true }
      return count
    },
    dispose() { pineGeometry.dispose(); crownGeometry.dispose(); trunkGeometry.dispose(); crownMaterial.dispose(); leafMaterial.dispose(); trunkMaterial.dispose(); crowns.dispose(); leaves.dispose(); trunks.dispose() },
  }
}
