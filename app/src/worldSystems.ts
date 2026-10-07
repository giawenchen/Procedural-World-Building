import { sample } from './noiseEngine.ts'
import type { Layer } from './noiseEngine.ts'

export const clamp = (v:number,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v))
export function random(seed:number) { let n=seed>>>0; return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296} }
export const hash=(x:number,z:number)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n)}
export type Climate={temperature:number;moisture:number}
export const BIOMES=['Ocean','Beach','Wetland','Meadow','Forest','Dry scrub','Alpine'] as const
export const BIOME_COLORS=['#4d9ea9','#e9c78d','#799f87','#bdbe79','#628c6b','#d49f75','#aaaabc']
export function heightAt(layers:Layer[],solo:number|null,x:number,z:number,relief=1){
 const island=20*Math.exp(-(x*x/3300+z*z/2600))-8
 const ridge=12*Math.exp(-((x+8)**2/1300+(z+20)**2/160))
 return island+relief*(ridge+sample(layers,solo,x/95,z/95,.37)*9)
}
export function climateAt(x:number,z:number,h:number,climate:Climate){
 return {temperature:clamp(climate.temperature-h*.017+Math.sin(x*.035)*.1),moisture:clamp(climate.moisture+Math.sin(z*.045+x*.013)*.28-h*.004)}
}
export function biomeAt(h:number,slope:number,sea:number,c:Climate){
 if(h<sea)return 0
 if(h<sea+1.3)return 1
 if(c.temperature<.26||slope>1.15)return 6
 if(c.moisture>.73&&h<sea+6)return 2
 if(c.moisture<.28)return 5
 if(c.moisture>.49)return 4
 return 3
}
export function tideAt(time:number,amplitude:number,period:number,mean=0){return mean+amplitude*Math.sin(time*Math.PI*2/Math.max(1,period))}
export function velocityAt(x:number,z:number,time:number,speed:number,direction:number,swirl:number):[number,number]{
 const a=direction*Math.PI/180,falloff=Math.exp(-(x*x+z*z)/6000)
 return [speed*(Math.cos(a)-swirl*z*.035*falloff+Math.sin(z*.06+time*.1)*.13*swirl),speed*(Math.sin(a)+swirl*x*.035*falloff+Math.cos(x*.05+time*.1)*.13*swirl)]
}
export function reefSuitable(depth:number,temp:number,slope:number){return depth>.4&&depth<6&&temp>.48&&slope<.8}
export type Plant={id:number;x:number;z:number;age:number;size:number;health:number;species:number;lastSeed:number}
export type Ecology={plants:Plant[];time:number;births:number;deaths:number;nextId:number;seed:number}
export type Habitat=(x:number,z:number)=>{height:number;slope:number;moisture:number;temperature:number}
export function seedEcology(habitat:Habitat,seed=17,density=.65):Ecology {
 const rng=random(seed),plants:Plant[]=[]
 for(let z=-60;z<=60;z+=7)for(let x=-60;x<=60;x+=7){
  const px=x+(rng()-.5)*5,pz=z+(rng()-.5)*5,c=habitat(px,pz)
  if(rng()>density||c.height<2||c.height>25||c.slope>.85||c.moisture<.24)continue
  plants.push({id:plants.length,x:px,z:pz,age:5+rng()*15,size:.45+rng()*.55,health:1,species:rng()>.6?1:0,lastSeed:0})
 }
 return {plants,time:0,births:0,deaths:0,nextId:plants.length,seed}
}
// Educational population model. Time is model seconds, not biological years.
export function stepEcology(state:Ecology,habitat:Habitat,dt:number,sea:number,growth:number,reproduction:number,dispersal:number,competition:number){
 state.time+=dt
 const born:Plant[]=[]
 for(const p of state.plants){
  p.age+=dt
  const c=habitat(p.x,p.z),neighbors=state.plants.filter(q=>q.id!==p.id&&Math.hypot(q.x-p.x,q.z-p.z)<competition).length
  const suitable=c.height>sea+.3&&c.temperature>.15&&c.moisture>.2&&c.slope<1.1
  p.health=clamp(p.health+dt*(suitable?.025-neighbors*.012:-.18))
  p.size=clamp(p.size+growth*dt*.04*p.health/(1+neighbors*.3),.08,1.3)
  if(p.age>75)p.health-=dt*.03
  if(reproduction>0&&p.size>.7&&p.health>.65&&state.time-p.lastSeed>8/reproduction&&state.plants.length+born.length<300){
   p.lastSeed=state.time
   const rng=random(state.seed+p.id*719+Math.floor(state.time)*97),a=rng()*Math.PI*2,r=2+rng()*dispersal
   const x=p.x+Math.cos(a)*r,z=p.z+Math.sin(a)*r,candidate=habitat(x,z)
   if(Math.abs(x)>73||Math.abs(z)>73||candidate.height<sea+1.3||candidate.slope>.85||candidate.moisture<.24)continue
   if([...state.plants,...born].some(q=>Math.hypot(q.x-x,q.z-z)<2.5))continue
   born.push({id:state.nextId++,x,z,age:0,size:.12,health:1,species:p.species,lastSeed:state.time})
  }
 }
 const survivors=state.plants.filter(p=>p.health>0)
 state.deaths+=state.plants.length-survivors.length;state.births+=born.length;state.plants=[...survivors,...born]
}
// A* on a bounded grid. Water is impassable; slope adds traversal cost.
export function findPath(heights:Float32Array,n:number,spacing:number,start:number,end:number,sea:number,slopeCost:number){
 if(start<0||end<0||start>=n*n||end>=n*n||heights[start]<sea+.2||heights[end]<sea+.2)return []
 const cost=new Float64Array(n*n).fill(Infinity),parent=new Int32Array(n*n).fill(-1),closed=new Uint8Array(n*n),open=new Set<number>([start]);cost[start]=0
 const heuristic=(i:number)=>Math.hypot(i%n-end%n,Math.floor(i/n)-Math.floor(end/n))*spacing
 while(open.size){
  let current=-1,best=Infinity
  for(const i of open){const score=cost[i]+heuristic(i);if(score<best){best=score;current=i}}
  if(current===end){const path:number[]=[];for(let i=end;i!==-1;i=parent[i])path.push(i);return path.reverse()}
  open.delete(current);closed[current]=1
  const x=current%n,z=Math.floor(current/n)
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
   const nx=x+dx,nz=z+dz;if(nx<0||nz<0||nx>=n||nz>=n)continue
   const j=nz*n+nx;if(closed[j]||heights[j]<sea+.2)continue
   if(dx&&dz&&(heights[z*n+nx]<sea+.2||heights[nz*n+x]<sea+.2))continue
   const distance=spacing*Math.hypot(dx,dz),slope=Math.abs(heights[j]-heights[current])/distance
   const next=cost[current]+distance*(1+slopeCost*slope*slope)
   if(next<cost[j]){cost[j]=next;parent[j]=current;open.add(j)}
  }
 }
 return []
}
