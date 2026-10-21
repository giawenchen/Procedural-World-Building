/** Re-run with: node --experimental-strip-types tools/exhibition/atlas_report.mjs */
import {writeFileSync} from 'node:fs'
import {terrainField,erosionTrial,climateTrial,populationTrial,fluidTrial,windTrial,voxelTrial} from '../../app/src/atlasExperiments.ts'
import {VOXEL_DEFAULT,meshChunk,affectedChunk} from '../../app/src/voxelEngine.ts'
const summary=e=>({trees:e.plants.length,births:e.births,deaths:e.deaths,meanSize:e.plants.reduce((s,p)=>s+p.size,0)/e.plants.length,meanHealth:e.plants.reduce((s,p)=>s+p.health,0)/e.plants.length})
const report={recordedAt:new Date().toISOString(),runtime:process.version,measurementScope:'CPU-only model trials; not browser FPS. Three cold-to-warm mesh trials per configuration; order may affect JIT/cache.',seed:17,erosion:[],climate:[],ecology:[],fluid:[],wind:[],voxel:[],local:[]}
for(const rain of [.005,.05]){const f=erosionTrial(rain,100);report.erosion.push({rain,steps:100,meanCut:f.cut,meanFill:f.fill,meanWater:f.waterMean,groundSedimentBalance:f.ground.reduce((s,v,i)=>s+v-f.baseline[i]+f.sediment[i],0)})}
for(const moisture of [.25,.8])report.climate.push({moisture,...climateTrial(moisture)})
for(const [growth,reproduction,competition] of [[0,0,5],[2,0,5],[2,1,5],[2,1,0]])report.ecology.push({seconds:18,growth,reproduction,competition,...summary(populationTrial(reproduction,18,growth,competition))})
for(const iterations of [0,40]){const f=fluidTrial(iterations,8);report.fluid.push({grid:40,time:f.time,iterations,before:f.before,after:f.after})}
for(const direction of [0,90]){const f=windTrial(direction,8);report.wind.push({direction,speed:4,time:8,meanDistance:f.points.reduce((s,p,i)=>s+Math.hypot(p[0]-f.initial[i][0],p[1]-f.initial[i][1]),0)/f.points.length})}
for(const [cells,chunk,cut] of [[32,16,false],[48,16,false],[64,16,false],[48,16,true],[48,8,true]]){const settings={...VOXEL_DEFAULT,cut:cut?{x:8,y:6,z:12,r:4}:null},runs=Array.from({length:3},()=>voxelTrial(cells,chunk,settings)),times=runs.map(r=>r.ms);report.voxel.push({...runs[0],cut,trialsMs:times,medianMs:[...times].sort((a,b)=>a-b)[1],sampleStorageMiB:runs[0].samples*4/1048576})}
for(const chunk of [16,8]){const cut={x:8,y:6,z:12,r:4},settings={...VOXEL_DEFAULT,cut},times=[];let rebuilt=0;for(let run=0;run<3;run++){const start=performance.now();rebuilt=0;for(let z=0;z<48;z+=chunk)for(let y=0;y<48;y+=chunk)for(let x=0;x<48;x+=chunk)if(affectedChunk([x,y,z],chunk,48,cut)){meshChunk(settings,48,[x,y,z],chunk);rebuilt++}times.push(performance.now()-start)}report.local.push({cells:48,chunk,rebuilt,total:(48/chunk)**3,trialsMs:times,medianMs:[...times].sort((a,b)=>a-b)[1]})}
report.sampling=[24,48,96].map(cells=>{const f=terrainField(cells,4);return {cells,triangles:2*cells*cells,spacing:f.spacing}})
writeFileSync(new URL('../../docs/exhibition/fieldwork-v3-experiments.json',import.meta.url),JSON.stringify(report,null,2)+'\n')
console.log(JSON.stringify(report,null,2))
