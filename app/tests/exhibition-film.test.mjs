import {test} from 'node:test'
import assert from 'node:assert/strict'
import {filmAt,filmCaption,filmControls} from '../src/exhibitionFilm.ts'
import {tideAt} from '../src/worldSystems.ts'

test('film changes a rule while time is held, then advances time with the rule held',()=>{
 assert.equal(filmAt(10).modelTime,18)
 assert.equal(filmAt(12).modelTime,18)
 assert.ok(filmAt(12).tideAmplitude>filmAt(10).tideAmplitude)
 assert.equal(filmAt(15).tideAmplitude,4)
 assert.equal(tideAt(filmAt(22).modelTime,filmAt(22).tideAmplitude,24),4)
 assert.equal(tideAt(filmAt(38).modelTime,filmAt(38).tideAmplitude,24),-4)
 assert.equal(filmAt(82).modelTime,0)
 assert.ok(filmAt(82).growthRate>0)
 assert.equal(filmAt(90).growthRate,2)
 assert.equal(filmAt(98).modelTime,18)
 for(let t=48;t<=56;t+=.1)assert.ok(filmAt(t).caveRadius>=0&&filmAt(t).caveRadius<=5)
})
test('saved references and comparisons return to the same camera',()=>{
 let sawOrbit=false,sawCapture=false,sawCompare=false
 for(let t=0;t<110;t+=.1){const r=filmAt(t);if(r.orbit>.1)sawOrbit=true;if(r.capture){sawCapture=true;assert.ok(Math.abs(r.orbit)<1e-12)}if(r.compare){sawCompare=true;assert.equal(r.orbit,0)}}
 assert.ok(sawOrbit&&sawCapture&&sawCompare)
})
test('captions and parameter readouts use rendered outcomes rather than predicted births or connectivity',()=>{
 const tide={request:filmAt(18),time:22,route:0,sea:2,trees:104,births:0,deaths:0}
 assert.match(filmCaption(tide),/disconnected/)
 tide.route=78;assert.match(filmCaption(tide),/rising/)
 const forest={...tide,request:filmAt(90),time:8,trees:104,births:0}
 assert.match(filmCaption(forest),/before seedlings/)
 forest.births=10;assert.match(filmCaption(forest),/appearing/)
 assert.equal(filmControls(forest).find(c=>c.label==='Preview time').value,8)
 const cave={...forest,request:filmAt(70),radius:5,rebuilt:8,chunks:27}
 assert.match(filmCaption(cave),/8 of 27/)
})
