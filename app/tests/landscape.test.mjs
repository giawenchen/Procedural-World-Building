import { test } from 'node:test'
import assert from 'node:assert/strict'
import { slopeAt, createGrove } from '../src/landscapeStyle.ts'

test('slope measures rise/run on planar fields, including grid edges', () => {
  const n = 9, spacing = 2, heights = new Float32Array(n * n)
  for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) heights[z * n + x] = x * spacing * .3 + z * spacing * .4
  for (let i = 0; i < heights.length; i++) assert.ok(Math.abs(slopeAt(heights, n, spacing, i) - .5) < 1e-6)
})

test('groves reproduce positions, exclude submerged and steep ground, and do not alter simulation fields', () => {
  const n = 97, field = new Float32Array(n * n).fill(5), wet = new Float32Array(n * n)
  const original = field.slice(), grove = createGrove()
  try {
    const count = grove.update(field, wet, n, 192, -4, 0, 0, false)
    assert.ok(count > 0 && count <= 650)
    const matrices = grove.group.children[0].instanceMatrix.array.slice()
    grove.recolor('storybook', true)
    assert.equal(grove.group.children[0].geometry.type, 'LatheGeometry')
    assert.equal(grove.update(field, wet, n, 192, -4, 0, 0, false), count)
    assert.deepEqual(grove.group.children[0].instanceMatrix.array, matrices)
    assert.deepEqual(field, original)
    assert.deepEqual(wet, new Float32Array(n * n))
    wet.fill(.31)
    assert.equal(grove.update(field, wet, n, 192, -4, 0, 0, false), 0)
    assert.equal(grove.update(field, wet, n, 192, -4, 0, 0, true), count)
    wet.fill(0); field.fill(-5)
    assert.equal(grove.update(field, wet, n, 192, -4, 0, 0, false), 0)
    for (let z = 0; z < n; z++) for (let x = 0; x < n; x++) field[z * n + x] = x * 2 - 96
    assert.equal(grove.update(field, wet, n, 192, -4, 0, 0, false), 0)
  } finally { grove.dispose() }
})

test('density controls deterministic candidate subsets without changing terrain or water', () => {
  const n = 97, field = new Float32Array(n * n).fill(5), wet = new Float32Array(n * n)
  const grove = createGrove(), original = field.slice()
  const collect = () => {
    const mesh = grove.group.children[2]
    return new Set(Array.from({length:mesh.count}, (_, i) => {
      const a = mesh.instanceMatrix.array
      return `${a[i*16+12]},${a[i*16+14]}`
    }))
  }
  try {
    assert.equal(grove.update(field, wet, n, 192, -4, 0, 0, false, {density:0,clustering:.5,size:1}), 0)
    grove.update(field, wet, n, 192, -4, 0, 0, false, {density:.25,clustering:.3,size:1})
    const sparse = collect()
    grove.update(field, wet, n, 192, -4, 0, 0, false, {density:.6,clustering:.3,size:1})
    const dense = collect()
    assert.ok(dense.size > sparse.size)
    for (const position of sparse) assert.ok(dense.has(position))
    const count = grove.update(field, wet, n, 192, -4, 0, 0, false, {density:.6,clustering:.3,size:1.4})
    assert.equal(count, dense.size)
    assert.deepEqual(collect(), dense)
    assert.deepEqual(field, original)
    assert.deepEqual(wet, new Float32Array(n*n))
  } finally { grove.dispose() }
})
