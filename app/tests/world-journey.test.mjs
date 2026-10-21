import test from 'node:test'
import assert from 'node:assert/strict'
import {launchSeed,stepSeedJourney,movement,walkStep} from '../src/worldJourney.ts'
import {stepEcology} from '../src/worldSystems.ts'
const land=()=>({height:3,slope:.1,moisture:.6,temperature:.7})
const empty=()=>({plants:[],time:0,births:0,deaths:0,nextId:0,seed:17})
const neutral={forward:0,right:0,yaw:0}
function flight(s,e,h=land,wind={x:0,z:0},input=neutral,seconds=15){for(let i=0;i<seconds*30;i++)stepSeedJourney(s,e,h,1/30,0,wind,input)}
test('movement is camera-relative and diagonal input is speed-normalized',()=>{
 assert.deepEqual(movement({forward:1,right:0,yaw:0}),{x:0,z:-1})
 const diagonal=movement({forward:1,right:1,yaw:0});assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.z)-1)<1e-10)
 assert.ok(movement({forward:1,right:0,yaw:Math.PI/2}).x<-.99)
})
test('a visitor seed becomes one real population member and remains tied to its identity',()=>{
 const e=empty(),s=launchSeed(e,land,6);assert.equal(s.parentId,null);flight(s,e)
 assert.equal(s.stage,'rooted');assert.equal(e.births,1);assert.equal(e.plants.length,1);assert.equal(e.plants[0].id,s.plantId)
 const initial=e.plants[0].size;stepEcology(e,land,4,0,1,0,8,5);assert.ok(e.plants[0].size>initial)
 flight(s,e);assert.equal(e.births,1)
 stepEcology(e,land,20,10,1,0,8,5);flight(s,e);assert.equal(s.stage,'lost')
})
test('wind and keyboard steering move the seed itself; paused time does not move it',()=>{
 const a=empty(),b=empty(),sa=launchSeed(a,land,30),sb=launchSeed(b,land,30)
 flight(sa,a,land,{x:2,z:0},neutral,2);flight(sb,b,land,{x:2,z:0},{forward:0,right:-1,yaw:0},2)
 assert.ok(sa.x>sb.x+3);const before={...sa};stepSeedJourney(sa,a,land,0,0,{x:4,z:0},neutral);assert.deepEqual(sa,before)
})
test('water prevents establishment; unsuitable land and crowded sites wait without births',()=>{
 for(const [h,stage] of [[()=>({...land(),height:-2}),'lost'],[()=>({...land(),slope:1.2}),'waiting'],[()=>({...land(),moisture:.1}),'waiting']]){
  const e=empty(),s=launchSeed(e,h,6);flight(s,e,h);assert.equal(s.stage,stage);assert.equal(e.births,0)
 }
 const e=empty(),s=launchSeed(e,land,6);e.plants.push({id:0,x:s.x,z:s.z,size:.2,health:1,age:0,species:0,lastSeed:0});flight(s,e);assert.equal(s.stage,'waiting');assert.equal(e.births,0)
 const edge=launchSeed(empty(),land,50);flight(edge,empty(),land,{x:30,z:0},neutral,5);assert.equal(edge.stage,'lost');assert.ok(Math.abs(edge.x)<=74)
})
test('one dry seed waits, germinates after a climate change, and keeps its identity',()=>{
 let moisture=.1;const h=()=>({...land(),moisture}),e=empty(),s=launchSeed(e,h,6)
 flight(s,e,h);assert.equal(s.stage,'waiting');const spot=[s.x,s.z]
 moisture=.6;flight(s,e,h,{x:10,z:0},neutral,1);assert.equal(s.stage,'germinating');assert.equal(e.births,0)
 moisture=.1;flight(s,e,h,{x:10,z:0},neutral,1);assert.equal(s.stage,'waiting');assert.equal(s.germination,0)
 moisture=.6;flight(s,e,h,{x:10,z:0},neutral,3);assert.equal(s.stage,'rooted');assert.deepEqual([s.x,s.z],spot)
 const id=s.plantId;flight(s,e,h);assert.equal(s.plantId,id);assert.equal(e.births,1)
})
test('a waiting seed flooded before germination cannot later resurrect',()=>{
 const dry=()=>({...land(),moisture:.1}),e=empty(),s=launchSeed(e,dry,6);flight(s,e,dry)
 stepSeedJourney(s,e,land,.1,5,{x:0,z:0},neutral);assert.equal(s.stage,'lost')
 flight(s,e);assert.equal(e.plants.length,0)
})
test('flooded adult trees lose health but do not grow or reproduce under water',()=>{
 const e=empty();e.plants=[{id:0,x:0,z:0,size:1,health:1,age:20,species:0,lastSeed:-100}];e.nextId=1
 stepEcology(e,land,.5,4,3,3,8,5)
 assert.equal(e.plants[0].size,1);assert.ok(e.plants[0].health<1);assert.equal(e.births,0)
})
test('new offspring retain a real parent identity',()=>{
 const e=empty();e.plants=[{id:0,x:0,z:0,size:1,health:1,age:20,species:0,lastSeed:-100}];e.nextId=1
 stepEcology(e,land,.5,0,2,1,8,5)
 assert.equal(e.births,1);assert.equal(e.plants[1].parentId,0)
})
test('walking respects shoreline, steep terrain and bounds without changing ecology',()=>{
 const p={x:0,z:0};const input={forward:1,right:0,yaw:0};const next=walkStep(p,land,0,.1,input);assert.ok(next.z<0)
 assert.equal(walkStep(p,land,5,.1,input).blocked,true)
 assert.equal(walkStep(p,()=>({...land(),slope:2}),0,.1,input).blocked,true)
 assert.ok(walkStep({x:73,z:73},land,0,.1,{forward:0,right:1,yaw:0},true).x<=73)
})
