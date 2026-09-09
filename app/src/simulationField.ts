export type FieldStats = { cut: number; fill: number; changed: number; water: number }
export function measureField(ground:Float32Array, baseline:Float32Array, water:Float32Array):FieldStats {
 let cut=0,fill=0,changed=0,total=0
 for(let i=0;i<ground.length;i++){
  const delta=ground[i]-baseline[i]
  cut=Math.max(cut,-delta);fill=Math.max(fill,delta)
  if(Math.abs(delta)>.01)changed++
  total+=water[i]
 }
 return {cut,fill,changed:100*changed/ground.length,water:total/ground.length}
}
/** Add a smooth, bounded rain pulse in world units to a fixed terrain grid. */
export function rainAt(water:Float32Array,n:number,span:number,x:number,z:number,radius=14,dose=.8){
 let added=0
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){
  const distance=Math.hypot(i/(n-1)*span-span/2-x,j/(n-1)*span-span/2-z)
  if(distance<radius){const amount=dose*(1-distance/radius)**2;water[j*n+i]+=amount;added+=amount}
 }
 return added
}
