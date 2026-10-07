import { test } from 'node:test'
import assert from 'node:assert/strict'
import { tideAt,biomeAt,reefSuitable,velocityAt,findPath,seedEcology,stepEcology } from '../src/worldSystems.ts'
import { density,VOXEL_DEFAULT,meshChunk,affectedChunk } from '../src/voxelEngine.ts'
import { treeSkeleton,expandTree } from '../src/natureRendering.ts'
import { makeFluid,divergenceNorm,project,stepFluid } from '../src/fluidEngine.ts'

test('tide extrema, climate classes, reef suitability and zero flow have meaningful controls',()=>{
 assert.equal(tideAt(6,2,24),2);assert.equal(tideAt(18,2,24),-2)
 assert.equal(tideAt(10,0,24),0)
 assert.equal(biomeAt(5,.1,0,{temperature:.7,moisture:.7}),4)
 assert.equal(biomeAt(5,.1,0,{temperature:.7,moisture:.1}),5)
 assert.equal(biomeAt(-1,.1,0,{temperature:.7,moisture:.7}),0)
 assert.ok(reefSuitable(3,.7,.2));assert.ok(!reefSuitable(7,.7,.2));assert.ok(!reefSuitable(3,.2,.2))
 assert.deepEqual(velocityAt(12,6,0,0,40,2),[0,0]);assert.deepEqual(velocityAt(12,6,0,2,0,0),[2,0])
})
test('A* avoids water and reports disconnected or flooded destinations',()=>{
 const n=9,h=new Float32Array(n*n).fill(2);for(let y=0;y<8;y++)h[y*n+4]=-1
 const path=findPath(h,n,1,0,8,0,10);assert.ok(path.length>9);assert.ok(path.every(i=>h[i]>0));assert.equal(path[0],0);assert.equal(path.at(-1),8)
 h[8*n+4]=-1;assert.deepEqual(findPath(h,n,1,0,8,0,10),[]);h[0]=-1;assert.deepEqual(findPath(h,n,1,0,1,0,10),[])
})
test('population stores identity, reproduces deterministically and reacts to flooding',()=>{
 const habitat=()=>({height:5,slope:.1,moisture:.7,temperature:.7})
 const a=seedEcology(habitat,17,.5),b=seedEcology(habitat,17,.5);assert.deepEqual(a,b)
 const size=a.plants[0].size;stepEcology(a,habitat,.5,0,0,0,8,3);assert.equal(a.plants[0].size,size);assert.equal(a.births,0)
 const c=seedEcology(habitat,17,.5),d=seedEcology(habitat,17,.5)
 for(let i=0;i<40;i++){stepEcology(c,habitat,.5,0,1,1,8,3);stepEcology(d,habitat,.5,0,1,1,8,3)}
 assert.deepEqual(c,d);assert.ok(c.births>0);assert.ok(c.plants.length<=300)
 for(let i=0;i<30;i++)stepEcology(c,habitat,.5,10,1,0,8,3)
 assert.equal(c.plants.length,0);assert.ok(c.deaths>0)
})
test('parallel L-system expansion has bounded counts and finite branching geometry',()=>{
 assert.equal([...expandTree(3)].filter(c=>c==='F').length,125)
 const tree=treeSkeleton(3,30);assert.equal(tree.segments.length,125);assert.ok(tree.tips.length>10)
 assert.ok(tree.segments.every(s=>[...s.a,...s.b,s.radius].every(Number.isFinite)))
})
test('CSG order changes a cave pillar; Marching Cubes retains sphere coordinates across chunks',()=>{
 assert.ok(density(2,0,4,{...VOXEL_DEFAULT,order:'cut-last'})>0)
 assert.ok(density(2,0,4,{...VOXEL_DEFAULT,order:'add-last'})<0)
 const s={...VOXEL_DEFAULT,shape:'Sphere',radius:10,cave:0}
 const mesh=meshChunk(s,32,[0,0,0],32);assert.ok(mesh.positions.length>0)
 for(let i=0;i<mesh.positions.length;i+=3)assert.ok(Math.abs(Math.hypot(...mesh.positions.slice(i,i+3))-10)<.13)
 for(let i=0;i<mesh.positions.length;i+=9){const p=mesh.positions,n=mesh.normals,a=[p[i+3]-p[i],p[i+4]-p[i+1],p[i+5]-p[i+2]],b=[p[i+6]-p[i],p[i+7]-p[i+1],p[i+8]-p[i+2]];assert.ok((a[1]*b[2]-a[2]*b[1])*n[i]+(a[2]*b[0]-a[0]*b[2])*n[i+1]+(a[0]*b[1]-a[1]*b[0])*n[i+2]>=-1e-6)}
 let parts=0;for(let z=0;z<32;z+=16)for(let y=0;y<32;y+=16)for(let x=0;x<32;x+=16)parts+=meshChunk(s,32,[x,y,z],16).positions.length
 assert.equal(parts,mesh.positions.length)
 assert.ok(affectedChunk([16,16,16],16,48,{x:1,y:1,z:1,r:4}));assert.ok(!affectedChunk([0,0,0],16,48,{x:18,y:18,z:18,r:2}))
})
test('pressure projection reduces divergence; fluid steps stay finite with nonnegative dye',()=>{
 const f=makeFluid(24);for(let y=0;y<24;y++)for(let x=0;x<24;x++){f.u[y*24+x]=Math.sin(x/24*Math.PI*2);f.v[y*24+x]=Math.sin(y/24*Math.PI*2)}
 const before=divergenceNorm(f);project(f,80);assert.ok(divergenceNorm(f)<before*.4)
 for(let i=0;i<120;i++)stepFluid(f,1/60,1.6,40,true,.08)
 assert.ok([...f.u,...f.v,...f.dye].every(Number.isFinite));assert.ok(f.dye.every(v=>v>=0&&v<=1));assert.ok(f.after<=f.before+1e-6)
})
