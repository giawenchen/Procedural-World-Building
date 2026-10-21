/** Reproducible exhibition fixtures using the application's actual algorithms. */
import { makeLayer, sample } from './noiseEngine.ts'
import { erode } from './hydraulic.ts'
import { makeFluid, stepFluid } from './fluidEngine.ts'
import { heightAt, climateAt, biomeAt, seedEcology, stepEcology, velocityAt, random } from './worldSystems.ts'
import { VOXEL_DEFAULT, meshChunk, affectedChunk } from './voxelEngine.ts'
import type { VoxelSettings } from './voxelEngine.ts'
export const atlasLayers=(frequency=2)=>[{...makeLayer(1),frequency,weight:1}]
export function terrainField(cells=64,frequency=2,span=160,coast=false){
 const n=cells+1,ground=new Float32Array(n*n),layers=atlasLayers(frequency)
 for(let z=0;z<n;z++)for(let x=0;x<n;x++){const wx=(x/cells-.5)*span,wz=(z/cells-.5)*span;ground[z*n+x]=coast?heightAt(layers,null,wx,wz):sample(layers,null,wx/64,wz/64,.37)*22}
 return {ground,n,span,spacing:span/cells}
}
function measureField(ground:Float32Array,baseline:Float32Array,water:Float32Array){let cut=0,fill=0,waterMean=0;for(let i=0;i<ground.length;i++){const d=ground[i]-baseline[i];cut+=Math.max(0,-d);fill+=Math.max(0,d);waterMean+=water[i]}return {cut:cut/ground.length,fill:fill/ground.length,waterMean:waterMean/ground.length}}
export function erosionTrial(rain:number,steps:number){const f=terrainField(64,2,192),baseline=f.ground.slice(),water=new Float32Array(f.n*f.n),sediment=new Float32Array(f.n*f.n);for(let i=0;i<steps;i++)erode(f.ground,water,sediment,f.n,f.spacing,rain);return {...f,baseline,water,sediment,steps,rain,...measureField(f.ground,baseline,water)}}
export function advanceErosion(f:ReturnType<typeof erosionTrial>,steps:number){while(f.steps<steps){erode(f.ground,f.water,f.sediment,f.n,f.spacing,f.rain);f.steps++}return Object.assign(f,measureField(f.ground,f.baseline,f.water))}
export function habitatFor(moisture=.63,temperature=.75){const layers=atlasLayers();return (x:number,z:number)=>{const h=heightAt(layers,null,x,z),slope=Math.hypot(heightAt(layers,null,x+.5,z)-heightAt(layers,null,x-.5,z),heightAt(layers,null,x,z+.5)-heightAt(layers,null,x,z-.5));return {height:h,slope,...climateAt(x,z,h,{moisture,temperature})}}}
export function climateTrial(moisture:number){const habitat=habitatFor(moisture),counts=new Array<number>(7).fill(0);for(let z=-80;z<=80;z+=2)for(let x=-80;x<=80;x+=2){const c=habitat(x,z);counts[biomeAt(c.height,c.slope,0,c)]++}return {counts,trees:seedEcology(habitat,17,.75).plants.length}}
export function populationTrial(reproduction:number,seconds:number,growth=2,competition=5){const habitat=habitatFor(),ecology=seedEcology(habitat,17,.75);for(let k=0;k<Math.round(seconds*2);k++)stepEcology(ecology,habitat,.5,0,growth,reproduction,8,competition);return ecology}
export function fluidTrial(iterations:number,seconds:number){const fluid=makeFluid(40);for(let i=0;i<Math.round(seconds*60);i++)stepFluid(fluid,1/60,1.6,iterations,true,.08);return fluid}
export function windTrial(direction:number,seconds:number,speed=4,swirl=0){const rng=random(17),initial=Array.from({length:90},()=>[rng()*120-60,rng()*120-60]),points=initial.map(p=>[...p]);for(let i=0;i<Math.round(seconds*60);i++)for(const p of points){const v=velocityAt(p[0],p[1],i/60,speed,direction,swirl);p[0]+=v[0]/60;p[1]+=v[1]/60}return {initial,points,direction,seconds,speed,swirl}}
export function voxelTrial(cells:number,chunk:number,settings:VoxelSettings=VOXEL_DEFAULT){const start=performance.now();let triangles=0,samples=0,chunks=0,localChunks=0;for(let z=0;z<cells;z+=chunk)for(let y=0;y<cells;y+=chunk)for(let x=0;x<cells;x+=chunk){const mesh=meshChunk(settings,cells,[x,y,z],chunk);triangles+=mesh.positions.length/9;samples+=mesh.samples;chunks++;if(affectedChunk([x,y,z],chunk,cells,{x:8,y:6,z:12,r:4}))localChunks++}return {cells,chunk,triangles,samples,chunks,localChunks,ms:performance.now()-start}}
