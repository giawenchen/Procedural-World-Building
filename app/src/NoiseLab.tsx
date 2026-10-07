import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { coordinates, makeLayer, sample } from './noiseEngine'
import type { Layer } from './noiseEngine'
import './NoiseLab.css'
import { createAtlasMaterial, applyAppearance, PAPER, elevationColor } from './worldStyle'
import type { Appearance } from './worldStyle'

function Range({label,value,min,max,step=.01,onChange}:{label:string;value:number;min:number;max:number;step?:number;onChange:(n:number)=>void}) {
 return <label className="lab-range"><span>{label}<output>{Number(value.toFixed(2))}</output></span><input aria-label={label} type="range" min={min} max={max} step={step} value={value} onChange={e=>onChange(+e.target.value)}/></label>
}
function Select({label,value,options,onChange}:{label:string;value:string;options:string[];onChange:(s:string)=>void}) {return <label className="lab-select">{label}<select value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o}>{o}</option>)}</select></label>}
function Preview({layers,solo,planet,resolution,height,wireframe,mode,appearance}:{appearance:Appearance;layers:Layer[];solo:number|null;planet:boolean;resolution:number;height:number;wireframe:boolean;mode:string}) {
 const mount=useRef<HTMLDivElement>(null), map=useRef<HTMLCanvasElement>(null)
 const runtime=useRef<{mesh:THREE.Mesh;renderer:THREE.WebGLRenderer;scene:THREE.Scene;camera:THREE.PerspectiveCamera;controls:OrbitControls}|null>(null)
 const field=useMemo(()=>{
   const values=new Float32Array((resolution+1)**2)
   for(let j=0;j<=resolution;j++) for(let i=0;i<=resolution;i++) values[j*(resolution+1)+i]=sample(layers,solo,...coordinates(i/resolution,j/resolution,planet))
   return values
 },[layers,solo,planet,resolution])
 useEffect(()=>{
  const canvas=map.current;if(!canvas)return
  canvas.width=resolution+1;canvas.height=resolution+1
  const ctx=canvas.getContext('2d')!;const image=ctx.createImageData(canvas.width,canvas.height)
  field.forEach((v,i)=>{ const n=Math.round((v+1)*127.5);image.data.set([n,n,n,255],i*4) });ctx.putImageData(image,0,0)
 },[field,resolution,mode])
 useEffect(()=>{
  const el=mount.current;if(!el)return
  const scene=new THREE.Scene();scene.background=new THREE.Color(PAPER)
  const camera=new THREE.PerspectiveCamera(45,1,.1,100);camera.position.set(6,5,7)
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));el.appendChild(renderer.domElement)
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true
  const mesh=new THREE.Mesh(new THREE.BufferGeometry(),createAtlasMaterial());scene.add(mesh)
  scene.add(new THREE.HemisphereLight('#ffffff','#25263e',2));const light=new THREE.DirectionalLight('#ffffff',3);light.position.set(4,6,3);scene.add(light)
  const observer=new ResizeObserver(()=>{const w=el.clientWidth,h=Math.max(el.clientHeight,1);if(!w)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()});observer.observe(el)
  let frame=0;const animate=()=>{frame=requestAnimationFrame(animate);if(el.clientWidth){controls.update();renderer.render(scene,camera)}};animate()
  runtime.current={mesh,renderer,scene,camera,controls}
  return()=>{cancelAnimationFrame(frame);observer.disconnect();controls.dispose();mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();renderer.dispose();el.removeChild(renderer.domElement);runtime.current=null}
 },[])
 useEffect(()=>{
  const rt=runtime.current;if(!rt)return
  const geometry=planet?new THREE.SphereGeometry(2,resolution,resolution):new THREE.PlaneGeometry(6,6,resolution,resolution)
  const pos=geometry.getAttribute('position');const colors=new Float32Array(pos.count*3);const color=new THREE.Color()
  for(let i=0;i<pos.count;i++) {
   const n=field[i], displacement=n*height
   if(planet){const v=new THREE.Vector3().fromBufferAttribute(pos,i).normalize().multiplyScalar(2+displacement);pos.setXYZ(i,v.x,v.y,v.z)}
   else {const x=pos.getX(i),y=pos.getY(i);pos.setXYZ(i,x,displacement,-y)}
   elevationColor((n+1)/2,color);color.toArray(colors,i*3)
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeVertexNormals();rt.mesh.geometry.dispose();rt.mesh.geometry=geometry
 },[field,planet,resolution,height])
 useEffect(()=>{const rt=runtime.current;if(!rt)return;const material=rt.mesh.material as THREE.ShaderMaterial;applyAppearance(material,appearance);material.wireframe=wireframe;material.uniforms.radius.value=planet?2:0;material.uniforms.interval.value=.1;material.uniforms.floorHeight.value=-height;material.uniforms.amplitude.value=height*2;material.uniforms.markScale.value=4},[wireframe,appearance,planet,height])
 return <div className={'lab-previews '+(mode==='Split'?'split':'')}>
 <section style={{display:mode==='3D only'?'none':undefined}}><h3>2D noise map · {planet?'spherical UV projection':'planar XY slice'}</h3><canvas className="noise-map" ref={map}/><p>Black −1 · gray 0 · white +1. Same samples as the mesh.</p></section>
 <section style={{display:mode==='2D only'?'none':undefined}}><h3>{planet?'3D planet':'3D terrain grid'} · drag to orbit / scroll to zoom</h3><div className="lab-render" ref={mount}/><div className="world-key"><span><i className="key-sand"/>Low</span><span><i className="key-green"/>Mid</span><span><i className="key-rock"/>High</span><small>Height study · no water surface or biome simulation</small></div><p>{(resolution+1)**2} vertices · displacement = noise × height · contours 0.1 u</p></section>
 </div>
}
export default function NoiseLab({layers,setLayers,solo,setSolo,appearance}:{appearance:Appearance;layers:Layer[];setLayers:import('react').Dispatch<import('react').SetStateAction<Layer[]>>;solo:number|null;setSolo:import('react').Dispatch<import('react').SetStateAction<number|null>>}){
 const next=useRef(2)
 const [planet,setPlanet]=useState(false),[resolution,setResolution]=useState(64),[height,setHeight]=useState(.8),[wireframe,setWireframe]=useState(false),[mode,setMode]=useState('Split')
 const update=(id:number,patch:Partial<Layer>)=>setLayers(ls=>ls.map(l=>l.id===id?{...l,...patch}:l))
 return <div className="noise-lab"><header className="lab-heading"><div><span className="sim-eyebrow">02 / DENSITY STUDIES</span><h1>Noise laboratory</h1><p>Equation → shaping → layer blend → surface. Shared with Simulation map; separate from Original planet.</p></div><button onClick={()=>{const blob=new Blob([JSON.stringify({layers,planet,resolution,height,wireframe,appearance},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='noise-recipe.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}}>Export recipe</button></header>
 <div className="lab-layout"><aside className="lab-controls"><h2>Surface & sampling</h2>
 <Select label="Surface" value={planet?'Planet':'Plane'} options={['Plane','Planet']} onChange={v=>setPlanet(v==='Planet')}/>
 <Select label="View" value={mode} options={['Split','2D only','3D only']} onChange={setMode}/>
 <Range label="Grid segments" value={resolution} min={16} max={128} step={8} onChange={setResolution}/><Range label="Displacement height" value={height} min={0} max={1.5} onChange={setHeight}/>
 <label><input type="checkbox" checked={wireframe} onChange={e=>setWireframe(e.target.checked)}/> Wireframe</label>
 <h2>Noise layers <small>{layers.length}/4</small></h2><p className="lab-hint">Top to bottom. First active layer initializes the field; later layers blend into it. Final output is clipped to −1…1.</p>
 {layers.map((l,index)=><details key={l.id} open><summary>{l.name}{solo===l.id?' · SOLO':''}</summary><div className="layer-tools"><label><input type="checkbox" checked={l.enabled} onChange={e=>update(l.id,{enabled:e.target.checked})}/>Enabled</label><button aria-pressed={solo===l.id} onClick={()=>setSolo(solo===l.id?null:l.id)}>Solo</button><button disabled={index===0} onClick={()=>setLayers(ls=>{const copy=[...ls];[copy[index-1],copy[index]]=[copy[index],copy[index-1]];return copy})}>Move up</button><button disabled={layers.length===1} onClick={()=>{setLayers(ls=>ls.filter(a=>a.id!==l.id));if(solo===l.id)setSolo(null)}}>Remove</button></div>
 <Select label="Noise equation" value={l.type} options={['Perlin','Cellular','Sine']} onChange={type=>update(l.id,{type})}/>
 <Range label="Seed" value={l.seed} min={0} max={100} step={1} onChange={seed=>update(l.id,{seed})}/><Range label="Frequency" value={l.frequency} min={.2} max={6} onChange={frequency=>update(l.id,{frequency})}/><Range label="Amplitude" value={l.amplitude} min={0} max={2} onChange={amplitude=>update(l.id,{amplitude})}/><Range label="Octaves" value={l.octaves} min={1} max={5} step={1} onChange={octaves=>update(l.id,{octaves})}/><Range label="Persistence" value={l.persistence} min={0} max={1} onChange={persistence=>update(l.id,{persistence})}/>
 <Select label="Shaping operation" value={l.modifier} options={['None','Ridged','Billow','Turbulence','Terracing','Power curve','Domain warping','Invert']} onChange={modifier=>update(l.id,{modifier})}/>
 {['Ridged','Billow','Terracing','Power curve','Invert'].includes(l.modifier)&&<Range label="Shape mix" value={l.strength} min={0} max={1} onChange={strength=>update(l.id,{strength})}/>}
 {l.modifier==='Terracing'&&<Range label="Terrace steps" value={l.steps} min={2} max={20} step={1} onChange={steps=>update(l.id,{steps})}/>}
 {l.modifier==='Power curve'&&<Range label="Exponent" value={l.power} min={.2} max={5} onChange={power=>update(l.id,{power})}/>}
 {l.modifier==='Domain warping'&&<Range label="Warp strength" value={l.warp} min={0} max={2} onChange={warp=>update(l.id,{warp})}/>}
 {l.modifier==='Turbulence'&&<p className="lab-hint">Absolute noise at each octave. Use Octaves and Persistence to control detail.</p>}
 <Select label="Blend mode" value={l.blend} options={['Add','Mix','Multiply','Max']} onChange={blend=>update(l.id,{blend})}/><Range label="Layer weight" value={l.weight} min={0} max={1} onChange={weight=>update(l.id,{weight})}/>
 </details>)}<button disabled={layers.length>=4} onClick={()=>{const layer=makeLayer(next.current++);setLayers(ls=>[...ls,layer])}}>+ Add noise layer</button>
 </aside><div className="lab-stage"><Preview {...{layers,solo,planet,resolution,height,wireframe,mode,appearance}}/><p className="lab-hint">Try: Perlin → Ridged → add a low-amplitude Cellular layer. Switch to Planet to sample a seamless 3D field on a sphere; its 2D projection changes accordingly. Recipes export settings; screenshots remain separate.</p></div></div></div>
}
