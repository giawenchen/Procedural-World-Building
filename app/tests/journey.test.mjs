import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,statSync} from 'node:fs'
import {ATLAS_CUES,ATLAS_DURATION} from '../src/atlasProgram.ts'
const story=JSON.parse(readFileSync(new URL('../src/journeyAudio.json',import.meta.url),'utf8'))
test('every detailed chapter stays aligned to the existing experiment timeline',()=>{
 const studies=story.sections.filter(s=>s.phase==='study')
 assert.equal(studies.length,ATLAS_CUES.length)
 studies.forEach((s,i)=>{assert.equal(s.id,ATLAS_CUES[i].id);assert.equal(s.at-story.introDuration,ATLAS_CUES[i].at)})
 assert.equal(story.duration-story.introDuration,ATLAS_DURATION)
})
test('narration and English captions are continuous, ordered and contained by their chapter',()=>{
 assert.equal(story.sections[0].at,0)
 story.sections.forEach((s,i)=>{assert.equal(s.end,s.at+s.duration);if(i)assert.equal(s.at,story.sections[i-1].end)})
 let end=0
 for(const c of story.captions){assert.ok(c.start>=end);assert.ok(c.end>c.start);const chapter=story.sections.find(s=>c.start>=s.at&&c.start<s.end);assert.ok(chapter);assert.ok(c.end<=chapter.end);assert.ok(c.text.trim().length);end=c.end}
 assert.ok(end<=story.duration)
 assert.ok(statSync(new URL('../public/audio/fieldwork/narrator-preview.mp3',import.meta.url)).size>100000)
})
test('story stations cover the landscape chain and expose every research destination',()=>{
 const stations=story.sections.filter(s=>s.phase==='story')
 assert.deepEqual(stations.map(s=>s.station),[0,1,2,3,4,5,6,0])
 assert.deepEqual(new Set(stations.map(s=>s.workspace)),new Set(['planet','noise','simulation','living','voxels','fields']))
 assert.match(stations.at(-1).lines.join(' '),/experiments remain separate/)
})

const short=JSON.parse(readFileSync(new URL('../src/journeyShort.json',import.meta.url),'utf8'))
const timing=JSON.parse(readFileSync(new URL('../../tools/journey/short-voice-timing-v5.json',import.meta.url),'utf8'))
test('short film obeys exhibition limits and retains every experiment after the opening',()=>{
 assert.equal(short.introDuration,14);assert.equal(short.duration,176)
 assert.ok(short.introDuration<=15&&short.duration<=180)
 const studies=short.sections.filter(s=>s.phase==='study')
 assert.deepEqual(studies.map(s=>s.id),ATLAS_CUES.slice(1).map(c=>c.id))
 for(const [i,s] of studies.entries()){
  assert.equal(s.sourceStart,ATLAS_CUES[i+1].at)
  assert.equal(s.sourceEnd,ATLAS_CUES[i+2]?.at??ATLAS_DURATION)
 }
})
test('short narration fits its shot and captions never spill into the next experiment',()=>{
 let previous=0
 for(const s of short.sections){
  assert.equal(s.at,previous);assert.equal(s.end,s.at+s.duration);previous=s.end
  const voice=timing.find(v=>v.id===s.id);assert.ok(voice.start>=s.at);assert.ok(voice.end<s.end)
  const caption=short.captions.find(c=>c.start>=s.at&&c.start<s.end)
  assert.ok(caption);assert.ok(caption.end<=s.end);assert.ok(caption.end>voice.end)
 }
 assert.equal(previous,short.duration)
 assert.ok(statSync(new URL('../public/audio/fieldwork/narrator-short-v5.mp3',import.meta.url)).size>100000)
})
