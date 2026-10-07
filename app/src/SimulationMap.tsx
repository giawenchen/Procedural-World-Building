import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { sample } from './noiseEngine'
import type { Layer } from './noiseEngine'
import { erode } from './hydraulic'
import { measureField, rainAt } from './simulationField'
import type { FieldStats } from './simulationField'
import './SimulationMap.css'
import { createGrove, createLandscapeMaterial, MOODS, slopeAt, DEFAULT_GROVE } from './landscapeStyle'
import type { Mood } from './landscapeStyle'
import { applyAppearance, createAtlasMaterial, PAPER, STUDIO } from './worldStyle'
import type { Appearance } from './worldStyle'

type Mode = 'explore' | 'erosion'
type View = 'landscape' | 'water' | 'change' | 'slope'
type Tool = 'orbit' | 'rain'
type Command = { storm:()=>void; step:()=>void; runBatch:()=>void; home:()=>void; horizon:()=>void }
const SPAN=192
const EMPTY:FieldStats={cut:0,fill:0,changed:0,water:0}

export default function SimulationMap({layers,solo,appearance}:{appearance:Appearance;layers:Layer[];solo:number|null}) {
 const mood: Mood = 'lakeside'
 const [groves,setGroves]=useState(true)
 const [groveSettings,setGroveSettings]=useState(DEFAULT_GROVE)
 const [running,setRunning]=useState(false),[wire,setWire]=useState(false)
 const [resolution,setResolution]=useState(96),[height,setHeight]=useState(22),[sea,setSea]=useState(-4),[speed,setSpeed]=useState(12)
 const [mode,setMode]=useState<Mode>('erosion'),[rain,setRain]=useState(.015),[reset,setReset]=useState(0)
 const [view,setView]=useState<View>('landscape'),[tool,setTool]=useState<Tool>('orbit'),[before,setBefore]=useState(false)
 const [hud,setHud]=useState({steps:0,x:0,z:0,storm:0,trees:0,...EMPTY})
 const [message,setMessage]=useState('Try a storm. Then inspect where the ground moved.')
 const mount=useRef<HTMLDivElement>(null),map=useRef<HTMLCanvasElement>(null),commands=useRef<Command|null>(null)
 const live=useRef({running,wire,speed,rain,view,tool,before,mood,groves,groveSettings,appearance})
 useEffect(()=>{live.current={running,wire,speed,rain,view,tool,before,mood,groves,groveSettings,appearance}},[running,wire,speed,rain,view,tool,before,mood,groves,groveSettings,appearance])
 const active=layers.filter(l=>l.enabled&&(solo===null||solo===l.id))
 const spacing=SPAN/resolution
 const shortest=active.length?64/Math.max(...active.map(l=>l.frequency*2**(l.octaves-1))):Infinity
 const restart=()=>{setRunning(false);setBefore(false);setHud({steps:0,x:0,z:0,storm:0,trees:0,...EMPTY});setReset(v=>v+1);setMessage('Fresh terrain. Same noise stack, a new experiment.')}
 const compare=()=>{setRunning(false);setBefore(v=>!v)}
 useEffect(()=>{
  const el=mount.current;if(!el)return
  const scene=new THREE.Scene();scene.background=new THREE.Color(MOODS.lakeside.sky);scene.fog=new THREE.Fog(PAPER,270,720)
  const camera=new THREE.PerspectiveCamera(43,1,.5,600);camera.position.set(154,171,198)
  const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));el.appendChild(renderer.domElement)
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.shadowMap.autoUpdate=false
  renderer.domElement.tabIndex=0;renderer.domElement.setAttribute('aria-label','Terrain viewport. Drag to orbit. Use F for wireframe and Space to pause.');renderer.domElement.setAttribute('role','img')
  const controls=new OrbitControls(camera,renderer.domElement);controls.minDistance=30;controls.maxDistance=350;controls.maxPolarAngle=Math.PI*.47;controls.enablePan=false
  const geometry=new THREE.PlaneGeometry(SPAN,SPAN,resolution,resolution);geometry.rotateX(-Math.PI/2)
  const positions=geometry.getAttribute('position'),colors=new Float32Array(positions.count*3);geometry.setAttribute('color',new THREE.BufferAttribute(colors,3))
  const material=createLandscapeMaterial()
  material.uniforms.floorHeight.value=sea;material.uniforms.amplitude.value=height*1.15;material.uniforms.markScale.value=.15
  const diagnosticMaterial=new THREE.MeshBasicMaterial({vertexColors:true,fog:false})
  const flowGeometry=geometry.clone()
  const flowDepth=new Float32Array(positions.count)
  flowGeometry.setAttribute('waterDepth',new THREE.BufferAttribute(flowDepth,1))
  const flowMaterial=new THREE.ShaderMaterial({
   transparent:true,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1,
   uniforms:{waterColor:{value:new THREE.Color('#327b9d')},comic:{value:false},fieldOrigin:{value:new THREE.Vector2()}},
   vertexShader:`attribute float waterDepth; varying float depth; varying vec2 mapPosition; void main(){ mapPosition=position.xz; depth=waterDepth; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
   fragmentShader:`
    uniform vec3 waterColor;
    uniform bool comic;
    uniform vec2 fieldOrigin;
    varying vec2 mapPosition;
    varying float depth;
    void main(){
     if(depth<0.015) discard;
     float amount=smoothstep(0.015,0.35,depth);
     vec3 paint=waterColor;
     if(comic){
      vec2 p=mapPosition+fieldOrigin;
      float phase=p.y*.35+sin(p.x*.3)*.06;
      float line=1.0-smoothstep(.025,.025+max(fwidth(phase),.01),abs(fract(phase+.5)-.5));
      float dash=smoothstep(.3,.5,sin(p.x*.45+floor(phase)*2.0));
      paint=mix(paint,vec3(.85,.91,.92),line*dash*.6);
     }
     gl_FragColor=vec4(paint,comic ? .5+amount*.4 : .28+amount*.55);
     #include <colorspace_fragment>
    }
   `,
  })
  const flow=new THREE.Mesh(flowGeometry,flowMaterial);scene.add(flow)
  const grove=createGrove();scene.add(grove.group)
  const terrain=new THREE.Mesh<THREE.PlaneGeometry,THREE.Material>(geometry,material);scene.add(terrain)
  const waterGeometry=new THREE.PlaneGeometry(SPAN,SPAN);waterGeometry.rotateX(-Math.PI/2)
  const waterMaterial=createAtlasMaterial(false);waterMaterial.uniforms.ocean.value=true;waterMaterial.uniforms.markScale.value=.15
  const water=new THREE.Mesh(waterGeometry,waterMaterial);water.position.y=sea;scene.add(water)
  scene.add(new THREE.HemisphereLight('#ffffff','#909887',1.25))
  const sun=new THREE.DirectionalLight('#fff4dc',1.5);sun.position.set(-110,110,90);scene.add(sun)
  sun.castShadow=true;sun.shadow.mapSize.set(2048,2048)
  Object.assign(sun.shadow.camera,{left:-150,right:150,top:150,bottom:-150,near:1,far:420})
  sun.shadow.normalBias=.18;sun.shadow.bias=-.0001;sun.shadow.camera.updateProjectionMatrix()
  material.uniforms.sunDirection.value.copy(sun.position).normalize()
  const groundPixels=new Uint8Array(positions.count*4)
  const groundTexture=new THREE.DataTexture(groundPixels,resolution+1,resolution+1,THREE.RGBAFormat)
  groundTexture.minFilter=groundTexture.magFilter=THREE.LinearFilter
  waterMaterial.uniforms.groundMap.value=groundTexture;waterMaterial.uniforms.hasGroundMap.value=true
  waterMaterial.uniforms.groundExtent.value=height;waterMaterial.uniforms.floorHeight.value=sea
  terrain.receiveShadow=true
  const boundaryPlane=new THREE.PlaneGeometry(SPAN,SPAN)
  const outlineGeometry=new THREE.EdgesGeometry(boundaryPlane);boundaryPlane.dispose();outlineGeometry.rotateX(-Math.PI/2)
  const outlineMaterial=new THREE.LineBasicMaterial({color:'#234e3b',transparent:true,opacity:.24})
  const outline=new THREE.LineSegments(outlineGeometry,outlineMaterial);outline.position.y=-height-2;scene.add(outline)
  const ringGeometry=new THREE.RingGeometry(13,14,64);ringGeometry.rotateX(-Math.PI/2)
  const ringMaterial=new THREE.MeshBasicMaterial({color:'#234e3b',side:THREE.DoubleSide,transparent:true,opacity:.85,depthTest:false})
  const ring=new THREE.Mesh(ringGeometry,ringMaterial);ring.visible=false;ring.renderOrder=10;scene.add(ring)
  let palette=MOODS.lakeside.land.map(c=>new THREE.Color(c))
  const gentle=new THREE.Color('#e8ebe0'),steep=new THREE.Color('#315442')
  const wetColor=new THREE.Color('#32697f'),dryColor=new THREE.Color('#e5e9e3'),neutral=new THREE.Color('#e3e4d9'),cutColor=new THREE.Color('#ac703c'),fillColor=new THREE.Color('#317c72'),color=new THREE.Color()
  const ctx=map.current?.getContext('2d');if(map.current){map.current.width=resolution+1;map.current.height=resolution+1}
  const ground=new Float32Array(positions.count),baseline=new Float32Array(positions.count),waterField=new Float32Array(positions.count),sediment=new Float32Array(positions.count)
  let iteration=0,storm=0,batchEnd=Infinity,x=0,z=0,centerX=Infinity,centerZ=Infinity,last=0,lastTick=0,lastHud=0,frame=0,dirty=true,geometryDirty=true,shownBefore=false,shownView:View='landscape',ringUntil=0,shownMood:Mood='lakeside'
  let treeCount=0,shownGroveSettings=live.current.groveSettings,shownGroves=live.current.groves,shownSurface=''
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
   const field=showBefore?baseline:ground
   palette=MOODS[live.current.mood].land.map(c=>new THREE.Color(c))
   for(let i=0;i<ground.length;i++){
    const y=showBefore?baseline[i]:ground[i],delta=showBefore?0:ground[i]-baseline[i],wet=showBefore?0:waterField[i]
    positions.setY(i,y)
    const encoded=Math.max(0,Math.min(255,Math.round((height?y/height:0)*127.5+127.5)))
    groundPixels.set([encoded,encoded,encoded,255],i*4)
    flowGeometry.getAttribute('position').setY(i,y+wet);flowDepth[i]=wet
    if(currentView==='slope')color.copy(gentle).lerp(steep,Math.min(Math.atan(slopeAt(field,resolution+1,spacing,i))/(Math.PI/3),1))
    else if(mode==='erosion'&&currentView==='change')color.copy(neutral).lerp(delta<0?cutColor:fillColor,Math.min(Math.abs(delta)/.5,1))
    else if(mode==='erosion'&&currentView==='water')color.copy(dryColor).lerp(wetColor,Math.min(wet/1,1))
    else {
     const h=y-sea,stops=[-3,1.5,7,14,22,29];let band=0
     while(band<4&&h>stops[band+1])band++
     color.copy(palette[band]).lerp(palette[band+1],THREE.MathUtils.smoothstep(h,stops[band],stops[band+1]))
     color.lerp(palette[4],THREE.MathUtils.smoothstep(slopeAt(field,resolution+1,spacing,i),.5,1.4)*.68)
     if(mode==='erosion')color.lerp(wetColor,Math.min(wet*.16,.25))
    }
    color.toArray(colors,i*3)
    if(image){const v=Math.max(0,Math.min(255,Math.round((height?y/height:0)*127+128)));image.data.set([v,v,v,255],i*4)}
   }
   flowGeometry.getAttribute('position').needsUpdate=true;flowGeometry.getAttribute('waterDepth').needsUpdate=true;flowGeometry.computeBoundingSphere()
   positions.needsUpdate=true;geometry.getAttribute('color').needsUpdate=true
   if(geometryDirty||shownBefore!==showBefore){geometry.computeVertexNormals();geometry.computeBoundingSphere()}
   if(image)ctx?.putImageData(image,0,0)
   treeCount=grove.update(field,waterField,resolution+1,SPAN,sea,centerX,centerZ,showBefore,live.current.groveSettings)
   shownGroveSettings=live.current.groveSettings
   groundTexture.needsUpdate=true;renderer.shadowMap.needsUpdate=true
   geometryDirty=false;dirty=false;shownBefore=showBefore;shownView=currentView
  }
  function publish(){setHud({steps:iteration,x,z,storm,trees:treeCount,...measureField(ground,baseline,waterField)})}
  function tick(){
   erode(ground,waterField,sediment,resolution+1,spacing,live.current.rain+(storm>0?.06:0))
   iteration++;if(storm>0){storm--;if(storm===0)setMessage('Storm passed. Switch to Ground change to find its footprint.')}
   dirty=true;geometryDirty=true
  }
  commands.current={
   storm(){if(live.current.before)return;storm=50;batchEnd=Infinity;setRunning(true);setMessage('Storm incoming: +0.060 rain units per step for 50 simulation steps.');publish()},
   step(){if(live.current.before)return;setRunning(false);batchEnd=Infinity;tick();publish()},
   runBatch(){if(live.current.before)return;batchEnd=iteration+100;setRunning(true);setMessage('Running 100 steps, then pausing for inspection.')},
   home(){camera.position.set(154,171,198);controls.target.set(0,0,0);controls.update()},
   horizon(){camera.position.set(112,57,144);controls.target.set(0,0,-14);controls.update()},

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
   if(shownMood!==live.current.mood){shownMood=live.current.mood;dirty=true}
   const illustrated=live.current.view==='landscape'&&!live.current.wire
   if(shownGroveSettings!==live.current.groveSettings)dirty=true
   if(shownGroves!==live.current.groves||shownSurface!==live.current.appearance.surface){renderer.shadowMap.needsUpdate=true;shownGroves=live.current.groves;shownSurface=live.current.appearance.surface}
   if(dirty||shownBefore!==live.current.before||shownView!==live.current.view)updateSurface()
   ;(scene.background as THREE.Color).set(PAPER)
   ;(scene.fog as THREE.Fog).color.set(PAPER)
   applyAppearance(material,live.current.appearance)
   material.uniforms.fieldOrigin.value.set(centerX,centerZ)
   waterMaterial.uniforms.fieldOrigin.value.set(centerX,centerZ)
   flowMaterial.uniforms.fieldOrigin.value.set(centerX,centerZ)
   terrain.material=illustrated?material:diagnosticMaterial
   diagnosticMaterial.wireframe=live.current.wire
   grove.group.visible=illustrated&&live.current.groves;grove.recolor(live.current.mood,live.current.appearance.surface==='illustrated',live.current.appearance.surface==='studio')
   terrain.castShadow=live.current.appearance.surface==='studio'
   grove.group.position.set(centerX-x,0,centerZ-z)
   applyAppearance(waterMaterial,live.current.appearance)
   const comic=live.current.appearance.surface==='illustrated'
   flowMaterial.uniforms.comic.value=comic;flowMaterial.uniforms.waterColor.value.set(live.current.appearance.surface==='studio'?STUDIO.water:comic?'#79afd0':'#327b9d')
   flow.position.set(centerX-x,0,centerZ-z);flow.visible=illustrated&&mode==='erosion'&&!live.current.before
   terrain.position.set(centerX-x,0,centerZ-z);water.position.set(centerX-x,sea,centerZ-z);outline.position.set(centerX-x,-height-2,centerZ-z)
   material.wireframe=live.current.wire;water.visible=illustrated&&mode==='explore';ring.visible=now<ringUntil&&!live.current.before
   controls.update();if(!document.hidden)renderer.render(scene,camera)
   if(now-lastHud>200){publish();lastHud=now}frame=requestAnimationFrame(animate)
  };frame=requestAnimationFrame(animate)
  return()=>{
   commands.current=null;cancelAnimationFrame(frame);ro.disconnect();controls.dispose();geometry.dispose();material.dispose();flowGeometry.dispose();flowMaterial.dispose();diagnosticMaterial.dispose();grove.dispose();groundTexture.dispose();sun.shadow.dispose();waterGeometry.dispose();waterMaterial.dispose();outlineGeometry.dispose();outlineMaterial.dispose();ringGeometry.dispose();ringMaterial.dispose();renderer.dispose();el.removeChild(renderer.domElement)
   window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear)
  }
 },[layers,solo,resolution,height,sea,reset,spacing,mode])
 const capture=()=>{
  const source=mount.current?.querySelector('canvas');if(!source)return
  const frameCanvas=document.createElement('canvas'),width=source.width,pixelHeight=source.height
  frameCanvas.width=width;frameCanvas.height=pixelHeight+96
  const context=frameCanvas.getContext('2d');if(!context)return
  context.fillStyle=PAPER;context.fillRect(0,0,width,pixelHeight+96);context.drawImage(source,0,0)
  context.fillStyle='#234e3b';context.font='18px sans-serif'
  context.fillText(`SIMULATION MAP / ${mode} / ${view} / ${appearance.surface} / ${before?'original, step 0':`step ${hud.steps}`}`,20,pixelHeight+36)
  context.fillStyle='#646c62';context.font='14px sans-serif'
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
  <header className="sim-header"><div><span className="sim-eyebrow">FIELD STUDY 03 · LANDSCAPE & WATER</span><h1>{erosion?'A landscape in motion.':'Beyond the shoreline.'}</h1><p>{erosion?'A living landscape to shape, observe, and understand.':'Explore a continuous landscape made from your noise stack.'}</p></div><div className="sim-status"><span className={running?'sim-state running':'sim-state'}>{before?'Original preview':running?'Running':'Paused'}</span><strong>{hud.steps.toLocaleString()}</strong><span>simulation steps</span></div></header>
  <div className="sim-workspace">
   <section className="sim-stage" aria-label="Terrain playground">
    <div className="sim-stage-tools"><div className="sim-segment" aria-label="Terrain tools">{(['orbit','rain'] as Tool[]).filter(t=>erosion||t==='orbit').map(t=><button key={t} aria-pressed={tool===t} disabled={before&&t==='rain'} onClick={()=>setTool(t)}>{t==='orbit'?'Orbit':'Paint rain'}</button>)}</div><div className="sim-camera-actions"><button onClick={()=>commands.current?.horizon()}>Horizon view</button><button onClick={()=>commands.current?.home()}>Reset camera</button><button onClick={capture}>Save frame</button></div></div>
    <div className="sim-art-direction"><span>192 × 192 u / SAMPLED TERRAIN</span><label><input type="checkbox" checked={groves} onChange={e=>setGroves(e.target.checked)}/>Groves</label></div>
    <div className="sim-canvas" ref={mount}/>
    {view==='landscape'&&<div className="world-key" aria-label="Terrain material legend"><span><i className="key-water"/>{erosion?'Surface water':'Sea-level water'}</span><span><i className="key-sand"/>Earth / shore</span><span><i className="key-green"/>Vegetation</span><span><i className="key-rock"/>Rock</span><span><i className="key-snow"/>Highland snow</span><small>{erosion?'Blue water appears only where simulated depth exceeds 0.015 u.':'The blue plane marks sea level; it is not hydraulic flow.'} Land cover is illustrative, not a biome simulation.</small></div>}
    <div className="sim-reading" aria-label="Surface views">{([{id:'landscape',label:'Landscape'},{id:'slope',label:'Slope'},...(erosion?[{id:'water',label:'Water'},{id:'change',label:'Ground change'}]:[])]).map(v=><button key={v.id} aria-pressed={view===v.id} onClick={()=>setView(v.id as View)}>{v.label}</button>)}</div>
    <div className="sim-view-caption">{before?'ORIGINAL · step 0':erosion?`LIVE TERRAIN · step ${hud.steps}`:'WORLD-SPACE TERRAIN'}<span><i className={`sim-legend-scale ${view}`} aria-hidden="true"/>{view==='slope'?'Pale → forest: 0–60° slope':view==='water'&&erosion?'Pale → blue: 0–1+ units of water':view==='change'&&erosion?'Ochre: erosion · teal: deposition · full color at ±0.5 units':'Earth / vegetation / rock by height + slope · overlays retain material colors'}</span></div>
    <div className="sim-transport"><button className="sim-primary" disabled={before} onClick={()=>setRunning(v=>!v)}>{running?'Pause':'Start'}</button>{erosion&&<><button disabled={before} onClick={()=>commands.current?.step()}>+1 step</button><button disabled={before} onClick={()=>commands.current?.runBatch()}>Run 100 steps</button><button className={before?'selected':''} aria-pressed={before} onClick={compare}>{before?'Back to current':'Compare original'} <kbd>B</kbd></button></>}<button onClick={restart}>Reset {erosion?'terrain':'position'}</button></div>
   </section>
   <aside className="sim-controls" aria-label="Simulation controls"><div className="inspector-heading"><span className="atlas-label">FIELD INSPECTOR</span><span className="inspector-dot"/>Live parameters</div>
    <label className="sim-field">Perspective<select value={mode} onChange={e=>{setMode(e.target.value as Mode);setView('landscape');setTool('orbit');restart()}}><option value="erosion">Hydraulic erosion</option><option value="explore">Explore infinite field</option></select></label>
    {erosion&&<section className="sim-experiment"><span className="sim-eyebrow">TRY THIS</span><h2>Send a storm over the hills.</h2><p>Guess where water will gather. Add rain, then switch to Ground change to check your prediction.</p><button className="sim-storm" disabled={before} onClick={()=>commands.current?.storm()}>{hud.storm>0?`Storm · ${hud.storm} steps left`:'Make it rain'}<span>50-step downpour</span></button><label className="sim-field">Weather<output>{rain===0?'Dry':`${rain.toFixed(3)} units / step`}</output><input aria-label="Rainfall" type="range" min={0} max={.08} step={.005} value={rain} onChange={e=>setRain(+e.target.value)}/></label><p className="sim-small">Set rain to zero to watch existing water drain and evaporate. Weather changes keep your progress.</p></section>}
    {erosion&&<section className="sim-lenses"><h2>Read the changes</h2><div className="sim-metrics"><div><span>Deepest cut</span><strong>{hud.cut.toFixed(3)} <small>u</small></strong></div><div><span>Largest deposit</span><strong>{hud.fill.toFixed(3)} <small>u</small></strong></div><div><span>Ground changed &gt;0.01 u</span><strong>{hud.changed.toFixed(1)}<small>%</small></strong></div><div><span>Mean surface water</span><strong>{hud.water.toFixed(3)} <small>u</small></strong></div></div><p className="sim-small">Measurements describe the current field, even when previewing the original.</p></section>}
    <section className="grove-card"><div className="grove-title"><div><span className="atlas-label">VEGETATION STUDY</span><h2>A place to grow.</h2></div><svg viewBox="0 0 60 60" aria-hidden="true"><ellipse cx="31" cy="51" rx="24" ry="6" fill="#e3e7d5"/><path d="M17 50V24M41 50V31" stroke="#736953" strokeWidth="3"/><path d="M17 6L6 39H28Z" fill="#527452"/><ellipse cx="41" cy="30" rx="10" ry="15" fill="#9dac79"/></svg></div><div className="grove-count"><strong>{hud.trees}</strong><span>trees placed <small>{groves&&view==='landscape'&&!wire?'visible in landscape':'hidden in this view'}</small></span></div>{([{key:'density',label:'Tree density',min:0,max:1,step:.01},{key:'clustering',label:'Clustering',min:0,max:.5,step:.01},{key:'size',label:'Tree size',min:.5,max:1.4,step:.05}] as const).map(c=><label key={c.key} className="grove-range"><span>{c.label}<output>{c.key==='size'?`${groveSettings[c.key].toFixed(2)}×`:`${Math.round(groveSettings[c.key]*100)}%`}</output></span><input aria-label={c.label} type="range" min={c.min} max={c.max} step={c.step} value={groveSettings[c.key]} onChange={e=>setGroveSettings(v=>({...v,[c.key]:+e.target.value}))}/></label>)}<p>Groves favor gentle, dry ground. Controls redistribute existing candidates without resetting erosion. Placement only; no growth or reproduction.</p></section>
    <figure className="sim-map"><canvas ref={map} aria-label="Height map of the visible terrain window"/><figcaption>Height field / north up<span>Dark = low · light = high<br/>Same samples as the mesh</span></figcaption></figure>
    <label className="sim-check"><input type="checkbox" checked={wire} onChange={e=>setWire(e.target.checked)}/>Wireframe <kbd>F</kbd></label>
    <details className="sim-calibration"><summary>Terrain & calibration</summary><label className="sim-field">Resolution<select value={resolution} onChange={e=>{setResolution(+e.target.value);restart()}}><option value={64}>64 × 64 · draft</option><option value={96}>96 × 96 · balanced</option><option value={128}>128 × 128 · fine</option></select></label>{([{label:'Relief height',value:height,min:0,max:45,set:setHeight},{label:'Sea level',value:sea,min:-20,max:15,set:setSea},{label:'Travel speed',value:speed,min:2,max:30,set:setSpeed}]).filter(c=>!erosion||c.label==='Relief height').map(c=><label className="sim-field" key={c.label}>{c.label}<output>{c.value} {c.label==='Travel speed'?'u/s':'u'}</output><input aria-label={c.label} type="range" min={c.min} max={c.max} step={1} value={c.value} onChange={e=>{c.set(+e.target.value);if(c.label!=='Travel speed')restart()}}/></label>)}<p>{active.length} active layers · {2*resolution*resolution} triangles · {spacing.toFixed(2)} units/sample.</p><p>{shortest/spacing<4?'Fine noise is undersampled: reduce frequency/octaves or use a finer grid.':'Nominal detail has at least four samples per feature scale.'} Shaping can add smaller details.</p><p>Calibration changes reset the experiment. Fixed 192-unit erosion window; closed edges; approximate educational model. Steps are not real-world days. Leaving this workspace resets its progress.</p></details>
   </aside>
  </div>
  <footer className="sim-footer"><p role="status">{erosion?message:`X ${hud.x.toFixed(1)} · Z ${hud.z.toFixed(1)} · Start, then use WASD / arrows to explore.`}</p><span>Drag: orbit · Scroll: zoom · Space: pause · F: wireframe{erosion?' · B: compare':''}</span></footer>
 </main>
}
