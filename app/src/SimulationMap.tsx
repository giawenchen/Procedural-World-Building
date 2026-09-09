import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { sample } from './noiseEngine'
import type { Layer } from './noiseEngine'
import { erode } from './hydraulic'
import { measureField, rainAt } from './simulationField'
import type { FieldStats } from './simulationField'
import './SimulationMap.css'

type Mode = 'explore' | 'erosion'
type View = 'landscape' | 'water' | 'change'
type Tool = 'orbit' | 'rain'
type Command = { storm:()=>void; step:()=>void; runBatch:()=>void; home:()=>void }
const SPAN=192
const EMPTY:FieldStats={cut:0,fill:0,changed:0,water:0}

export default function SimulationMap({layers,solo}:{layers:Layer[];solo:number|null}) {
 const [running,setRunning]=useState(false),[wire,setWire]=useState(false)
 const [resolution,setResolution]=useState(96),[height,setHeight]=useState(22),[sea,setSea]=useState(-4),[speed,setSpeed]=useState(12)
 const [mode,setMode]=useState<Mode>('erosion'),[rain,setRain]=useState(.015),[reset,setReset]=useState(0)
 const [view,setView]=useState<View>('landscape'),[tool,setTool]=useState<Tool>('orbit'),[before,setBefore]=useState(false)
 const [hud,setHud]=useState({steps:0,x:0,z:0,storm:0,...EMPTY})
 const [message,setMessage]=useState('Try a storm. Then inspect where the ground moved.')
 const mount=useRef<HTMLDivElement>(null),map=useRef<HTMLCanvasElement>(null),commands=useRef<Command|null>(null)
 const live=useRef({running,wire,speed,rain,view,tool,before})
 useEffect(()=>{live.current={running,wire,speed,rain,view,tool,before}},[running,wire,speed,rain,view,tool,before])
 const active=layers.filter(l=>l.enabled&&(solo===null||solo===l.id))
 const spacing=SPAN/resolution
 const shortest=active.length?64/Math.max(...active.map(l=>l.frequency*2**(l.octaves-1))):Infinity
 const restart=()=>{setRunning(false);setBefore(false);setHud({steps:0,x:0,z:0,storm:0,...EMPTY});setReset(v=>v+1);setMessage('Fresh terrain. Same noise stack, a new experiment.')}
 const compare=()=>{setRunning(false);setBefore(v=>!v)}
 useEffect(()=>{
  const el=mount.current;if(!el)return
  const scene=new THREE.Scene();scene.background=new THREE.Color('#080810');scene.fog=new THREE.Fog('#080810',170,290)
  const camera=new THREE.PerspectiveCamera(43,1,.5,600);camera.position.set(112,124,144)
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));el.appendChild(renderer.domElement)
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Terrain viewport. Drag to orbit. Use F for wireframe and Space to pause.');renderer.domElement.setAttribute('role','img')
  const controls=new OrbitControls(camera,renderer.domElement);controls.minDistance=30;controls.maxDistance=255;controls.maxPolarAngle=Math.PI*.47;controls.enablePan=false
  const geometry=new THREE.PlaneGeometry(SPAN,SPAN,resolution,resolution);geometry.rotateX(-Math.PI/2)
  const positions=geometry.getAttribute('position'),colors=new Float32Array(positions.count*3);geometry.setAttribute('color',new THREE.BufferAttribute(colors,3))
  const material=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.95,flatShading:false})
  const terrain=new THREE.Mesh(geometry,material);scene.add(terrain)
  const waterGeometry=new THREE.PlaneGeometry(SPAN,SPAN);waterGeometry.rotateX(-Math.PI/2)
  const waterMaterial=new THREE.MeshStandardMaterial({color:'#3869a0',roughness:.3,transparent:true,opacity:.8})
  const water=new THREE.Mesh(waterGeometry,waterMaterial);water.position.y=sea;scene.add(water)
  scene.add(new THREE.HemisphereLight('#fff1d8','#343652',1.7))
  const sun=new THREE.DirectionalLight('#fff0d2',2);sun.position.set(-40,90,25);scene.add(sun)
  const boundaryPlane=new THREE.PlaneGeometry(SPAN,SPAN)
  const outlineGeometry=new THREE.EdgesGeometry(boundaryPlane);boundaryPlane.dispose();outlineGeometry.rotateX(-Math.PI/2)
  const outlineMaterial=new THREE.LineBasicMaterial({color:'#dcc27f',transparent:true,opacity:.24})
  const outline=new THREE.LineSegments(outlineGeometry,outlineMaterial);outline.position.y=-height-2;scene.add(outline)
  const ringGeometry=new THREE.RingGeometry(13,14,64);ringGeometry.rotateX(-Math.PI/2)
  const ringMaterial=new THREE.MeshBasicMaterial({color:'#dcc27f',side:THREE.DoubleSide,transparent:true,opacity:.85,depthTest:false})
  const ring=new THREE.Mesh(ringGeometry,ringMaterial);ring.visible=false;ring.renderOrder=10;scene.add(ring)
  const palette=['#29465e','#dcc27f','#678a52','#355a43','#858079','#e5e8df'].map(c=>new THREE.Color(c))
  const wetColor=new THREE.Color('#448fe0'),dryColor=new THREE.Color('#222c40'),neutral=new THREE.Color('#aaa799'),cutColor=new THREE.Color('#e7a36c'),fillColor=new THREE.Color('#63bdb1'),color=new THREE.Color()
  const ctx=map.current?.getContext('2d');if(map.current){map.current.width=resolution+1;map.current.height=resolution+1}
  const ground=new Float32Array(positions.count),baseline=new Float32Array(positions.count),waterField=new Float32Array(positions.count),sediment=new Float32Array(positions.count)
  let iteration=0,storm=0,batchEnd=Infinity,x=0,z=0,centerX=Infinity,centerZ=Infinity,last=0,lastTick=0,lastHud=0,frame=0,dirty=true,geometryDirty=true,shownBefore=false,shownView:View='landscape',ringUntil=0
  const keys=new Set<string>()
  function generate(){
   centerX=Math.round(x/spacing)*spacing;centerZ=Math.round(z/spacing)*spacing
   for(let j=0;j<=resolution;j++)for(let i=0;i<=resolution;i++){
    const index=j*(resolution+1)+i,wx=centerX-SPAN/2+i*spacing,wz=centerZ-SPAN/2+j*spacing
    ground[index]=sample(layers,solo,wx/64,wz/64,.37)*height;baseline[index]=ground[index]
   }
   dirty=true;geometryDirty=true
  }
  function updateSurface(){
   const image=ctx?.createImageData(resolution+1,resolution+1)
   const showBefore=live.current.before,currentView=live.current.view
   for(let i=0;i<ground.length;i++){
    const y=showBefore?baseline[i]:ground[i],delta=showBefore?0:ground[i]-baseline[i],wet=showBefore?0:waterField[i]
    positions.setY(i,y)
    if(mode==='erosion'&&currentView==='change')color.copy(neutral).lerp(delta<0?cutColor:fillColor,Math.min(Math.abs(delta)/.5,1))
    else if(mode==='erosion'&&currentView==='water')color.copy(dryColor).lerp(wetColor,Math.min(wet/1,1))
    else {
     const h=y-sea,stops=[-3,1.5,7,14,22,29];let band=0
     while(band<4&&h>stops[band+1])band++
     color.copy(palette[band]).lerp(palette[band+1],THREE.MathUtils.smoothstep(h,stops[band],stops[band+1]))
     if(mode==='erosion')color.lerp(wetColor,Math.min(wet*.16,.25))
    }
    color.toArray(colors,i*3)
    if(image){const v=Math.max(0,Math.min(255,Math.round((height?y/height:0)*127+128)));image.data.set([v,v,v,255],i*4)}
   }
   positions.needsUpdate=true;geometry.getAttribute('color').needsUpdate=true
   if(geometryDirty||shownBefore!==showBefore){geometry.computeVertexNormals();geometry.computeBoundingSphere()}
   if(image)ctx?.putImageData(image,0,0)
   geometryDirty=false;dirty=false;shownBefore=showBefore;shownView=currentView
  }
  function publish(){setHud({steps:iteration,x,z,storm,...measureField(ground,baseline,waterField)})}
  function tick(){
   erode(ground,waterField,sediment,resolution+1,spacing,live.current.rain+(storm>0?.06:0))
   iteration++;if(storm>0){storm--;if(storm===0)setMessage('Storm passed. Switch to Ground change to find its footprint.')}
   dirty=true;geometryDirty=true
  }
  commands.current={
   storm(){if(live.current.before)return;storm=50;batchEnd=Infinity;setRunning(true);setMessage('Storm incoming: +0.060 rain units per step for 50 simulation steps.');publish()},
   step(){if(live.current.before)return;setRunning(false);batchEnd=Infinity;tick();publish()},
   runBatch(){if(live.current.before)return;batchEnd=iteration+100;setRunning(true);setMessage('Running 100 steps, then pausing for inspection.')},
   home(){camera.position.set(112,124,144);controls.target.set(0,0,0);controls.update()},

  }
  const editable=(target:EventTarget|null)=>target instanceof HTMLElement&&!!target.closest('input,select,textarea,button,[contenteditable="true"]')
  const down=(e:KeyboardEvent)=>{
   if(editable(e.target)||e.ctrlKey||e.metaKey||e.altKey)return
   const key=e.key.toLowerCase()
   if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','f','b'].includes(key)){
    e.preventDefault();keys.add(key)
    if(!e.repeat&&key==='f')setWire(v=>!v)
    if(!e.repeat&&key===' '&&!live.current.before){batchEnd=Infinity;setRunning(v=>!v)}
    if(!e.repeat&&key==='b'&&mode==='erosion'){setRunning(false);setBefore(v=>!v)}
   }
  }
  const up=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase()),clear=()=>keys.clear()
  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2()
  const pour=(e:PointerEvent)=>{
   renderer.domElement.focus()
   if(mode!=='erosion'||live.current.tool!=='rain'||live.current.before||e.button!==0)return
   const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1)
   raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObject(terrain)[0];if(!hit)return
   rainAt(waterField,resolution+1,SPAN,hit.point.x,hit.point.z)
   ring.position.copy(hit.point);ring.position.y+=.2;ringUntil=performance.now()+1100;ring.visible=true
   dirty=true;publish();setMessage('Rain added here. Press Start or +1 step to watch it travel downhill.')
  }
  renderer.domElement.addEventListener('pointerdown',pour)
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear)
  const ro=new ResizeObserver(()=>{const w=el.clientWidth,h=el.clientHeight;if(!w||!h)return;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix()});ro.observe(el)
  generate();updateSurface()
  const animate=(now:number)=>{
   const dt=Math.min((now-last)/1000,.05);last=now
   controls.enableRotate=mode!=='erosion'||live.current.tool==='orbit'||live.current.before
   renderer.domElement.style.cursor=mode==='erosion'&&live.current.tool==='rain'&&!live.current.before?'crosshair':'grab'
   if(!document.hidden&&live.current.running&&!live.current.before&&mode==='explore'){
    let dx=Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),dz=Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'));const length=Math.hypot(dx,dz)
    if(length){dx/=length;dz/=length;x+=dx*dt*live.current.speed;z+=dz*dt*live.current.speed}
   }
   if(mode==='erosion'&&live.current.running&&!live.current.before&&!document.hidden&&now-lastTick>100){
    tick();lastTick=now
    if(iteration>=batchEnd){setRunning(false);batchEnd=Infinity;setMessage('100 steps complete. Compare with the original, or run another experiment.')}
   }
   if(mode==='explore'&&now-lastTick>100&&(Math.round(x/spacing)*spacing!==centerX||Math.round(z/spacing)*spacing!==centerZ)){generate();lastTick=now}
   if(dirty||shownBefore!==live.current.before||shownView!==live.current.view)updateSurface()
   terrain.position.set(centerX-x,0,centerZ-z);water.position.set(centerX-x,sea,centerZ-z);outline.position.set(centerX-x,-height-2,centerZ-z)
   material.wireframe=live.current.wire;water.visible=!live.current.wire&&mode==='explore';ring.visible=now<ringUntil&&!live.current.before
   controls.update();if(!document.hidden)renderer.render(scene,camera)
   if(now-lastHud>200){publish();lastHud=now}frame=requestAnimationFrame(animate)
  };frame=requestAnimationFrame(animate)
  return()=>{
   commands.current=null;cancelAnimationFrame(frame);ro.disconnect();controls.dispose();geometry.dispose();material.dispose();waterGeometry.dispose();waterMaterial.dispose();outlineGeometry.dispose();outlineMaterial.dispose();ringGeometry.dispose();ringMaterial.dispose();renderer.dispose();el.removeChild(renderer.domElement)
   window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear)
  }
 },[layers,solo,resolution,height,sea,reset,spacing,mode])
 const capture=()=>{
  const source=mount.current?.querySelector('canvas');if(!source)return
  const frameCanvas=document.createElement('canvas'),width=source.width,pixelHeight=source.height
  frameCanvas.width=width;frameCanvas.height=pixelHeight+96
  const context=frameCanvas.getContext('2d');if(!context)return
  context.fillStyle='#080810';context.fillRect(0,0,width,pixelHeight+96);context.drawImage(source,0,0)
  context.fillStyle='#dcc27f';context.font='18px sans-serif'
  context.fillText(`SIMULATION MAP / ${mode} / ${view} / ${before?'original, step 0':`step ${hud.steps}`}`,20,pixelHeight+36)
  context.fillStyle='#b8b8c0';context.font='14px sans-serif'
  context.fillText(`${resolution} segments / relief ${height} / rain ${rain.toFixed(3)} / educational model`,20,pixelHeight+67)
  frameCanvas.toBlob(blob=>{
   if(!blob){setMessage('Could not capture this frame. Please try again.');return}
   const url=URL.createObjectURL(blob),link=document.createElement('a');link.download=`simulation-${view}-${before?'original':hud.steps}.png`;link.href=url
   document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30000)
   setMessage('PNG download requested. Check your browser downloads, then save the frame beside your notes.')
  },'image/png')
 }
 const erosion=mode==='erosion'
 return <main className="simulation">
  <header className="sim-header"><div><span className="sim-eyebrow">PLANET STUDIO / SIMULATION</span><h1>{erosion?'A little rain. A different world.':'There is more beyond the horizon.'}</h1><p>{erosion?'Make it rain, follow the water, uncover the changes.':'Explore a continuous landscape made from your noise stack.'}</p></div><div className="sim-status"><span className={running?'sim-state running':'sim-state'}>{before?'Original preview':running?'Running':'Paused'}</span><strong>{hud.steps.toLocaleString()}</strong><span>simulation steps</span></div></header>
  <div className="sim-workspace">
   <section className="sim-stage" aria-label="Terrain playground">
    <div className="sim-stage-tools"><div className="sim-segment" aria-label="Terrain tools">{(['orbit','rain'] as Tool[]).filter(t=>erosion||t==='orbit').map(t=><button key={t} aria-pressed={tool===t} disabled={before&&t==='rain'} onClick={()=>setTool(t)}>{t==='orbit'?'Orbit':'Paint rain'}</button>)}</div><div className="sim-camera-actions"><button onClick={()=>commands.current?.home()}>Reset camera</button><button onClick={capture}>Save frame</button></div></div>
    <div className="sim-canvas" ref={mount}/>
    <div className="sim-view-caption">{before?'ORIGINAL · step 0':erosion?`LIVE TERRAIN · step ${hud.steps}`:'WORLD-SPACE TERRAIN'}<span>{view==='water'&&erosion?'Dark → blue: 0–1+ units of water':view==='change'&&erosion?'Orange: erosion · teal: deposition · full color at ±0.5 units':'Smooth elevation colors · sand / grass / rock / snow'}</span></div>
    <div className="sim-transport"><button className="sim-primary" disabled={before} onClick={()=>setRunning(v=>!v)}>{running?'Pause':'Start'}</button>{erosion&&<><button disabled={before} onClick={()=>commands.current?.step()}>+1 step</button><button disabled={before} onClick={()=>commands.current?.runBatch()}>Run 100 steps</button><button className={before?'selected':''} aria-pressed={before} onClick={compare}>{before?'Back to current':'Compare original'} <kbd>B</kbd></button></>}<button onClick={restart}>Reset {erosion?'terrain':'position'}</button></div>
   </section>
   <aside className="sim-controls" aria-label="Simulation controls">
    <label className="sim-field">Perspective<select value={mode} onChange={e=>{setMode(e.target.value as Mode);setTool('orbit');restart()}}><option value="erosion">Hydraulic erosion</option><option value="explore">Explore infinite field</option></select></label>
    {erosion&&<section className="sim-experiment"><span className="sim-eyebrow">TRY THIS</span><h2>Send a storm over the hills.</h2><p>Guess where water will gather. Add rain, then switch to Ground change to check your prediction.</p><button className="sim-storm" disabled={before} onClick={()=>commands.current?.storm()}>{hud.storm>0?`Storm · ${hud.storm} steps left`:'Make it rain'}<span>50-step downpour</span></button><label className="sim-field">Weather<output>{rain===0?'Dry':`${rain.toFixed(3)} units / step`}</output><input aria-label="Rainfall" type="range" min={0} max={.08} step={.005} value={rain} onChange={e=>setRain(+e.target.value)}/></label><p className="sim-small">Set rain to zero to watch existing water drain and evaporate. Weather changes keep your progress.</p></section>}
    {erosion&&<section className="sim-lenses"><h2>See what is happening</h2><div className="sim-segment">{([{id:'landscape',label:'Landscape'},{id:'water',label:'Water'},{id:'change',label:'Ground change'}] as const).map(v=><button key={v.id} aria-pressed={view===v.id} onClick={()=>setView(v.id)}>{v.label}</button>)}</div><div className="sim-metrics"><div><span>Deepest cut</span><strong>{hud.cut.toFixed(3)} <small>u</small></strong></div><div><span>Largest deposit</span><strong>{hud.fill.toFixed(3)} <small>u</small></strong></div><div><span>Ground changed &gt;0.01 u</span><strong>{hud.changed.toFixed(1)}<small>%</small></strong></div><div><span>Mean surface water</span><strong>{hud.water.toFixed(3)} <small>u</small></strong></div></div><p className="sim-small">Measurements describe the current field, even when previewing the original.</p></section>}
    <figure className="sim-map"><canvas ref={map} aria-label="Height map of the visible terrain window"/><figcaption>Height field / north up<span>Dark = low · light = high<br/>Same samples as the mesh</span></figcaption></figure>
    <label className="sim-check"><input type="checkbox" checked={wire} onChange={e=>setWire(e.target.checked)}/>Wireframe <kbd>F</kbd></label>
    <details className="sim-calibration"><summary>Terrain & calibration</summary><label className="sim-field">Resolution<select value={resolution} onChange={e=>{setResolution(+e.target.value);restart()}}><option value={64}>64 × 64 · draft</option><option value={96}>96 × 96 · balanced</option><option value={128}>128 × 128 · fine</option></select></label>{([{label:'Relief height',value:height,min:0,max:45,set:setHeight},{label:'Sea level',value:sea,min:-20,max:15,set:setSea},{label:'Travel speed',value:speed,min:2,max:30,set:setSpeed}]).filter(c=>!erosion||c.label==='Relief height').map(c=><label className="sim-field" key={c.label}>{c.label}<output>{c.value} {c.label==='Travel speed'?'u/s':'u'}</output><input aria-label={c.label} type="range" min={c.min} max={c.max} step={1} value={c.value} onChange={e=>{c.set(+e.target.value);if(c.label!=='Travel speed')restart()}}/></label>)}<p>{active.length} active layers · {2*resolution*resolution} triangles · {spacing.toFixed(2)} units/sample.</p><p>{shortest/spacing<4?'Fine noise is undersampled: reduce frequency/octaves or use a finer grid.':'Nominal detail has at least four samples per feature scale.'} Shaping can add smaller details.</p><p>Calibration changes reset the experiment. Fixed 192-unit erosion window; closed edges; approximate educational model. Steps are not real-world days. Leaving this workspace resets its progress.</p></details>
   </aside>
  </div>
  <footer className="sim-footer"><p role="status">{erosion?message:`X ${hud.x.toFixed(1)} · Z ${hud.z.toFixed(1)} · Start, then use WASD / arrows to explore.`}</p><span>Drag: orbit · Scroll: zoom · Space: pause · F: wireframe{erosion?' · B: compare':''}</span></footer>
 </main>
}
