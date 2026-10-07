import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

export function expandTree(iterations:number){
 let word='F'
 for(let i=0;i<Math.min(4,Math.max(0,iterations));i++)word=word.replaceAll('F','F[+F]F[-F][&F]')
 return word
}
export function treeSkeleton(iterations:number,angle:number){
 const word=expandTree(iterations),segments:{a:THREE.Vector3;b:THREE.Vector3;radius:number}[]=[],tips:THREE.Vector3[]=[]
 let position=new THREE.Vector3(),rotation=new THREE.Quaternion(),depth=0
 const stack:{position:THREE.Vector3;rotation:THREE.Quaternion;depth:number}[]=[]
 const step=4/2**iterations
 for(const c of word){
  if(c==='F'){
   const next=position.clone().add(new THREE.Vector3(0,step*Math.pow(.82,depth),0).applyQuaternion(rotation))
   segments.push({a:position.clone(),b:next.clone(),radius:.13*Math.pow(.62,depth)});position=next
  }else if(c==='[')stack.push({position:position.clone(),rotation:rotation.clone(),depth:depth++})
  else if(c===']'){tips.push(position.clone());const old=stack.pop()!;position=old.position;rotation=old.rotation;depth=old.depth}
  else {const axis=c==='&'?new THREE.Vector3(1,0,0):new THREE.Vector3(0,0,1);rotation.multiply(new THREE.Quaternion().setFromAxisAngle(axis,angle*Math.PI/180*(c==='-'?-1:1)));rotation.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),1.3))}
 }
 tips.push(position.clone());return {segments,tips}
}
export function buildTree(iterations:number,angle:number){
 const {segments,tips}=treeSkeleton(iterations,angle),pieces:THREE.BufferGeometry[]=[],leaves:THREE.BufferGeometry[]=[]
 for(const s of segments){const g=new THREE.CylinderGeometry(s.radius*.63,s.radius,s.a.distanceTo(s.b),6);g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),s.b.clone().sub(s.a).normalize()));g.translate(...s.a.clone().add(s.b).multiplyScalar(.5).toArray());pieces.push(g)}
 tips.forEach((tip,i)=>{for(let j=0;j<3;j++){const g=new THREE.PlaneGeometry(1.55,1.25);g.rotateY(j*Math.PI/3+i*.8);g.rotateX(.25*Math.sin(i));g.translate(tip.x,tip.y+.15,tip.z);leaves.push(g)}})
 const branches=mergeGeometries(pieces),foliage=mergeGeometries(leaves)
 pieces.forEach(g=>g.dispose());leaves.forEach(g=>g.dispose())
 return {branches,foliage,segments:segments.length}
}
export function leafTexture(){
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const c=canvas.getContext('2d')!
 c.fillStyle='white'
 for(let i=0;i<47;i++){const a=i*2.39996,r=7*Math.sqrt(i);c.beginPath();c.ellipse(64+Math.cos(a)*r,65+Math.sin(a)*r*.68,9,5,a,0,Math.PI*2);c.fill()}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;return texture
}
export function terrainMaterial(){
 const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1})
 m.onBeforeCompile=shader=>{
  shader.vertexShader='varying vec3 vEarth;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvEarth=position;')
  shader.fragmentShader='varying vec3 vEarth;\n'+shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    float grain=fract(sin(dot(floor(vEarth.xz*7.),vec2(12.9898,78.233)))*43758.5453);
    float broad=sin(vEarth.x*.7+sin(vEarth.z*.45))*sin(vEarth.z*.63);
    float strata=sin(vEarth.y*3.+sin(vEarth.x*.4));
    diffuseColor.rgb*=.94+broad*.045+grain*.075+strata*.018;
  `)
 };return m
}
export function coastalWater(map:THREE.DataTexture){return new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,uniforms:{ground:{value:map},time:{value:0},level:{value:0},speed:{value:1},direction:{value:0},swirl:{value:1}},vertexShader:`varying vec3 p;uniform float time;void main(){p=position;vec3 q=position;q.z+=.055*sin(q.x*.6+time)*sin(q.y*.42+time*.8);gl_Position=projectionMatrix*modelViewMatrix*vec4(q,1.);}`,fragmentShader:`
 uniform sampler2D ground;uniform float time,level,speed,direction,swirl;varying vec3 p;
 void main(){vec2 world=vec2(p.x,-p.y);float h=texture2D(ground,world/160.+.5).r*64.-24.;float depth=level-h;if(depth<.025)discard;
 vec2 flow=speed*(vec2(cos(direction),sin(direction))+swirl*vec2(-world.y,world.x)*.02);
 vec2 q=world*.55-flow*time*.3;
 float rip=pow(.5+.5*sin(q.x+sin(q.y*1.3)),18.);
 float foam=(1.-smoothstep(.05,1.15,depth))*(.65+.35*sin(time*2.+world.x*2.+world.y));
 vec3 col=mix(vec3(.39,.76,.72),vec3(.14,.40,.55),smoothstep(0.,14.,depth));
 col+=rip*.08;col=mix(col,vec3(.98,.93,.77),foam*.8);
 float caustic=pow(.5+.5*sin(q.x*2.+sin(q.y*2.)),22.)*(1.-smoothstep(0.,5.,depth));col+=caustic*.12;
 gl_FragColor=vec4(col,clamp(.45+depth*.05,.45,.91));
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`})}
export function disposeScene(scene:THREE.Scene){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();scene.traverse(obj=>{if(obj instanceof THREE.Mesh||obj instanceof THREE.Line||obj instanceof THREE.Points){geometries.add(obj.geometry);for(const m of Array.isArray(obj.material)?obj.material:[obj.material])materials.add(m)}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose())}
