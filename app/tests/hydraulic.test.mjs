import { test } from 'node:test'
import assert from 'node:assert/strict'
import { erode } from '../src/hydraulic.ts'
import { measureField, rainAt } from '../src/simulationField.ts'
const sum = values => values.reduce((a,b)=>a+b,0)

test('rain brush stays local and adds no sediment or terrain displacement',()=>{
 const n=25,span=48,water=new Float32Array(n*n)
 const added=rainAt(water,n,span,0,0,8,.8)
 assert.ok(added>0)
 assert.ok(Math.abs(water[12*n+12]-.8)<1e-6)
 assert.equal(water[0],0)
 for(let j=0;j<n;j++)for(let i=0;i<n;i++)if(Math.hypot(i*2-24,j*2-24)>=8)assert.equal(water[j*n+i],0)
 assert.ok(Math.abs(sum(water)-added)<1e-5)
})

test('erosion exchanges terrain and sediment, water remains finite and nonnegative',()=>{
 const n=24,ground=Float32Array.from({length:n*n},(_,i)=>10-(i%n)*.2+Math.sin(i)*.1)
 const baseline=ground.slice(),water=new Float32Array(n*n),sediment=new Float32Array(n*n),initial=sum(ground)
 rainAt(water,n,48,0,0)
 for(let step=0;step<300;step++)erode(ground,water,sediment,n,2,.015)
 assert.ok(ground.every(Number.isFinite));assert.ok(water.every(x=>Number.isFinite(x)&&x>=0));assert.ok(sediment.every(x=>Number.isFinite(x)&&x>=0))
 assert.ok(Math.abs(sum(ground)+sum(sediment)-initial)<.05)
 const stats=measureField(ground,baseline,water)
 assert.ok(stats.cut>.01);assert.ok(stats.changed>0)
 assert.ok(baseline.every((x,i)=>Math.abs(x-(10-(i%n)*.2+Math.sin(i)*.1))<1e-6))
})

test('dry weather reduces total water and resetting fields clears change measurements',()=>{
 const n=8,ground=new Float32Array(n*n),baseline=ground.slice(),water=new Float32Array(n*n).fill(.5),sediment=new Float32Array(n*n)
 const initial=sum(water)
 for(let step=0;step<50;step++)erode(ground,water,sediment,n,2,0)
 assert.ok(sum(water)<initial)
 ground.set(baseline);water.fill(0);sediment.fill(0)
 assert.deepEqual(measureField(ground,baseline,water),{cut:0,fill:0,changed:0,water:0})
})

test('change metrics distinguish cut from deposition with a fixed threshold',()=>{
 const baseline=new Float32Array([1,1,1,1]),ground=new Float32Array([.5,1.25,1.005,1]),water=new Float32Array([0,1,0,1])
 assert.deepEqual(measureField(ground,baseline,water),{cut:.5,fill:.25,changed:50,water:.5})
})
