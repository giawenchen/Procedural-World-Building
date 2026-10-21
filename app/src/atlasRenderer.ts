import * as THREE from 'three'
import { terrainField, erosionTrial, advanceErosion, habitatFor, climateTrial, populationTrial, fluidTrial, windTrial, atlasLayers, voxelTrial } from './atlasExperiments'
import { createIllustratedPlanet } from './illustratedPlanet'
import { BIOME_COLORS, BIOMES, biomeAt, heightAt, tideAt, findPath, velocityAt, hash } from './worldSystems'
import { buildTree, foliageMaterial, terrainMaterial, disposeScene } from './natureRendering'
import { meshChunk, VOXEL_DEFAULT, density, affectedChunk } from './voxelEngine'
import { stepFluid } from './fluidEngine'
import { mix, type AtlasFrame, type AtlasRequest, type AtlasControl } from './atlasProgram'
import type { VoxelSettings } from './voxelEngine'

const C=(label:string,value:number,min:number,max:number,note:string,active=false,unit=''):AtlasControl=>({label,value,min,max,note,active,unit})
const cloneCanvas=(source:HTMLCanvasElement)=>{const c=document.createElement('canvas');c.width=source.width;c.height=source.height;c.getContext('2d')!.drawImage(source,0,0);return c}
const basePalette=(h:number)=>new THREE.Color(h<0?'#589ea4':h<2?'#d9be83':h<9?'#a8b582':h<15?'#6f9476':'#a59a8d')
export class AtlasRenderer {
 readonly renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true})
 readonly scene=new THREE.Scene()
 readonly camera=new THREE.PerspectiveCamera(42,1040/510,.1,900)
 group=new THREE.Group()
 readonly canvas=document.createElement('canvas')
 private pairs=[new THREE.Group(),new THREE.Group()]
 private pairKeys=['','']
 private populationCache=new Map<string,ReturnType<typeof populationTrial>>()
 private climateCache=new Map<number,ReturnType<typeof climateTrial>>()
 private finalErosion=erosionTrial(.05,0)
 private kind=''
 private key=''
 private reference:HTMLCanvasElement|undefined
 private referenceMetrics=''
 private erosion=[erosionTrial(.005,0),erosionTrial(.05,0)]
 private fluids=[fluidTrial(0,0),fluidTrial(40,0)]
 private planet:THREE.Group|null=null
 private timings=new Map<string,ReturnType<typeof voxelTrial>&{medianMs:number}>()
 constructor(){
  this.renderer.setSize(1040,510);this.renderer.setPixelRatio(1);this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.15
  this.scene.background=new THREE.Color('#e9e2d5');this.scene.add(new THREE.HemisphereLight('#fff3d4','#76858f',2.3))
  const sun=new THREE.DirectionalLight('#ffe8c4',3);sun.position.set(-65,90,50);this.scene.add(sun,this.group)
  this.canvas.width=1040;this.canvas.height=510
 }
 dispose(){this.resetPairs();this.clear();this.renderer.dispose()}
 private clear(){disposeScene(this.group as unknown as THREE.Scene);this.group.clear();this.key='';this.planet=null}
 private resetPairs(){for(const g of this.pairs){disposeScene(g as unknown as THREE.Scene);g.clear()}this.pairKeys=['','']}
 private pairedView(index:number,key:string,build:()=>void,orbit:number){const main=this.group;this.scene.remove(main);this.group=this.pairs[index];this.scene.add(this.group);if(this.pairKeys[index]!==key){this.clear();build();this.pairKeys[index]=key}this.draw(orbit);this.scene.remove(this.group);this.group=main;this.scene.add(main)}
 private population(rate:number,time:number,growth=2,competition=5){const key=growth+':'+competition+':'+rate+':'+time;let result=this.populationCache.get(key);if(!result){result=populationTrial(rate,time,growth,competition);this.populationCache.set(key,result)}return result}
 private climate(moisture:number){let result=this.climateCache.get(moisture);if(!result){result=climateTrial(moisture);this.climateCache.set(moisture,result)}return result}
 prepare(){for(const [cells,chunk] of [[32,16],[48,16],[64,16],[48,8]])this.timing(cells,chunk);for(const chunk of [16,8])this.timing(48,chunk,{...VOXEL_DEFAULT,cut:{x:8,y:6,z:12,r:4}})}
 private cameraAt(orbit:number,kind='terrain'){
  if(kind==='tree'){const a=.6+orbit;this.camera.position.set(Math.sin(a)*13,6,Math.cos(a)*13);this.camera.lookAt(0,3,0)}
  else if(kind==='voxel'){const a=.17+orbit;this.camera.position.set(Math.sin(a)*83,15,Math.cos(a)*83);this.camera.lookAt(0,0,0)}
  else if(kind==='planet'){this.camera.position.set(0,1.8,8.2);this.camera.lookAt(0,0,0)}
  else{const a=.68+orbit;this.camera.position.set(Math.sin(a)*219,140,Math.cos(a)*219);this.camera.lookAt(0,0,0)}
 }
 private draw(orbit:number,kind='terrain'){
  this.cameraAt(orbit,kind);this.renderer.render(this.scene,this.camera)
  const c=this.canvas.getContext('2d')!;c.clearRect(0,0,1040,510);c.drawImage(this.renderer.domElement,0,0)
  return this.canvas
 }
 private tag(lines:string[]){const c=this.canvas.getContext('2d')!;c.fillStyle='#f6f3e9ec';c.fillRect(195,510-lines.length*23-18,Math.min(650,Math.max(...lines.map(s=>s.length))*7.6+24),lines.length*23+8);c.font='13px Arial';c.fillStyle='#43553f';lines.forEach((l,i)=>c.fillText(l,205,510-(lines.length-1-i)*23-18))}
 private plane(field:ReturnType<typeof terrainField>,mode='land',parameter=.63,water=false,delta?:Float32Array){
  const g=new THREE.PlaneGeometry(field.span,field.span,field.n-1,field.n-1);g.rotateX(-Math.PI/2)
  const p=g.getAttribute('position'),colors=new Float32Array(p.count*3),habitat=habitatFor(parameter)
  for(let i=0;i<p.count;i++){const h=field.ground[i];p.setY(i,h);let color=basePalette(h)
   if(mode==='climate'){const v=habitat(p.getX(i),p.getZ(i));color=new THREE.Color(BIOME_COLORS[biomeAt(v.height,v.slope,0,v)])}
   if(mode==='change'){const d=delta?.[i]??0;color=new THREE.Color('#e8e3d4').lerp(new THREE.Color(d<0?'#aa603f':'#3f9c9d'),Math.min(1,Math.abs(d)/.5))}
   color.toArray(colors,i*3)
  }
  g.setAttribute('color',new THREE.BufferAttribute(colors,3));g.computeVertexNormals()
  const material=mode==='change'||mode==='climate'?new THREE.MeshBasicMaterial({vertexColors:true}):terrainMaterial()
  if(mode==='shader'){
   const mat=material as THREE.MeshStandardMaterial;mat.onBeforeCompile=shader=>{shader.uniforms.snowLine={value:parameter};shader.vertexShader='varying float atlasHeight;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\natlasHeight=position.y;');shader.fragmentShader='varying float atlasHeight; uniform float snowLine;\n'+shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,vec3(.94,.94,.88),smoothstep(snowLine-.4,snowLine+.8,atlasHeight));')}
  }
  const mesh=new THREE.Mesh(g,material);this.group.add(mesh)
  if(mode==='wire'){const lines=new THREE.LineSegments(new THREE.WireframeGeometry(g),new THREE.LineBasicMaterial({color:'#f9f2d7',transparent:true,opacity:.48}));this.group.add(lines)}
  if(water){const sea=new THREE.Mesh(new THREE.PlaneGeometry(field.span,field.span),new THREE.MeshStandardMaterial({color:'#539fae',transparent:true,opacity:.82,roughness:.28,metalness:.08}));sea.rotation.x=-Math.PI/2;this.group.add(sea)}
 }
 private tree(iterations:number,angle:number){const t=buildTree(iterations,angle);t.foliage.dispose();const trunk=new THREE.Mesh(t.branches,new THREE.MeshStandardMaterial({color:'#715346',roughness:1}));this.group.add(trunk);const grid=new THREE.GridHelper(12,12,'#adb7a2','#d2d0be');this.group.add(grid);return t.segments}
 private plants(ecology:ReturnType<typeof populationTrial>){
  const t=buildTree(2,30),trunks=new THREE.InstancedMesh(t.branches,new THREE.MeshStandardMaterial({color:'#654a4c',roughness:1}),300),leaves=new THREE.InstancedMesh(t.foliage,foliageMaterial(),300),dummy=new THREE.Object3D(),color=new THREE.Color();trunks.count=leaves.count=ecology.plants.length
  ecology.plants.forEach((p,i)=>{dummy.position.set(p.x,heightAt(atlasLayers(),null,p.x,p.z),p.z);dummy.rotation.set(0,hash(p.id,4)*6.28,0);dummy.scale.setScalar(p.size*(p.species?2.1:2.6));dummy.updateMatrix();trunks.setMatrixAt(i,dummy.matrix);leaves.setMatrixAt(i,dummy.matrix);color.set(p.species?'#d9af54':'#7f9962');leaves.setColorAt(i,color)})
  trunks.instanceMatrix.needsUpdate=leaves.instanceMatrix.needsUpdate=true;this.group.add(trunks,leaves)
  const seedlings=ecology.plants.filter(p=>p.id>=104),positions:number[]=[];for(const p of seedlings)positions.push(p.x,heightAt(atlasLayers(),null,p.x,p.z)+.6,p.z);if(positions.length){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));this.group.add(new THREE.Points(g,new THREE.PointsMaterial({color:'#de905b',size:4,sizeAttenuation:false,depthTest:false})))}
 }
 private voxels(s:VoxelSettings,cells=48,chunk=16,bounds=false,onlyLocal=false,localUpdate=false){let triangles=0,chunks=0
  for(let z=0;z<cells;z+=chunk)for(let y=0;y<cells;y+=chunk)for(let x=0;x<cells;x+=chunk){const chunkKey=[x,y,z].join(':');if(localUpdate&&!affectedChunk([x,y,z],chunk,cells,s.cut!)){const existing=this.group.children.find(o=>o.userData.chunkKey===chunkKey);triangles+=(existing?.userData.triangles??0);chunks++;continue}if(localUpdate){for(const o of [...this.group.children].filter(o=>o.userData.chunkKey===chunkKey)){disposeScene(o as unknown as THREE.Scene);this.group.remove(o)}}const data=meshChunk(s,cells,[x,y,z],chunk);triangles+=data.positions.length/9;chunks++;const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(data.positions,3));g.setAttribute('normal',new THREE.BufferAttribute(data.normals,3));const colors=new Float32Array(data.positions.length),color=new THREE.Color()
   for(let i=0;i<data.positions.length;i+=3){color.set(data.normals[i+1]>.65&&data.positions[i+1]>2?'#acb582':data.normals[i+1]<-.15?'#787080':'#bc9874');color.toArray(colors,i)}g.setAttribute('color',new THREE.BufferAttribute(colors,3));const mesh=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,side:THREE.DoubleSide}));mesh.userData={chunkKey,triangles:data.positions.length/9};this.group.add(mesh)
   if(bounds){const spacing=48/cells,low=new THREE.Vector3(x*spacing-24,y*spacing-24,z*spacing-24),hi=low.clone().addScalar(chunk*spacing),cut=new THREE.Vector3(8,6,12),near=new THREE.Box3(low,hi).distanceToPoint(cut)<=4+spacing;if(!onlyLocal||near){const box=new THREE.Box3Helper(new THREE.Box3(low,hi),near?'#b57142':'#c9c8b8');box.userData.chunkKey=chunkKey;this.group.add(box)}}
  }return {triangles,chunks}
 }
 private slice(s:VoxelSettings){const c=this.canvas.getContext('2d')!,size=116,img=c.createImageData(size,size);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const inside=density(x/(size-1)*48-24,24-y/(size-1)*48,0,s)<0;img.data.set(inside?[92,121,94,255]:[246,242,224,255],(y*size+x)*4)}c.putImageData(img,894,45);c.fillStyle='#43553f';c.font='12px Arial';c.fillText('X/Y slice · Z = 0',894,33)}
 private timing(cells:number,chunk:number,settings:VoxelSettings=VOXEL_DEFAULT){const key=cells+':'+chunk+JSON.stringify(settings);let result=this.timings.get(key);if(!result){const trials=Array.from({length:3},()=>voxelTrial(cells,chunk,settings));result={...trials[0],medianMs:trials.map(t=>t.ms).sort((a,b)=>a-b)[1]};this.timings.set(key,result)}return result}
 private twoDimensional(kind:'wind'|'fluid',r:AtlasRequest,variant:number){
  const c=this.canvas.getContext('2d')!,w=1040,h=510;c.fillStyle='#e8e3d5';c.fillRect(0,0,w,h)
  if(kind==='wind'){
   const t=mix(0,8,r.p),dir=variant===0?0:90,f=windTrial(dir,t)
   c.strokeStyle='#c1c5b6';c.lineWidth=1;for(let x=0;x<w;x+=65){c.beginPath();c.moveTo(x,0);c.lineTo(x,h);c.stroke()}for(let y=0;y<h;y+=64){c.beginPath();c.moveTo(0,y);c.lineTo(w,y);c.stroke()}
   f.points.forEach((p,i)=>{const a=f.initial[i],x=(a[0]+100)/200*w,y=(a[1]+100)/200*h,xx=(p[0]+100)/200*w,yy=(p[1]+100)/200*h;c.strokeStyle='#789d86';c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();c.fillStyle='#3e715f';c.beginPath();c.arc(xx,yy,3,0,Math.PI*2);c.fill()})
   for(let y=55;y<h;y+=82)for(let x=65;x<w;x+=120){const v=velocityAt(0,0,0,4,dir,0);this.arrow(c,x,y,v[0]*6,v[1]*6)}this.tag([`DIRECTION ${dir}° / time ${t.toFixed(1)} s / distance ${(4*t).toFixed(1)} u`]);return {time:t,distance:4*t,direction:dir}
  }
  const target=Math.round(mix(0,8,r.p)*60),f=this.fluids[variant];if(f.time*60>target+.1)this.fluids[variant]=fluidTrial(variant?40:0,0)
  const field=this.fluids[variant];while(Math.round(field.time*60)<target)stepFluid(field,1/60,1.6,variant?40:0,true,.08)
  const img=document.createElement('canvas');img.width=img.height=40;const cc=img.getContext('2d')!,im=cc.createImageData(40,40);for(let i=0;i<field.dye.length;i++){const d=Math.min(1,field.dye[i]);im.data.set([235-d*183,229-d*88,209-d*64,255],i*4)}cc.putImageData(im,0,0);c.drawImage(img,0,0,w,h)
  for(let y=30;y<510;y+=60)for(let x=30;x<1040;x+=80){const i=Math.floor(y/h*40)*40+Math.floor(x/w*40);this.arrow(c,x,y,field.u[i]*2,field.v[i]*2)}
  this.tag([`PRESSURE ${variant?40:0} iterations / t = ${field.time.toFixed(1)} s`,`RMS divergence ${field.before.toFixed(5)} → ${field.after.toFixed(5)}`]);return {time:field.time,before:field.before,after:field.after}
 }
 private arrow(c:CanvasRenderingContext2D,x:number,y:number,u:number,v:number){const l=Math.hypot(u,v),a=Math.atan2(v,u),scale=Math.min(1,30/(l||1)),xx=x+u*scale,yy=y+v*scale;c.strokeStyle='#486d62';c.lineWidth=1.8;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.lineTo(xx-5*Math.cos(a-.5),yy-5*Math.sin(a-.5));c.moveTo(xx,yy);c.lineTo(xx-5*Math.cos(a+.5),yy-5*Math.sin(a+.5));c.stroke()}
 private globe(r:AtlasRequest){
  // Rebuild the scalar field at 2 Hz; rotation and tracers remain continuous.
  const finale=r.kind==='planet',t=finale?r.local:0,fieldTime=Math.floor(t*2)/2,frequency=2+.6*Math.sin(fieldTime*.2),relief=.23+.09*Math.sin(fieldTime*.24),sea=.015+.07*Math.sin(fieldTime*.32),moisture=.55+.25*Math.sin(fieldTime*.19),temperature=.66+.18*Math.sin(fieldTime*.16),wind=1.5+1.2*Math.sin(t*.26),key=[frequency,relief,sea,moisture,temperature].join(':')
  if(key!==this.key){this.clear();const planet=new THREE.Group()
   planet.add(createIllustratedPlanet({radius:2,resolution:128,relief,frequency,sea,moisture,temperature}))
   this.group.add(planet);this.planet=planet;this.key=key
  }
  if(this.planet)this.planet.rotation.set(.13,t/32*Math.PI*2,0)
  this.draw(0,'planet')
  const c=this.canvas.getContext('2d')!;c.strokeStyle='#83b5aa77';c.lineWidth=1.4
  // Moving atmospheric tracers: prescribed visual field, not a weather solver.
  for(let i=0;i<18;i++){const angle=i*.35+t*wind*.035,cx=520+Math.cos(angle)*204,cy=255+Math.sin(angle)*105;c.beginPath();c.arc(cx,cy,2,0,Math.PI*2);c.stroke()}
  if(!finale){c.fillStyle='#43553f';c.font='bold 15px Arial';c.fillText('SESSIONS 1–2 / HOW THIS WAS BUILT',18,65);c.font='14px Arial';['Question → AI prompt','React → controls','Three.js → visual rules','Test → observe → document'].forEach((line,i)=>c.fillText(line,18,95+i*26))}
  if(finale){this.tag(['Terrain → water → habitat → life','Planet: noise + sea level + climate zones. Insets are separate experiments.']);this.finaleInsets(r)}
  return {frequency,relief,sea,moisture,temperature,wind}
 }
 private finaleInsets(r:AtlasRequest){const c=this.canvas.getContext('2d')!,p=r.local/32,field=advanceErosion(this.finalErosion,Math.round(100*p)),s={...VOXEL_DEFAULT,cave:5*(.5+.5*Math.sin(r.local*.3))};
  c.fillStyle='#f7f3e9ec';c.fillRect(10,55,155,141);c.fillRect(875,55,155,141);c.fillRect(875,324,155,141)
  c.font='11px Arial';c.fillStyle='#43533e';c.fillText('EROSION / 0–100 steps',18,74);c.fillText('DENSITY / cave radius',883,74);c.fillText('VECTOR FIELD / wind',883,343)
  for(let z=0;z<64;z++)for(let x=0;x<64;x++){const i=z*65+x,d=field.ground[i]-field.baseline[i];c.fillStyle=new THREE.Color('#ebe4d3').lerp(new THREE.Color(d<0?'#aa684a':'#549e9b'),Math.min(1,Math.abs(d)/.5)).getStyle();c.fillRect(20+x*2,83+z*1.6,2,1.7);c.fillStyle=density(x/63*48-24,24-z/63*48,0,s)<0?'#799579':'#f4e9cc';c.fillRect(885+x*2,83+z*1.6,2,1.7)}
  for(let y=362;y<454;y+=24)for(let x=891;x<1018;x+=25){const v=velocityAt((x-948)*1.5,(y-411)*1.5,r.local,2,r.local*8,1);this.arrow(c,x,y,v[0]*5,v[1]*5)}
 }
 render(r:AtlasRequest):AtlasFrame {
  if(r.kind!==this.kind){this.resetPairs();this.clear();this.kind=r.kind;this.reference=undefined;this.referenceMetrics='';if(r.kind==='erosion')this.erosion=[erosionTrial(.005,0),erosionTrial(.05,0)];if(r.kind==='planet')this.finalErosion=erosionTrial(.05,0);if(r.kind==='fluid')this.fluids=[fluidTrial(0,0),fluidTrial(40,0)]}
  let caption='',metrics='',controls:AtlasControl[]=[],notes:string[]=[],paired=false,label='',referenceLabel='',measurements:Record<string,unknown>={}
  const orbit=r.compare?0:r.orbit,quant=(v:number,step=.1)=>Math.round(v/step)*step
  if(['intro','planet'].includes(r.kind)){
   const v=this.globe(r);controls=[C('Noise frequency',v.frequency,1,4,'Spherical 3D sampling',r.kind==='planet'),C('Relief',v.relief,0,.5,'Radial displacement',r.kind==='planet'),C('Sea level',v.sea,-.1,.1,'Ocean radius',r.kind==='planet'),C('Moisture',v.moisture,0,1,'Climate-driven land cover',r.kind==='planet'),C('Temperature',v.temperature,0,1,'Latitude + altitude bands',r.kind==='planet'),C('Wind strength',v.wind,0,3,'Prescribed tracer speed',r.kind==='planet')]
   caption=r.kind==='intro'?'Begin with a question. Hold conditions fixed. Change a rule and look again.':r.local<12?'Ground, water, climate and habitat change together on a rotating procedural planet.':r.local<23?'The surrounding studies keep their own domains. A shared visual atlas makes the rules legible.':'From numbers to landscapes, from fields to life. A world to keep exploring.'
   metrics=r.kind==='intro'?'Noise · shaders · erosion · biomes · voxels · vector fields · L-systems · ecosystems':'Jiawen Chen / AI-assisted procedural atlas / Sessions 1–7';notes=['Not geographic Earth data','Separate erosion / volume insets'];measurements=v
  }else if(['noise','resolution','shader','climate'].includes(r.kind)){
   const frequency=r.kind==='noise'?quant(mix(1,4,r.p)):r.kind==='resolution'?4:2,cells=r.kind==='resolution'?(r.p<.33?24:r.p<.66?48:96):64,snow=quant(mix(6,16,r.p),.5),moisture=quant(mix(.25,.8,r.p),.025),mode=r.kind==='resolution'?'wire':r.kind==='climate'?'climate':r.kind==='shader'?'shader':'land'
   if(!this.reference){this.clear();const field=terrainField(r.kind==='resolution'?24:64,r.kind==='noise'?1:frequency,160,r.kind==='climate');this.plane(field,mode,r.kind==='climate'?.25:r.kind==='shader'?6:.63,r.kind==='noise');this.draw(0);this.reference=cloneCanvas(this.canvas);this.referenceMetrics=r.kind==='resolution'?'24² cells / 1,152 triangles':r.kind==='noise'?'Frequency 1.00 / seed 17':r.kind==='shader'?'Snow threshold 6.0 u':`Moisture 0.25 / ${this.climate(.25).trees} initial trees`;this.key=''}
   const key=r.kind+':'+(r.kind==='noise'?frequency:r.kind==='resolution'?cells:r.kind==='shader'?snow:moisture);if(key!==this.key){this.clear();this.plane(terrainField(cells,frequency,160,r.kind==='climate'),mode,r.kind==='climate'?moisture:r.kind==='shader'?snow:.63,r.kind==='noise');this.key=key}this.draw(orbit)
   if(r.kind==='noise'){caption='Higher frequency makes smaller terrain features. The seed, amplitude and three octaves stay fixed.';metrics=`Frequency ${frequency.toFixed(2)} / 64² cells / 8,192 triangles`;controls=[C('Frequency',frequency,1,4,'1 → 4 · seed 17',r.p>0&&r.p<1),C('Octaves',3,1,6,'Held fixed'),C('Relief amplitude',22,0,40,'Held at 22 u',false,' u')];referenceLabel='Frequency 1'}
   if(r.kind==='resolution'){caption='A finer grid samples the same field more densely. It adds triangles, not a new terrain rule.';metrics=`${cells}² cells / ${(2*cells*cells).toLocaleString()} triangles / ${(160/cells).toFixed(2)} u per cell`;controls=[C('Cells per side',cells,24,96,'24 → 48 → 96',r.p>0&&r.p<1),C('Frequency',4,1,4,'Same noise field')];referenceLabel='24² cells'}
   if(r.kind==='shader'){caption='Moving the shader threshold changes the snow-colored band. The mesh and its height field stay identical.';metrics=`Snow threshold ${snow.toFixed(1)} u / same 8,192 triangles`;controls=[C('Snow threshold',snow,6,16,'6 → 16 · material only',r.p>0&&r.p<1,' u'),C('Relief amplitude',22,0,40,'Geometry held fixed')];referenceLabel='Threshold 6 u'}
   if(r.kind==='climate'){const trial=this.climate(moisture);caption='More moisture changes dry scrub into meadow, forest and wetland where the other conditions allow it.';metrics=`Moisture ${moisture.toFixed(2)} / forest cells ${trial.counts[4]} / ${trial.trees} eligible initial trees`;controls=[C('Moisture',moisture,0,1,'.25 → .80 · fixed terrain',r.p>0&&r.p<1),C('Temperature',.75,0,1,'Held at .75')];notes=['Classification, not succession'];referenceLabel='Moisture .25';measurements=trial;this.tag([BIOMES.slice(0,4).map((b,i)=>`${b}: ${trial.counts[i]}`).join(' / '),BIOMES.slice(4).map((b,i)=>`${b}: ${trial.counts[i+4]}`).join(' / ')])}
  }else if(r.kind==='meshing'){
   const c=this.canvas.getContext('2d')!;c.fillStyle='#e9e2d5';c.fillRect(0,0,1040,510);const rows=[['Greedy cubes','Merge exposed, coplanar voxel faces.','Fast blocks; stair-stepped silhouettes.'],['Marching Cubes · implemented','Interpolate a zero crossing on cube edges.','Smooth density; ambiguous cases need care.'],['Marching Tetrahedra','Split each cube into tetrahedra.','Simpler cases; usually more triangles.'],['Surface Nets / Dual Contouring','Place vertices per active cell / fit gradients.','Compact or sharper features; more topology work.']];rows.forEach((row,i)=>{const y=24+i*115;c.fillStyle=i===1?'#dce3cd':'#f6f3e9';c.fillRect(22,y,996,103);c.fillStyle='#34472f';c.font='bold 21px Arial';c.fillText(row[0],40,y+28);c.font='18px Arial';c.fillText(row[1],40,y+56);c.fillStyle='#717860';c.fillText(row[2],40,y+83)});caption='Choose the mesher for the representation. This project extracts smooth density with Marching Cubes; the alternatives are a documented comparison.';metrics='Alternative methods are explained here, not presented as implemented benchmarks.';controls=[C('Implemented mesher',1,0,1,'Marching Cubes')];notes=['Block occupancy ≠ smooth density','No fabricated benchmark rankings']
  }else if(r.kind==='erosion'){
   const steps=Math.round(mix(0,100,r.p));const render=(i:number)=>{let f=this.erosion[i];if(f.steps>steps)f=this.erosion[i]=erosionTrial(i?.05:.005,0);advanceErosion(f,steps);this.pairedView(i,String(steps),()=>this.plane(f,'change',.63,false,f.ground.map((v,j)=>v-f.baseline[j])),orbit);this.tag(['GROUND CHANGE / ochre = erosion · teal = deposition','Fixed display range: ±0.5 u · actual ground displacement']);return f}
   const a=render(0);this.reference=cloneCanvas(this.canvas);this.referenceMetrics=`Rain .005 / cut ${a.cut.toFixed(3)} / deposit ${a.fill.toFixed(3)}`;const b=render(1);metrics=`${steps} steps / rain .050 / cut ${b.cut.toFixed(3)} / deposit ${b.fill.toFixed(3)}`;caption='Run the same terrain for the same number of steps. Different rain produces different ground and sediment changes.';controls=[C('Rain A',.005,0,.06,'Fixed low rainfall',false,' u/step'),C('Rain B',.05,0,.06,'Fixed high rainfall',false,' u/step'),C('Equal steps',steps,0,100,'Both trials advance together',r.p>0&&r.p<1)];paired=true;referenceLabel='A / rain .005';label='B / rain .050';measurements={steps,a:{cut:a.cut,fill:a.fill,waterMean:a.waterMean},b:{cut:b.cut,fill:b.fill,waterMean:b.waterMean}}
  }else if(['density','cave','pocket','voxel-resolution','chunks'].includes(r.kind)){
   let settings:VoxelSettings={...VOXEL_DEFAULT},cells=48,chunk=16,bounds=false
   if(r.kind==='density')settings={...settings,shape:r.p<.34?'Sphere':r.p<.68?'Box':'Noise volume',cave:0}
   if(r.kind==='cave')settings={...settings,cave:quant(mix(0,5,Math.min(1,r.p*1.5)),.25),order:r.p>.82?'add-last':'cut-last'}
   if(r.kind==='pocket'){settings={...settings,order:'add-last',cut:r.p>.35?{x:8,y:6,z:12,r:4}:null};bounds=true}
   if(r.kind==='voxel-resolution')cells=r.p<.33?32:r.p<.66?48:64
   if(r.kind==='chunks'){chunk=r.p<.5?16:8;settings={...settings,cut:{x:8,y:6,z:12,r:4}};bounds=true}
   if(!this.reference&&r.kind!=='density'){this.clear();this.voxels(r.kind==='cave'?{...settings,cave:0}:r.kind==='pocket'?{...settings,cut:null}:settings,r.kind==='voxel-resolution'?32:48,16,bounds);this.draw(0,'voxel');this.reference=cloneCanvas(this.canvas);this.referenceMetrics=r.kind==='cave'?'Cave radius 0 / solid terrain':r.kind==='pocket'?'No local pocket':r.kind==='chunks'?'16³ chunks / 27 total':'32³ cells';this.key=''}
   const key=JSON.stringify([settings,cells,chunk]);if(key!==this.key){const localUpdate=r.kind==='pocket'&&!!settings.cut&&!!this.key;if(!localUpdate)this.clear();const stats=this.voxels(settings,cells,chunk,bounds,r.kind==='chunks',localUpdate);this.key=key;this.group.userData.stats=stats}this.draw(orbit,'voxel');if(r.kind==='density')this.slice(settings)
   const stats=this.group.userData.stats as {triangles:number;chunks:number};metrics=`${settings.shape} / ${cells}³ cells / ${stats.triangles.toLocaleString()} triangles`
   if(r.kind==='density'){caption='Sphere, box and spatial noise are different density functions. Marching Cubes extracts each zero surface.';controls=[C('Shape index',r.p<.34?1:r.p<.68?2:3,1,3,settings.shape,true),C('Shape radius',13,6,18,'Held at 13 u')];notes=['Slice: green solid / cream air']}
   if(r.kind==='cave'){caption=settings.order==='add-last'?'Carve first, then add the pillar: operation order restores solid inside the tunnel.':'Increase the cutter radius from zero to five. Empty space now passes through solid ground.';controls=[C('Cave radius',settings.cave,0,9,'0 → 5 · cylinder subtraction',r.p>0&&r.p<.67,' u')];notes=[settings.order==='add-last'?'CSG: carve → add pillar':'CSG: add pillar → carve'];referenceLabel='Solid volume';label='Carved volume'}
   if(r.kind==='pocket'){caption='Only chunks intersecting the pocket and its sampling margin need rebuilding. Distant chunks keep their meshes.';controls=[C('Pocket radius',settings.cut?4:0,0,6,'Local edit centered at (8,6,12)',!!settings.cut,' u')];notes=['16³ cells per chunk','8 / 27 affected when enabled'];referenceLabel='Before pocket';label='Local pocket';metrics+=' / '+(settings.cut?'8 / 27 local rebuilds':'27 / 27 full build')}
   if(r.kind==='voxel-resolution'||r.kind==='chunks'){const b=this.timing(cells,chunk,settings);measurements=b;metrics=`${cells}³ / ${chunk}³ chunks / ${b.triangles.toLocaleString()} triangles / median ${b.medianMs.toFixed(1)} ms`;caption=r.kind==='chunks'?`The same pocket touches ${b.localChunks} of ${b.chunks} chunks. Smaller chunks increase total bookkeeping.`:'Increase volume resolution while holding the density rule fixed. Compare triangles and measured CPU meshing time.';controls=[C('Volume cells',cells,32,64,'32 → 48 → 64',r.kind==='voxel-resolution'),C('Chunk cells',chunk,8,16,'16 → 8',r.kind==='chunks')];notes=[`${b.localChunks} / ${b.chunks} local chunks`,`${(b.samples*4/1048576).toFixed(2)} MiB sample estimate`];referenceLabel=r.kind==='chunks'?'16³ chunks':'32³ cells';label=r.kind==='chunks'?'8³ chunks':`${cells}³ cells`}
  }else if(r.kind==='wind'||r.kind==='fluid'){
   const a=this.twoDimensional(r.kind,r,0);this.reference=cloneCanvas(this.canvas);const b=this.twoDimensional(r.kind,r,1);paired=true;measurements={a,b};referenceLabel=r.kind==='wind'?'A / direction 0°':'A / pressure 0';label=r.kind==='wind'?'B / direction 90°':'B / pressure 40';this.referenceMetrics=r.kind==='wind'?`Distance ${(a as {distance:number}).distance.toFixed(1)} u`:`Divergence ${(a as {after:number}).after.toFixed(5)}`;metrics=r.kind==='wind'?`Speed 4 u/s / equal time ${b.time.toFixed(1)} s / distance ${(b as {distance:number}).distance.toFixed(1)} u`:`Time ${b.time.toFixed(1)} s / B divergence ${(b as {before:number}).before.toFixed(5)} → ${(b as {after:number}).after.toFixed(5)}`
   caption=r.kind==='wind'?'Rotate the velocity direction by 90 degrees. At equal speed and time, both sets travel the same distance.':'Both grids transport dye. Pressure projection reduces divergence; the readout measures what the picture cannot show.';controls=r.kind==='wind'?[C('Direction A',0,0,360,'Constant field · swirl 0',false,'°'),C('Direction B',90,0,360,'Same speed 4 u/s',false,'°'),C('Equal time',b.time,0,8,'Both trials advance together',r.p>0&&r.p<1,' s')]:[C('Pressure A',0,0,100,'No projection iterations'),C('Pressure B',40,0,100,'Jacobi projection'),C('Equal time',b.time,0,8,'Both 40² grids advance together',r.p>0&&r.p<1,' s')];notes=[r.kind==='fluid'?'Dye is not water height':'Diagram axes stay fixed',r.kind==='fluid'?'Periodic boundaries; approximate':'Zero swirl · deterministic seed']
  }else if(r.kind==='grammar'||r.kind==='angle'){
   const iterations=r.kind==='angle'?3:r.p<.34?1:r.p<.68?2:3,angle=r.kind==='angle'?Math.round(mix(15,45,r.p)):30
   if(!this.reference){this.clear();this.tree(r.kind==='angle'?3:1,r.kind==='angle'?15:30);this.draw(0,'tree');this.reference=cloneCanvas(this.canvas);this.referenceMetrics=r.kind==='angle'?'Angle 15° / 125 segments':'Iteration 1 / 5 segments';this.key=''}
   const key=`${iterations}:${angle}`;if(key!==this.key){this.clear();this.tree(iterations,angle);this.key=key}this.draw(orbit,'tree');metrics=`${iterations} iterations / ${5**iterations} segments / angle ${angle}°`;caption=r.kind==='grammar'?'Parallel rewriting gives 5, 25 and 125 segments. Grammar depth changes structure; it is not elapsed age.':'At the same grammar depth, a larger turn angle spreads the branches. Segment count stays fixed.';controls=[C('Iterations',iterations,1,3,'Parallel F replacement',r.kind==='grammar'),C('Branch angle',angle,15,45,'Turtle turn angle',r.kind==='angle','°')];referenceLabel=r.kind==='angle'?'15° branches':'Iteration 1';label=r.kind==='angle'?`${angle}° branches`:`Iteration ${iterations}`
  }else if(['population','growth','competition'].includes(r.kind)){
   const time=Math.round(mix(0,18,r.p)*2)/2,make=(rate:number)=>{const e=this.population(r.kind==='growth'?0:r.kind==='competition'?1:rate,time,r.kind==='growth'?(rate?2:0):2,r.kind==='competition'?(rate?5:0):5);this.pairedView(rate,String(time),()=>{this.plane(terrainField(64,2,160,true),'land',.63,true);this.plants(e)},orbit);return e}
   const a=make(0);this.reference=cloneCanvas(this.canvas);this.referenceMetrics=`${a.plants.length} trees / ${a.births} births`;const b=make(1);metrics=`${time.toFixed(1)} model seconds / ${b.plants.length} trees / +${b.births} births / ${b.deaths} deaths`;caption=b.births?'With reproduction enabled, new seedlings join the stand. Both trials have the same growth rate and elapsed time.':'Both stands grow existing trees. Only the right-hand trial is allowed to produce seeds.';paired=true;referenceLabel='A / reproduction 0';label='B / reproduction 1';controls=[C('Growth rate',2,0,3,'Same in both trials'),C('Reproduction B',1,0,3,'A = 0 · B = 1'),C('Equal time',time,0,18,'Same starting seed 17',r.p>0&&r.p<1,' s')];notes=['Terracotta dots = new seedlings','Model seconds, not years'];if(r.kind==='growth'){referenceLabel='A / growth 0';label='B / growth 2';caption='With reproduction off, the population stays at 104. Growth changes the size of existing plants.';controls=[C('Growth A',0,0,3,'Frozen size'),C('Growth B',2,0,3,'Same 104 existing plants'),C('Equal time',time,0,18,'Reproduction off in both',r.p>0&&r.p<1,' s')];this.referenceMetrics='104 trees / size held fixed';metrics=`${time.toFixed(1)} s / 104 trees / mean size A ${(a.plants.reduce((s,p)=>s+p.size,0)/104).toFixed(2)} vs B ${(b.plants.reduce((s,p)=>s+p.size,0)/104).toFixed(2)}`}if(r.kind==='competition'){referenceLabel='A / crowding radius 0';label='B / crowding radius 5';caption='Crowding lowers health before it necessarily kills a tree. At this short duration, use health as evidence, not a claim of forest collapse.';controls=[C('Competition A',0,0,8,'No crowding neighborhood'),C('Competition B',5,0,8,'Same growth and reproduction'),C('Equal time',time,0,18,'Same initial population',r.p>0&&r.p<1,' s')];const mean=(e:typeof a)=>e.plants.reduce((sum,p)=>sum+p.health,0)/e.plants.length;this.referenceMetrics=`${a.plants.length} trees / health ${mean(a).toFixed(4)}`;metrics=`${time.toFixed(1)} s / B ${b.plants.length} trees / health ${mean(b).toFixed(4)} / deaths ${b.deaths}`};measurements={time,a:{trees:a.plants.length,births:a.births,deaths:a.deaths,meanSize:a.plants.reduce((sum,p)=>sum+p.size,0)/a.plants.length,meanHealth:a.plants.reduce((sum,p)=>sum+p.health,0)/a.plants.length},b:{trees:b.plants.length,births:b.births,deaths:b.deaths,meanSize:b.plants.reduce((sum,p)=>sum+p.size,0)/b.plants.length,meanHealth:b.plants.reduce((sum,p)=>sum+p.health,0)/b.plants.length}}
  }else if(r.kind==='tide'){
   const amplitude=r.local<5?mix(2,4,(r.local-2)/3):4,time=r.local<5?18:r.local<12?mix(18,30,(r.local-5)/7):mix(30,42,(r.local-12)/5),sea=tideAt(time,amplitude,24)
   const make=(level:number)=>{const key='tide:'+level.toFixed(1);if(this.key===key){this.draw(orbit);return this.group.userData.path as number}this.clear();this.plane(terrainField(64,2,160,true));this.plants(this.population(0,0));const water=new THREE.Mesh(new THREE.PlaneGeometry(160,160),new THREE.MeshStandardMaterial({color:'#569fb0',roughness:.3,transparent:true,opacity:.86}));water.rotation.x=-Math.PI/2;water.position.y=level;this.group.add(water)
    const n=41,h=new Float32Array(n*n);for(let z=0;z<n;z++)for(let x=0;x<n;x++)h[z*n+x]=heightAt(atlasLayers(),null,x*4-80,z*4-80);const path=findPath(h,n,4,25*n+13,14*n+25,level,12),points=path.map(i=>new THREE.Vector3(i%n*4-80,h[i]+.4,Math.floor(i/n)*4-80));if(points.length>1)this.group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),120,.6,6,false),new THREE.MeshBasicMaterial({color:'#f7d7a6'})));this.key=key;this.group.userData.path=path.length>1?points.slice(1).reduce((sum,p,i)=>sum+p.clone().setY(0).distanceTo(points[i].clone().setY(0)),0):0;this.draw(orbit);return this.group.userData.path as number}
   if(!this.reference){make(-2);this.draw(0);this.reference=cloneCanvas(this.canvas);this.referenceMetrics='Water −2 u / connected trail'}const path=make(sea);metrics=`Water ${sea.toFixed(2)} u / trail ${path.toFixed(0)} u / fixed 104 trees`;caption=path===0?'High water disconnects the dry route. The trail responds to terrain and sea level.':r.local>12?'The tide retreats and the dry connection returns. The forest has been held fixed.':'Change tide amplitude, then advance its phase. The same landscape gains and loses dry ground.';controls=[C('Tide amplitude',amplitude,0,4,'2 → 4, then held',r.local>=2&&r.local<5,' u'),C('Tide period',24,8,60,'Held fixed',false,' s'),C('Preview time',time,18,42,'Clock scrub, not a physics slider',r.local>5&&r.local<17,' s')];referenceLabel='Low-water reference';measurements={time,amplitude,sea,path}
  }
  return {request:r,canvas:this.canvas,caption,metrics,controls,notes,reference:this.reference,referenceLabel,referenceMetrics:this.referenceMetrics,label,paired,measurements}
 }
}
