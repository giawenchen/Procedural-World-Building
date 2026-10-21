import * as THREE from 'three'
import {STORY_BEATS} from './journeyStoryboard'

const ease=(v:number)=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t)}
export const POSTCARD_POSITIONS=[[-9,-1.8,-.12],[8,-.5,.09],[8,5.8,-.1],[-5.6,6.6,.08]]
type Card={group:THREE.Group;texture:THREE.CanvasTexture;canvas:HTMLCanvasElement;line:THREE.Line;lastFrame:number}

/** Small original illustrations on paper; explanatory metaphors, not simulation output. */
export class MapPostcards {
 readonly group=new THREE.Group()
 private cards:Card[]=[]
 private reduced=matchMedia('(prefers-reduced-motion: reduce)').matches
 constructor(){
  POSTCARD_POSITIONS.forEach(([x,z,turn],i)=>{
   const group=new THREE.Group();group.position.set(x,.8+i*.015,z);group.rotation.y=turn
   const canvas=document.createElement('canvas');canvas.width=560;canvas.height=420
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4
   const plane=new THREE.Mesh(new THREE.PlaneGeometry(7,5.25),new THREE.MeshBasicMaterial({map:texture,toneMapped:false,transparent:true}));plane.rotation.x=-Math.PI/2;group.add(plane)
   const shadow=new THREE.Mesh(new THREE.PlaneGeometry(7,5.25),new THREE.MeshBasicMaterial({color:'#253d39',transparent:true,opacity:.16,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(.13,-.05,.15);group.add(shadow)
   const pin=new THREE.Mesh(new THREE.SphereGeometry(.12,12,8),new THREE.MeshStandardMaterial({color:'#ac6549',roughness:.7}));pin.position.set(.03,.17,-2.1);group.add(pin)
   this.group.add(group)
   const previous=i?POSTCARD_POSITIONS[i-1]:[-5,-3,0],a=new THREE.Vector3(previous[0],.65,previous[1]),b=new THREE.Vector3(x,.7,z-2.1)
   const middle=a.clone().lerp(b,.5);middle.z+=1.4;middle.y=.6
   const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(new THREE.QuadraticBezierCurve3(a,middle,b).getPoints(60)),new THREE.LineBasicMaterial({color:'#aa7153',transparent:true,opacity:.7}));this.group.add(line)
   this.cards.push({group,texture,canvas,line,lastFrame:-1})
  })
 }
 private illustrate(card:Card,index:number,age:number){
  const c=card.canvas.getContext('2d')!,p=this.reduced?1:ease(age/1.4),time=this.reduced?0:age
  c.clearRect(0,0,560,420);c.fillStyle='#fff6df';c.fillRect(0,0,560,420)
  c.save();c.beginPath();c.rect(18,18,524,322);c.clip()
  const sky=c.createLinearGradient(0,18,0,340);sky.addColorStop(0,'#d8e3cd');sky.addColorStop(1,'#eadcb4');c.fillStyle=sky;c.fillRect(18,18,524,322)
  c.fillStyle='#f9e8a9';c.beginPath();c.arc(439,73,28,0,Math.PI*2);c.fill()
  const mountain=(x:number,y:number,w:number,h:number)=>{
   c.fillStyle='#7f9185';c.beginPath();c.moveTo(x-w,y);c.lineTo(x,y-h);c.lineTo(x+w,y);c.closePath();c.fill()
   c.fillStyle='#647e77';c.beginPath();c.moveTo(x,y-h);c.lineTo(x+w,y);c.lineTo(x+w*.13,y);c.fill()
   c.fillStyle='#fff6e4';c.beginPath();c.moveTo(x,y-h);c.lineTo(x+w*.25,y-h*.75);c.lineTo(x+w*.05,y-h*.79);c.lineTo(x-w*.06,y-h*.67);c.lineTo(x-w*.25,y-h*.75);c.fill()
  }
  const ground=()=>{c.fillStyle='#b3bc87';c.beginPath();c.moveTo(18,260);c.quadraticCurveTo(210,215,542,265);c.lineTo(542,340);c.lineTo(18,340);c.fill()}
  const river=(amount:number)=>{c.save();c.strokeStyle='#f6edce';c.lineWidth=32;c.lineCap='round';const path=new Path2D('M 246 194 C 402 245 221 239 286 282 S 440 303 417 345');c.stroke(path);c.strokeStyle='#72a9b2';c.lineWidth=23;c.setLineDash([amount*390,500]);c.stroke(path);c.restore()}
  const tree=(x:number,y:number,size:number,pine=false)=>{
   c.save();c.translate(x,y);c.scale(size,size);c.fillStyle='#8b7553';c.fillRect(-4,-65,8,68)
   if(pine){c.fillStyle='#477765';for(let j=0;j<4;j++){const yy=-110+j*20,w=12+j*8;c.beginPath();c.moveTo(0,yy);c.lineTo(w,yy+43);c.lineTo(-w,yy+43);c.fill()}}
   else {c.fillStyle='#7b985e';for(let j=0;j<5;j++){c.beginPath();c.ellipse(Math.sin(j*2)*22,-72+Math.cos(j*2)*16,29,31,0,0,Math.PI*2);c.fill()}c.fillStyle='#b8bb78';c.beginPath();c.ellipse(-16,-87,14,21,-.4,0,Math.PI*2);c.fill()}
   c.restore()
  }
  if(index===0){
   ground();mountain(340,284,175,55+145*p);mountain(200,292,160,40+192*p)
   c.strokeStyle='#f5e7c281';c.lineWidth=2
   for(let k=0;k<4;k++){c.beginPath();c.moveTo(40+k*17,292-k*14);c.quadraticCurveTo(181,280-k*25,276-k*13,292-k*14);c.stroke()}
  }else if(index===1){
   mountain(205,254,180,150);ground();river(p)
   c.fillStyle='#f1eee0';for(let j=0;j<3;j++){c.beginPath();c.ellipse(148+j*40,76+(j%2)*9,43,22,0,0,Math.PI*2);c.fill()}
   c.strokeStyle='#749fa5';c.lineWidth=3
   for(let j=0;j<15;j++){const x=123+j%5*27,y=106+((j*19+time*54)%92);c.beginPath();c.moveTo(x,y);c.lineTo(x-6,y+13);c.stroke()}
   c.strokeStyle='#d5edf0';c.lineWidth=3
   for(let j=0;j<4;j++){const yy=256+((time*21+j*21)%76);c.beginPath();c.moveTo(310,yy);c.lineTo(320,yy+3);c.stroke()}
  }else if(index===2){
   mountain(182,215,140,107);ground();river(1)
   c.fillStyle=`rgba(93,141,102,${.1+.4*p})`;c.beginPath();c.ellipse(187,286,112,39,-.18,0,Math.PI*2);c.fill()
   for(let j=0;j<12;j++){const x=86+(j*37)%190,y=240+(j*23)%83;c.strokeStyle='#648557';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x-4,y-14*p);c.moveTo(x,y);c.lineTo(x+7,y-10*p);c.stroke()}
   c.fillStyle='#e6c979';for(let j=0;j<5;j++){c.beginPath();c.arc(113+j*30,271+Math.sin(j)*18,3*p,0,Math.PI*2);c.fill()}
   tree(434,279,.3+.28*p)
  }else{
   mountain(383,244,180,126);ground();river(1)
   tree(179,304,.25+.9*p);tree(109,284,.18+.44*p,true);tree(279,286,.3+.38*p,true)
   const births=ease((age-.65)/1.1);tree(349,310,.08+.27*births);tree(398,289,.05+.23*births,true)
   c.strokeStyle='#a48353';c.setLineDash([3,7]);c.beginPath();c.moveTo(190,247);c.quadraticCurveTo(283,196,343,279);c.stroke();c.setLineDash([])
   c.fillStyle='#c19b52';c.beginPath();c.ellipse(225+births*115,230+births*43,5,3,-.8,0,Math.PI*2);c.fill()
  }
  c.restore();c.fillStyle='#444e48';c.font='bold 19px Arial';c.fillText(STORY_BEATS[index].label,25,371)
  c.font='italic 18px Georgia';c.fillStyle='#747466';c.fillText(['A field becomes hills','Rain follows the slopes','Moisture makes a home','Growth, then new seedlings'][index],25,397)
  c.fillStyle='#c9b67db3';c.save();c.translate(280,20);c.rotate(-.06);c.fillRect(-50,-13,100,26);c.restore()
  card.texture.needsUpdate=true
 }
 draw(time:number){
  this.cards.forEach((card,i)=>{
   const age=time-STORY_BEATS[i].at;card.group.visible=age>=0;card.line.visible=age>=0
   if(age<0){card.lastFrame=-1;return}
   const p=this.reduced?1:ease(age/.65),[x,z,turn]=POSTCARD_POSITIONS[i]
   card.group.position.set(x,.8+i*.015+(1-p)*4,z-(1-p)*2);card.group.scale.setScalar(.88+.12*p);card.group.rotation.y=turn+(1-p)*.2
   card.line.geometry.setDrawRange(0,Math.max(2,Math.floor(61*p)))
   const frame=Math.floor(Math.min(age,3)*16)
   if(frame!==card.lastFrame){this.illustrate(card,i,Math.min(age,3));card.lastFrame=frame}
  })
 }
 dispose(){this.cards.forEach(card=>card.texture.dispose())}
}
