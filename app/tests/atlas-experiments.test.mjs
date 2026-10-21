import {test} from 'node:test'
import assert from 'node:assert/strict'
import {atlasAt,ATLAS_CUES,ATLAS_DURATION} from '../src/atlasProgram.ts'
import {terrainField,erosionTrial,populationTrial,climateTrial,windTrial,fluidTrial} from '../src/atlasExperiments.ts'

test('the whole film has finite interpolation and comparisons use a fixed camera',()=>{
 assert.equal(ATLAS_CUES.at(-1).at+32,ATLAS_DURATION)
 for(let t=0;t<=ATLAS_DURATION;t+=.1){const r=atlasAt(t);assert.ok(Number.isFinite(r.p)&&r.p>=0&&r.p<=1);assert.ok(r.duration>=8);if(r.compare)assert.ok(r.p>.99)}
})
test('frequency changes the field; resolution samples the same world positions',()=>{
 const a=terrainField(24,4),b=terrainField(48,4),c=terrainField(24,1)
 for(let z=0;z<25;z++)for(let x=0;x<25;x++)assert.ok(Math.abs(a.ground[z*25+x]-b.ground[z*2*49+x*2])<1e-5)
 assert.notDeepEqual(a.ground,c.ground)
})
test('equal-step rainfall trials share an initial field and exchange ground with sediment',()=>{
 const a=erosionTrial(.005,100),b=erosionTrial(.05,100)
 assert.deepEqual(a.baseline,b.baseline);assert.ok(b.cut>a.cut);assert.ok(b.waterMean>a.waterMean)
 for(const f of [a,b]){const balance=f.ground.reduce((s,v,i)=>s+v-f.baseline[i]+f.sediment[i],0);assert.ok(Math.abs(balance)<.01);assert.ok(f.ground.every(Number.isFinite))}
})
test('moisture changes classification while ocean and beach counts stay fixed',()=>{
 const dry=climateTrial(.25),wet=climateTrial(.8)
 assert.equal(dry.counts[0],wet.counts[0]);assert.equal(dry.counts[1],wet.counts[1]);assert.ok(wet.counts[4]>dry.counts[4]);assert.ok(wet.trees>dry.trees)
})
test('constant wind rotates displacement while preserving distance',()=>{
 const a=windTrial(0,8),b=windTrial(90,8)
 for(let i=0;i<a.points.length;i++){assert.ok(Math.abs(a.points[i][0]-a.initial[i][0]-32)<1e-8);assert.ok(Math.abs(b.points[i][1]-b.initial[i][1]-32)<1e-8)}
})
test('growth and reproduction comparisons retain matching initial conditions',()=>{
 const frozen=populationTrial(0,18,0),grown=populationTrial(0,18,2),reproduced=populationTrial(1,18,2)
 assert.equal(frozen.plants.length,104);assert.equal(grown.plants.length,104);assert.equal(reproduced.plants.length,232);assert.equal(reproduced.births,128)
 assert.ok(grown.plants[0].size>frozen.plants[0].size)
 const uncrowded=populationTrial(1,18,2,0);const health=e=>e.plants.reduce((s,p)=>s+p.health,0)/e.plants.length;assert.ok(health(uncrowded)>health(reproduced))
})
test('matched fluid trials reduce divergence with projection',()=>{const a=fluidTrial(0,1),b=fluidTrial(40,1);assert.equal(a.time,b.time);assert.ok(b.after<b.before);assert.ok(b.after<a.after)})
