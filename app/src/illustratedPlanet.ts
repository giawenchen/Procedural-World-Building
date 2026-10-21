import * as THREE from 'three'
import { makeLayer, sample, coordinates } from './noiseEngine.ts'

export type GlobeSettings={radius:number;resolution:number;relief:number;frequency:number;sea:number;moisture:number;temperature:number;ico?:boolean}
// Store a scalar field, not painted vertex colors. The fragment shader classifies
// each pixel so that coasts stay sharp independently of mesh density.
export function createIllustratedPlanet(s:GlobeSettings){
 const layers=[{...makeLayer(1),frequency:s.frequency,weight:1}],wet=[{...makeLayer(2),frequency:1.4,weight:1}]
 const w=512,h=256,data=new Uint8Array(w*h*4)
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const n=coordinates((x+.5)/w,1-(y+.5)/h,true),v=sample(layers,null,...n),m=sample(wet,null,...n)
  data.set([Math.round((v*.5+.5)*255),Math.round((m*.5+.5)*255),0,255],(y*w+x)*4)
 }
 const texture=new THREE.DataTexture(data,w,h);texture.wrapS=THREE.RepeatWrapping;texture.minFilter=texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true
 const g=s.ico?new THREE.IcosahedronGeometry(s.radius,Math.min(5,Math.max(1,Math.round(s.resolution/24)))):new THREE.SphereGeometry(s.radius,s.resolution,Math.round(s.resolution/2)),p=g.getAttribute('position'),n=new THREE.Vector3()
 for(let i=0;i<p.count;i++){n.fromBufferAttribute(p,i).normalize();const height=sample(layers,null,n.x,n.y,n.z)*s.relief,r=s.radius+Math.max(s.sea,height)*.32;p.setXYZ(i,n.x*r,n.y*r,n.z*r)}
 g.computeVertexNormals()
 const material=new THREE.ShaderMaterial({uniforms:{field:{value:texture},relief:{value:s.relief},sea:{value:s.sea},moisture:{value:s.moisture},temperature:{value:s.temperature}},vertexShader:`
 varying vec3 vDirection,vNormal,vView,vSphere;
 void main(){vDirection=normalize(position);vSphere=normalize(normalMatrix*normalize(position));vNormal=normalize(normalMatrix*normal);vec4 p=modelViewMatrix*vec4(position,1.);vView=normalize(-p.xyz);gl_Position=projectionMatrix*p;}`,
 fragmentShader:`uniform sampler2D field;uniform float relief,sea,moisture,temperature;varying vec3 vDirection,vNormal,vView,vSphere;
 vec3 linearColor(vec3 c){return pow(c,vec3(2.2));}
 void main(){
 vec3 d=normalize(vDirection);vec2 uv=vec2(atan(d.z,-d.x)/6.2831853,1.-acos(clamp(d.y,-1.,1.))/3.14159265);uv.x=fract(uv.x);
 vec2 f=texture2D(field,uv).rg*2.-1.;float height=f.r*relief,land=height-sea;
 float temp=temperature-abs(d.y)*.65-max(height,0.)*.5,wet=moisture+f.g*.23;
 vec3 color;
 if(land<0.){
   color=vec3(.055,.34,.53);
   if(land>-.006)color=vec3(.32,.68,.72);
 }else if(land<.006)color=vec3(.90,.79,.52);
 else{
   color=wet>.57?vec3(.52,.67,.36):wet>.38?vec3(.68,.76,.43):vec3(.78,.64,.40);
   if(land>.13)color=vec3(.57,.51,.43);
   if(temp<.22||land>.25)color=vec3(.92,.94,.85);
 }
 // A small, intentional set of light bands; no screen grain or blurred bloom.
 vec3 normal=land<0.?normalize(vSphere):normalize(vNormal);float light=dot(normal,normalize(vec3(-.55,.8,.7)));
 float band=mix(.55,.78,smoothstep(-.14,-.10,light));band=mix(band,1.,smoothstep(.35,.39,light));
 vec3 ink=vec3(.32,.26,.52);color=mix(color*band,ink,.22*(1.-band));
 float rim=pow(1.-max(0.,dot(normal,normalize(vView))),4.);
 color=mix(color,vec3(.54,.48,.76),rim*.32);
 gl_FragColor=vec4(linearColor(color),1.);
 #include <colorspace_fragment>
 }`})
 material.userData.field=texture
 material.addEventListener('dispose',()=>texture.dispose())
 return new THREE.Mesh(g,material)
}
