import { triTable, edgeTable } from 'three/examples/jsm/objects/MarchingCubes.js'
export type VoxelSettings={shape:string;radius:number;cave:number;order:string;iso:number;cut:{x:number;y:number;z:number;r:number}|null}
export const VOXEL_DEFAULT:VoxelSettings={shape:'Terrain',radius:13,cave:5,order:'cut-last',iso:0,cut:null}
export function density(x:number,y:number,z:number,s:VoxelSettings){
 let base=s.shape==='Sphere'?Math.hypot(x,y,z)-s.radius:s.shape==='Noise volume'?Math.hypot(x,y,z)-s.radius+2*Math.sin(x*.4)*Math.cos(y*.4)*Math.sin(z*.4):s.shape==='Box'?Math.max(Math.abs(x)-s.radius,Math.abs(y)-s.radius*.65,Math.abs(z)-s.radius):Math.max(y-(6+3*Math.sin(x*.16)*Math.cos(z*.12)+(s.shape==='Ridged'?2*Math.abs(Math.sin(x*.5+z*.3)):0)),Math.abs(x)-19,Math.abs(z)-19,-y-12)
 const cutter=Math.hypot(x-2,y)-s.cave,pillar=Math.max(Math.hypot(x-2,z-4)-2.6,Math.abs(y)-10)
 if(s.cave>0)base=s.order==='cut-last'?Math.max(Math.min(base,pillar),-cutter):Math.min(Math.max(base,-cutter),pillar)
 if(s.order==='intersection')base=Math.max(base,Math.hypot(x,y,z)-s.radius)
 if(s.cut)base=Math.max(base,s.cut.r-Math.hypot(x-s.cut.x,y-s.cut.y,z-s.cut.z))
 return base-s.iso
}
const corners=[[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]]
const edges=[[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]
export function meshChunk(settings:VoxelSettings,cells:number,start:number[],size:number){
 const spacing=48/cells,n=size+1,field=new Float32Array(n*n*n),positions:number[]=[],normals:number[]=[]
 const idx=(x:number,y:number,z:number)=>x+n*(y+n*z)
 for(let z=0;z<n;z++)for(let y=0;y<n;y++)for(let x=0;x<n;x++)field[idx(x,y,z)]=density(-24+(start[0]+x)*spacing,-24+(start[1]+y)*spacing,-24+(start[2]+z)*spacing,settings)
 const intersections:number[][]=Array.from({length:12},()=>[0,0,0])
 for(let z=0;z<size;z++)for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  const values=corners.map(c=>field[idx(x+c[0],y+c[1],z+c[2])]);let mask=0;values.forEach((v,i)=>{if(v<0)mask|=1<<i});if(!edgeTable[mask])continue
  edges.forEach(([a,b],i)=>{if(!(edgeTable[mask]&(1<<i)))return;const t=values[a]/(values[a]-values[b]);intersections[i]=[0,1,2].map(axis=>-24+(start[axis]+[x,y,z][axis]+corners[a][axis]+t*(corners[b][axis]-corners[a][axis]))*spacing)})
  for(let t=0;t<16&&triTable[mask*16+t]!==-1;t++){
   const p=intersections[triTable[mask*16+t]],e=.04
   positions.push(...p)
   const normal=[density(p[0]+e,p[1],p[2],settings)-density(p[0]-e,p[1],p[2],settings),density(p[0],p[1]+e,p[2],settings)-density(p[0],p[1]-e,p[2],settings),density(p[0],p[1],p[2]+e,settings)-density(p[0],p[1],p[2]-e,settings)],length=Math.hypot(...normal)||1
   normals.push(...normal.map(v=>v/length))
  }
 }
 // Align triangle winding with the outward density gradient, including cavity walls.
 for(let i=0;i<positions.length;i+=9){
  const a=[positions[i+3]-positions[i],positions[i+4]-positions[i+1],positions[i+5]-positions[i+2]],b=[positions[i+6]-positions[i],positions[i+7]-positions[i+1],positions[i+8]-positions[i+2]]
  const dot=(a[1]*b[2]-a[2]*b[1])*normals[i]+(a[2]*b[0]-a[0]*b[2])*normals[i+1]+(a[0]*b[1]-a[1]*b[0])*normals[i+2]
  if(dot<0)for(let k=0;k<3;k++){[positions[i+3+k],positions[i+6+k]]=[positions[i+6+k],positions[i+3+k]];[normals[i+3+k],normals[i+6+k]]=[normals[i+6+k],normals[i+3+k]]}
 }
 return {positions:new Float32Array(positions),normals:new Float32Array(normals),samples:field.length}
}
export function affectedChunk(start:number[],size:number,cells:number,cut:NonNullable<VoxelSettings['cut']>){
 const spacing=48/cells;let d=0
 for(let axis=0;axis<3;axis++){const low=-24+start[axis]*spacing,high=low+size*spacing,v=[cut.x,cut.y,cut.z][axis];d+=(v<low?low-v:v>high?v-high:0)**2}
 return d<=(cut.r+spacing)**2
}
