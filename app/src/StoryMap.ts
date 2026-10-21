import * as THREE from 'three'
import {disposeScene} from './natureRendering'
import type {JourneySection} from './journeyTimeline'
import {MapPostcards,POSTCARD_POSITIONS} from './MapPostcards'
import {STORY_BEATS} from './journeyStoryboard'
import {storyBeatAt} from './journeyStoryboard'

const smooth=(v:number)=>{const t=THREE.MathUtils.clamp(v,0,1);return t*t*(3-2*t)}
const COAST: [number,number][]=[[-12,3],[-11,-3],[-8,-6.5],[-4,-7.2],[0,-6.3],[3,-9],[7,-8],[7.5,-5],[12,-3],[10.3,.6],[12,4.8],[8,8],[3.8,7.8],[.4,10],[-5,7.4],[-9,7.9]]
const ROUTE: [number,number][]=[[-9,2],[-7,-4.8],[-.2,-4.6],[7,-3],[8,2.3],[2.2,7.3],[-5.5,5.5]]
const PAPER='#fff5d9',SEA='#b0cdd1'
const material=(color:string)=>new THREE.MeshStandardMaterial({color,roughness:1,metalness:0})
function inside(x:number,z:number){let yes=false;for(let i=0,j=COAST.length-1;i<COAST.length;j=i++){const a=COAST[i],b=COAST[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])yes=!yes}return yes}

/** Printed geography stays flat; the train and railway sit just above the paper. */
function paperTexture(){
 const c=document.createElement('canvas');c.width=1800;c.height=1600;const ctx=c.getContext('2d')!
 ctx.fillStyle=PAPER;ctx.fillRect(0,0,1800,1600);ctx.fillStyle=SEA;ctx.fillRect(55,210,1690,1280)
 ctx.strokeStyle='#779fa45c';ctx.lineWidth=2
 for(let y=245;y<1470;y+=64)for(let x=85;x<1740;x+=95){ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+17,y-13,x+34,y);ctx.stroke()}
 // Map coordinates match the railway in the Three.js scene.
 const xy=(x:number,z:number):[number,number]=>[(x+17)/34*1800,(z+14)/28*1600]
 const polygon=(points:[number,number][],fill:string)=>{ctx.beginPath();points.forEach(([x,z],i)=>{const p=xy(x,z);if(i)ctx.lineTo(...p);else ctx.moveTo(...p)});ctx.closePath();ctx.fillStyle=fill;ctx.fill()}
 polygon(COAST.map(([x,z])=>[x*1.06,z*1.06]),'#f5f1d4')
 polygon(COAST,'#d0bf7c')
 polygon([[-10,2],[-8,-3],[-4,-6.1],[.1,-4.9],[3,-7.3],[6.4,-6.2],[6.1,-1],[9,3],[7,6.1],[2.4,7.2],[-2,6.9],[-7,5.8]],'#8eaa7e')
 polygon([[-8,-.6],[-5,-4.2],[-1,-3.3],[1,.4],[-2,2.2],[-5,2.5]],'#6b8770')
 polygon([[1.8,-1],[5.8,-4.2],[7,-2.5],[6.7,1.2],[8.6,3.8],[4.5,5.1],[1.5,3.8]],'#a9b78a')
 // Deliberately drawn mountain silhouettes, including pale snow and a shaded face.
 const peak=(x:number,z:number,w:number,h:number)=>{
  polygon([[x-w,z],[x-w*.75,z-h*.42],[x,z-h],[x+w*.85,z-h*.18],[x+w,z+.25],[x+.1,z+.8]],'#777d73')
  polygon([[x,z-h],[x+.1,z+.8],[x+w,z+.25],[x+w*.85,z-h*.18]],'#626e6b')
  polygon([[x-w*.41,z-h*.67],[x,z-h],[x+w*.38,z-h*.65],[x+w*.1,z-h*.7],[x+w*.03,z-h*.54],[x-w*.16,z-h*.74],[x-w*.27,z-h*.61]],'#faf6e2')
 }
 peak(-5,-.3,2.6,5.1);peak(-1.7,.3,2.2,4.5);peak(-7.6,.8,1.8,3.1)
 ctx.lineCap='round';ctx.lineJoin='round'
 const river=()=>{ctx.beginPath();ctx.moveTo(...xy(-1.8,-2));ctx.bezierCurveTo(...xy(2,-1.3),...xy(-.2,1.9),...xy(1.7,3.1));ctx.bezierCurveTo(...xy(2.3,4.1),...xy(4.8,4.6),...xy(5,8.3))}
 river();ctx.strokeStyle='#f8eed4';ctx.lineWidth=48;ctx.stroke();river();ctx.strokeStyle='#7babb7';ctx.lineWidth=31;ctx.stroke();river();ctx.strokeStyle='#b9d8dc';ctx.lineWidth=4;ctx.stroke()
 const route=new THREE.CatmullRomCurve3(ROUTE.map(([x,z])=>new THREE.Vector3(x,0,z)),true,'centripetal',.3).getPoints(180)
 const pine=(x:number,z:number,size:number,i:number)=>{
  const [px,py]=xy(x,z);ctx.save();ctx.translate(px,py);ctx.scale(size,size)
  ctx.fillStyle='#a28b58';ctx.fillRect(-3,-16,6,27)
  ctx.fillStyle=['#396b65','#507d6c','#628874'][i%3]
  ctx.beginPath();ctx.moveTo(0,-68);ctx.lineTo(14,-41);ctx.lineTo(8,-41);ctx.lineTo(22,-17);ctx.lineTo(12,-19);ctx.lineTo(29,2);ctx.lineTo(0,-4);ctx.lineTo(-29,2);ctx.lineTo(-13,-20);ctx.lineTo(-23,-17);ctx.lineTo(-9,-41);ctx.lineTo(-15,-39);ctx.closePath();ctx.fill();ctx.restore()
 }
 for(let i=0;i<135;i++){const x=Math.sin(i*71.2)*9.7,z=Math.cos(i*23.17)*7.2;if(!inside(x/.8,z/.8)||z<1.6&&x<1.7||route.some(p=>Math.hypot(p.x-x,p.z-z)<.68)||Math.abs(x-(.5+z*.53))<.9&&z>0)continue;pine(x,z,.67+(i%5)*.09,i)}
 // A little cave sticker belongs to the volume stop; it is a symbol, not voxel geometry.
 polygon([[.2,6.6],[.5,5.9],[1.25,5.45],[2.4,6],[2.8,6.7]],'#858879')
 const cave=xy(1.5,6.4);ctx.fillStyle='#43555c';ctx.beginPath();ctx.ellipse(cave[0],cave[1],25,31,0,Math.PI,0);ctx.fill()
 ctx.font='italic 18px Georgia';ctx.fillStyle='#526e69';ctx.fillText('The highlands',...xy(-7,-6.1));ctx.fillText('A place to take root',...xy(-7,7.1))
 // Slight ink and stock variation, deterministic and intentionally restrained.
 for(let i=0;i<17000;i++){const x=(i*7919)%1800,y=(i*4441)%1600;ctx.fillStyle=i%2?'#fff7df0d':'#445c6307';ctx.fillRect(x,y,1+(i%3),1)}
 ctx.fillStyle='#3d494e';ctx.font='16px Arial';ctx.fillText('FIELD NOTES /',72,91);ctx.fillText('01 — 06',72,117)
 ctx.font='58px Georgia';ctx.fillText('A small world,',665,91);ctx.font='italic 58px Georgia';ctx.fillText('a closer look.',665,147)
 ctx.font='16px Arial';ctx.fillText('Collect a little discovery.',1435,94);ctx.fillText('Every picture holds a rule.',1435,121)
 ctx.font='17px Arial';ctx.fillStyle='#556775';ctx.fillText('T H E   F I E L D W O R K   I S L E S',1010,1460)
 ctx.font='13px Arial';ctx.fillText('Landscape route + independent study branches',66,1546);ctx.textAlign='right';ctx.fillText('Illustrated guide · not a live terrain map',1728,1546);ctx.textAlign='left'
 // A compass and two creases make this a folded field map, rather than a diorama plinth.
 ctx.save();ctx.translate(160,1395);ctx.fillStyle='#426975';ctx.beginPath();ctx.moveTo(0,-30);ctx.lineTo(15,15);ctx.lineTo(0,7);ctx.lineTo(-15,15);ctx.closePath();ctx.fill();ctx.font='18px Georgia';ctx.fillText('N',-6,-43);ctx.restore()
 for(const x of [600,1200]){const fold=ctx.createLinearGradient(x-30,0,x+23,0);fold.addColorStop(0,'#52636300');fold.addColorStop(.47,'#46565c0b');fold.addColorStop(.5,'#ffffff35');fold.addColorStop(1,'#ffffff00');ctx.fillStyle=fold;ctx.fillRect(x-30,0,53,1600);ctx.strokeStyle='#756b5120';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,1600);ctx.stroke()}
 const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;return tex
}

export class StoryMap {
 private renderer:THREE.WebGLRenderer
 private scene=new THREE.Scene()
 private camera=new THREE.OrthographicCamera(-20,20,16,-16,.1,150)
 private world=new THREE.Group()
 private train=new THREE.Group()
 private postcards=new MapPostcards()
 private wheels:THREE.Mesh[]=[]
 private smoke:THREE.Mesh[]=[]
 private rain:THREE.Points
 private birds:THREE.Group[]=[]
 private stationButtons:HTMLButtonElement[]=[]
 private stationPositions:THREE.Vector3[]=[]
 private routeU=0
 private travelFrom=0
 private lastStationId=''
 private curve:THREE.CatmullRomCurve3
 private paper=paperTexture()
 private width=0
 private aspect=1
 private current:{time:number;section:JourneySection;local:number}|null=null
 private observer:ResizeObserver
 private reduced=matchMedia('(prefers-reduced-motion: reduce)').matches
 constructor(host:HTMLDivElement,onStation:(index:number)=>void){
  this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.max(1,Math.min(devicePixelRatio,2)));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.08;host.appendChild(this.renderer.domElement)
  this.scene.add(this.world);this.scene.add(new THREE.HemisphereLight('#f5f4e1','#6b878e',2))
  const sun=new THREE.DirectionalLight('#fff6df',2.1);sun.position.set(-14,30,18);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-23;sun.shadow.camera.right=23;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;sun.shadow.radius=3;this.scene.add(sun)
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(250,250),new THREE.ShadowMaterial({opacity:.12}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.05;floor.receiveShadow=true;this.scene.add(floor)
  const edge=new THREE.Mesh(new THREE.BoxGeometry(34,.065,28),material('#e9dfc1'));edge.position.y=-.24;edge.castShadow=true;this.world.add(edge)
  const sheet=new THREE.Mesh(new THREE.PlaneGeometry(34,28),new THREE.MeshBasicMaterial({map:this.paper,toneMapped:false}));sheet.rotation.x=-Math.PI/2;sheet.position.y=-.2;this.world.add(sheet)
  this.curve=new THREE.CatmullRomCurve3(ROUTE.map(([x,z])=>new THREE.Vector3(x,.28,z)),true,'centripetal',.3)
  const road=new THREE.Mesh(new THREE.TubeGeometry(this.curve,280,.22,8,true),material('#fff2ce'));road.scale.y=.14;road.position.y=.2;this.world.add(road)
  for(const offset of [-.12,.12]){const track=Array.from({length:241},(_,i)=>{const p=this.curve.getPointAt(i/240),t=this.curve.getTangentAt(i/240);return p.add(new THREE.Vector3(-t.z,0,t.x).multiplyScalar(offset))});this.world.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(track,true),320,.014,5,true),material('#887754')))}
  const ties=new THREE.InstancedMesh(new THREE.BoxGeometry(.40,.035,.075),material('#94724f'),180),dummy=new THREE.Object3D()
  for(let i=0;i<180;i++){const p=this.curve.getPointAt(i/180),t=this.curve.getTangentAt(i/180);dummy.position.copy(p);dummy.position.y-=.012;dummy.rotation.y=Math.atan2(t.x,t.z);dummy.updateMatrix();ties.setMatrixAt(i,dummy.matrix)}this.world.add(ties)
  this.makeTrain();this.train.scale.setScalar(.9);this.world.add(this.train);this.world.add(this.postcards.group)
  const names=['Departure','Ground','Water','Habitat','Life','Volume','Fields']
  names.forEach((name,i)=>{
   const p=this.curve.getPoint(i/7),n=new THREE.Vector3(p.x,0,p.z).normalize();p.addScaledVector(n,1.05);p.y=.4
   this.stationPositions.push(p)
   const button=document.createElement('button');button.type='button';button.className='map-station-sticker';button.setAttribute('aria-label',`Ride to ${name}`);button.title=`Ride to ${name} — hear this chapter`
   const badge=document.createElement('b');badge.textContent=i?String(i):'•';const label=document.createElement('span');label.textContent=name;button.append(badge,label)
   button.addEventListener('click',()=>onStation(i));host.appendChild(button);this.stationButtons.push(button)
  })
  for(let i=0;i<4;i++){const bird=new THREE.Group();for(const side of [-1,1]){const wing=new THREE.Mesh(new THREE.ConeGeometry(.10,.38,3),material('#fff6e0'));wing.rotation.z=side*.9;wing.position.x=side*.13;bird.add(wing)}this.birds.push(bird);this.world.add(bird)}
  const rainG=new THREE.BufferGeometry(),rainP=new Float32Array(100*3);for(let i=0;i<100;i++){rainP[i*3]=Math.sin(i*21.4)*7;rainP[i*3+1]=i%7;rainP[i*3+2]=Math.cos(i*42.1)*5}rainG.setAttribute('position',new THREE.BufferAttribute(rainP,3));this.rain=new THREE.Points(rainG,new THREE.PointsMaterial({color:'#6a91a4',size:.06,transparent:true,opacity:.45}));this.world.add(this.rain)
  this.observer=new ResizeObserver(()=>{this.width=host.clientWidth;this.aspect=host.clientWidth/Math.max(1,host.clientHeight);this.renderer.setSize(host.clientWidth,host.clientHeight);if(this.current)this.draw(this.current.time,this.current.section,this.current.local)});this.observer.observe(host)
 }
 private makeTrain(){
  const body=material('#aa664b'),roof=material('#514d6a'),brass=material('#d2ad5e'),glass=material('#a5c9c9')
  const box=(w:number,h:number,d:number,x:number,y:number,z:number,m:THREE.Material)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);mesh.position.set(x,y,z);mesh.castShadow=true;this.train.add(mesh);return mesh}
  box(.56,.17,1.35,0,.22,0,roof);box(.56,.62,.55,0,.61,-.35,body);box(.68,.12,.69,0,.98,-.35,roof);box(.42,.29,.025,0,.69,-.065,glass)
  const boiler=new THREE.Mesh(new THREE.CylinderGeometry(.245,.245,.75,28),body);boiler.rotation.x=Math.PI/2;boiler.position.set(0,.53,.32);boiler.castShadow=true;this.train.add(boiler)
  const chimney=new THREE.Mesh(new THREE.CylinderGeometry(.1,.075,.42,20),roof);chimney.position.set(0,.9,.48);this.train.add(chimney)
  const light=new THREE.Mesh(new THREE.SphereGeometry(.13,16,12),new THREE.MeshStandardMaterial({color:'#ffe4a0',emissive:'#ffa938',emissiveIntensity:.4}));light.position.set(0,.57,.78);this.train.add(light)
  for(const z of [-.48,.15,.57,-1.3,-1.8])for(const x of [-.3,.3]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.085,24),roof);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.16,z);this.train.add(wheel);this.wheels.push(wheel)}
  box(.6,.14,.9,0,.24,-1.5,roof);box(.59,.3,.87,0,.41,-1.5,brass)
  const seed=new THREE.Mesh(new THREE.SphereGeometry(.2,20,16),material('#6f8951'));seed.scale.set(.65,1.4,.7);seed.position.set(0,.78,-1.5);seed.rotation.z=-.3;this.train.add(seed)
  for(let i=0;i<6;i++){const puff=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),new THREE.MeshBasicMaterial({color:'#fff7e2',transparent:true,depthWrite:false,opacity:.3}));this.smoke.push(puff);this.train.add(puff)}
 }
 draw(time:number,section:JourneySection,local:number){
  this.current={time,section,local};if(!this.width)return
  const shortOpening=section.id==='depart'&&section.duration<=15
  const beat=storyBeatAt(local)
  const station=shortOpening?(beat?.station??0):section.station??0,target=section.id==='arrive'?1:station/7
  if(this.lastStationId!==section.id){this.travelFrom=section.id==='depart'?0:this.routeU%1;this.lastStationId=section.id}
  const destination=target<this.travelFrom?target+1:target
  const openingU=beat?((beat.station-1)+smooth((local-beat.at)/.9))/7:0
  const u=shortOpening?openingU:this.reduced?target:THREE.MathUtils.lerp(this.travelFrom,destination,smooth(local/6));this.routeU=u
  this.postcards.draw(shortOpening?local:14)
  const point=this.curve.getPoint((u+1)%1),tangent=this.curve.getTangent((u+1)%1)
  this.train.position.copy(point);this.train.rotation.y=Math.atan2(tangent.x,tangent.z);this.wheels.forEach(w=>w.rotation.x=u*130)
  const decorativeTime=this.reduced?0:time
  this.smoke.forEach((p,i)=>{const age=(decorativeTime*.7+i/6)%1;p.position.set(Math.sin(i+decorativeTime)*.07,1.1+age*.85,.48-age*.5);p.scale.setScalar(.3+age*2.1);(p.material as THREE.MeshBasicMaterial).opacity=(1-age)*.22})
  this.rain.visible=section.id==='water'&&!this.reduced;this.rain.position.y=-(time*1.7%2)
  this.birds.forEach((b,i)=>{b.position.set(Math.sin(decorativeTime*.10+i)*9,4.5+i*.18,Math.cos(decorativeTime*.10+i)*7);b.rotation.y=-decorativeTime*.10-i;b.children.forEach((w,j)=>w.rotation.z=(j?1:-1)*(.9+Math.sin(decorativeTime*5+i)*.25))})
  const viewH=Math.max(32,38/this.aspect);this.camera.left=-viewH*this.aspect/2;this.camera.right=viewH*this.aspect/2;this.camera.top=viewH/2;this.camera.bottom=-viewH/2;this.camera.updateProjectionMatrix()
  const drift=this.reduced?0:Math.sin(time*.036)*.65;this.camera.position.set(.7+drift,40,12);this.camera.lookAt(0,.1,0)
  this.world.rotation.y=-.025+(this.reduced?0:Math.sin(time*.024)*.012);this.world.scale.x=this.reduced?1:.92+.08*smooth(time/4);this.renderer.render(this.scene,this.camera)
  this.world.updateMatrixWorld();this.camera.updateMatrixWorld()
  this.stationButtons.forEach((button,i)=>{const point=this.stationPositions[i].clone();if(shortOpening){if(i>0&&i<=4&&local>=STORY_BEATS[i-1].at){const [x,z]=POSTCARD_POSITIONS[i-1];point.set(x,1,z-2.65)}else if(i===0)point.set(-12.3,.4,3.3);else if(i===5)point.set(1,.4,9.7);else if(i===6)point.set(-11.5,.4,8.7)}this.world.localToWorld(point);point.project(this.camera);button.style.left=`${(point.x*.5+.5)*100}%`;button.style.top=`${(-point.y*.5+.5)*100}%`;button.classList.toggle('selected',i===station);button.setAttribute('aria-current',i===station?'step':'false')})
 }
 dispose(){this.postcards.dispose();this.observer.disconnect();this.scene.traverse(o=>{if(o instanceof THREE.DirectionalLight)o.shadow.dispose()});this.paper.dispose();this.stationButtons.forEach(button=>button.remove());disposeScene(this.scene);this.renderer.dispose();this.renderer.domElement.remove()}
}
