import test from 'node:test'
import assert from 'node:assert/strict'
import { createPocket, stepPocket, blow, shower, plantAt, tiltVector, pocketHabitat } from '../src/pocketModel.ts'
const advance = (s, seconds, wind={x:0,z:0}) => { for(let i=0;i<seconds*20;i++) stepPocket(s,.05,wind) }
test('reset recreates the same island and visitors own independent state',()=>{
 const a=createPocket(), b=createPocket();assert.deepEqual(a.plants,b.plants);shower(a);advance(a,4);assert.notDeepEqual(a.moisture,b.moisture);assert.equal(b.time,0)
})
test('a gust produces lagged current and decays without input',()=>{
 const s=createPocket();blow(s);advance(s,1);const wind=Math.hypot(s.wind.x,s.wind.z);assert.ok(wind>1);assert.ok(Math.hypot(s.current.x,s.current.z)>0);assert.ok(Math.hypot(s.current.x,s.current.z)<wind);advance(s,18);assert.ok(Math.hypot(s.wind.x,s.wind.z)<.02)
})
test('opposite wind transports the same seeds to different positions',()=>{
 const a=createPocket(),b=createPocket();blow(a);blow(b);advance(a,1,{x:1,z:0});advance(b,1,{x:-1,z:0});assert.ok(a.seeds.length);assert.ok(a.seeds[0].x>b.seeds[0].x+2)
})
test('rain increases land moisture and never exceeds bounds',()=>{
 const dry=createPocket(),wet=createPocket();shower(wet);advance(dry,6);advance(wet,6);const indices=wet.heights.map((h,i)=>h>1?i:-1).filter(i=>i>=0);assert.ok(indices.reduce((sum,i)=>sum+wet.moisture[i]-dry.moisture[i],0)>indices.length*.1);assert.ok(wet.moisture.every(x=>x>=0&&x<=1))
})
test('planting checks water, dry soil and crowding; rain can unlock a clearing',()=>{
 const s=createPocket();assert.equal(plantAt(s,75,75),false);assert.equal(s.births,0)
 let spot
 for(let x=-40;x<40&&!spot;x+=5)for(let z=-40;z<40;z+=5){const h=pocketHabitat(s,x,z);if(h.height>2&&h.slope<.8&&h.temperature>.25&&!s.plants.some(p=>Math.hypot(x-p.x,z-p.z)<5)){spot={x,z};break}}
 assert.ok(spot);s.moisture.fill(.15);assert.equal(plantAt(s,spot.x,spot.z),false);shower(s);advance(s,6);assert.equal(s.births,1);assert.equal(s.focus.stage,'rooted');assert.equal(plantAt(s,spot.x,spot.z),false)
})
test('tilt calibrates neutral, rotates with screen and rejects invalid data',()=>{
 assert.deepEqual(tiltVector(30,10,30,10),{x:0,z:0});assert.deepEqual(tiltVector(NaN,0,0,0),{x:0,z:0});const a=tiltVector(28,0,0,0,90);assert.ok(Math.abs(a.x-1)<1e-9);assert.ok(Math.abs(a.z)<1e-9)
})
test('a minute of wind and rain remains finite and bounded',()=>{
 const s=createPocket();for(let i=0;i<1200;i++){if(i%180===0){shower(s);blow(s)}stepPocket(s,.05,{x:1,z:-.5})}
 assert.ok(s.plants.length<=130);assert.ok(s.seeds.length<=60);assert.ok(s.moisture.every(Number.isFinite));assert.ok(s.plants.every(p=>Number.isFinite(p.x+p.z+p.size+p.health)&&p.health>=0&&p.health<=1))
})

test('a tracked seed waits in dry soil and rain germinates that same seed',()=>{
 const dry=createPocket(),wet=createPocket();let spot
 for(let x=-40;x<40&&!spot;x+=5)for(let z=-40;z<40;z+=5){const h=pocketHabitat(dry,x,z);if(h.height>2&&h.slope<.8&&h.temperature>.25&&!dry.plants.some(p=>Math.hypot(x-p.x,z-p.z)<5)){spot={x,z};break}}
 assert.ok(spot)
 for(const s of [dry,wet]){s.moisture.fill(.15);plantAt(s,spot.x,spot.z);assert.equal(s.focus.stage,'waiting');assert.equal(s.births,0)}
 const seedId=wet.focus.id;shower(wet);advance(wet,6);advance(dry,6)
 assert.equal(dry.focus.stage,'waiting');assert.equal(dry.births,0)
 assert.equal(wet.focus.id,seedId);assert.equal(wet.focus.stage,'rooted');assert.equal(wet.births,1)
 const tree=wet.plants.find(p=>p.id===wet.focus.plantId);assert.ok(tree);assert.equal(tree.x,spot.x);assert.equal(tree.z,spot.z)
})
test('dry seeds expire and a water landing never pretends to be a successful story',()=>{
 const s=createPocket();s.moisture.fill(.05);s.plants=[]
 let spot
 for(let x=-40;x<40&&!spot;x+=5)for(let z=-40;z<40;z+=5){const h=pocketHabitat(s,x,z);if(h.height>2&&h.slope<.8&&h.temperature>.25){spot={x,z};break}}
 plantAt(s,spot.x,spot.z);advance(s,61);assert.equal(s.waiting.length,0);assert.equal(s.focus.stage,'lost');assert.equal(s.births,0)
 plantAt(s,70,70);assert.equal(s.focus.stage,'lost');assert.equal(s.births,0)
})
test('a gust tracks a real seed and a bounded trajectory through landing',()=>{
 const s=createPocket();blow(s);const id=s.focus.id
 assert.ok(s.seeds.some(seed=>seed.id===id));advance(s,1);assert.ok(s.focus.path.length>1);assert.ok(s.focus.path.length<=96)
 advance(s,7);assert.equal(s.focus.id,id);assert.notEqual(s.focus.stage,'flight')
})
