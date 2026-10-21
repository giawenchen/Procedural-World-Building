import test from 'node:test'
import assert from 'node:assert/strict'
import {STUDIES,studyRequest} from '../src/controlledStudyConfig.ts'
test('cave comparison varies radius without silently switching CSG order',()=>{
 for(const radius of [0,1,3,5]){
  const r=studyRequest('cave',radius)
  assert.ok(r.p<=2/3);assert.equal(r.orbit,0);assert.equal(r.compare,true)
  assert.ok(Math.abs(Math.min(1,r.p*1.5)*5-radius)<1e-10)
 }
})
test('every comparison maps its endpoints to bounded reproducible requests',()=>{
 for(const s of STUDIES){
  const a=studyRequest(s.id,s.min),b=studyRequest(s.id,s.max)
  assert.equal(a.p,0);assert.ok(b.p>0&&b.p<=1);assert.equal(a.kind,s.id);assert.equal(b.kind,s.id)
  assert.equal(a.compare,true);assert.equal(b.orbit,0)
  assert.equal(studyRequest(s.id,s.min-100).p,0)
 }
})
