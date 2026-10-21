import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createIllustratedPlanet } from '../src/illustratedPlanet.ts'
import { sample, makeLayer, coordinates } from '../src/noiseEngine.ts'
import { buildTree } from '../src/natureRendering.ts'
test('the globe texture samples the same spherical field used by geometry, with bounded relief',()=>{
 const s={radius:2,resolution:64,relief:.35,frequency:1.5,sea:-.025,moisture:.64,temperature:.78},mesh=createIllustratedPlanet(s)
 const field=mesh.material.uniforms.field.value,image=field.image
 for(const [x,y] of [[20,40],[230,170],[505,250]]){
  const n=coordinates((x+.5)/512,1-(y+.5)/256,true),expected=sample([{...makeLayer(1),frequency:1.5,weight:1}],null,...n)
  assert.ok(Math.abs(image.data[(y*512+x)*4]/255*2-1-expected)<.004)
 }
 const p=mesh.geometry.getAttribute('position')
 for(let i=0;i<p.count;i++){const r=Math.hypot(p.getX(i),p.getY(i),p.getZ(i));assert.ok(r>=2+s.sea*.32-1e-6&&r<=2+s.relief*.32+1e-6)}
 let disposed=false;field.addEventListener('dispose',()=>{disposed=true});mesh.material.dispose();mesh.geometry.dispose();assert.ok(disposed)
})
test('both tree silhouettes preserve grammar counts and finite, volumetric crowns',()=>{
 for(const shape of ['fir','broadleaf'])for(const iterations of [1,2,3]){
  const t=buildTree(iterations,30,shape);assert.equal(t.segments,5**iterations)
  t.foliage.computeBoundingBox();const box=t.foliage.boundingBox;assert.ok(box.max.x>box.min.x&&box.max.y>box.min.y&&box.max.z>box.min.z)
  assert.ok([...t.foliage.getAttribute('position').array].every(Number.isFinite));t.branches.dispose();t.foliage.dispose()
 }
})
