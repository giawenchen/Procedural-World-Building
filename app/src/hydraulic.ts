/** Educational grid hydraulic model. Closed edges retain water and sediment. */
export function erode(ground:Float32Array,water:Float32Array,sediment:Float32Array,n:number,spacing:number,rain:number){
 const dw=new Float32Array(ground.length),ds=new Float32Array(ground.length)
 // Rainfall and local erosion/deposition. All terrain changes exchange with sediment.
 for(let i=0;i<ground.length;i++) water[i]+=rain
 for(let j=0;j<n;j++)for(let k=0;k<n;k++){
  const i=j*n+k,level=ground[i]+water[i]
  let target=-1,drop=0
  for(const q of [k>0?i-1:-1,k<n-1?i+1:-1,j>0?i-n:-1,j<n-1?i+n:-1])if(q>=0){const d=level-ground[q]-water[q];if(d>drop){drop=d;target=q}}
  if(target<0)continue
  const flow=Math.min(water[i]*.45,drop*.25)
  const capacity=flow*(drop/spacing)*8
  if(sediment[i]<capacity){const removed=Math.min((capacity-sediment[i])*.12,.025);ground[i]-=removed;sediment[i]+=removed}
  else {const deposited=(sediment[i]-capacity)*.12;ground[i]+=deposited;sediment[i]-=deposited}
  const carried=water[i]>0?sediment[i]*flow/water[i]:0
  dw[i]-=flow;dw[target]+=flow;ds[i]-=carried;ds[target]+=carried
 }
 for(let i=0;i<ground.length;i++){
  water[i]=Math.max(0,water[i]+dw[i])*.985
  sediment[i]=Math.max(0,sediment[i]+ds[i])
  if(water[i]<.001){ground[i]+=sediment[i];sediment[i]=0}
 }
}
