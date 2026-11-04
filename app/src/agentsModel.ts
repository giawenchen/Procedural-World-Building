export type BirdState = 'flock' | 'forage' | 'inspect' | 'rest' | 'evade'
export type Plant = { id: number; x: number; z: number; kind: 'tree' | 'shrub'; health: number; fruit: number }
export type Bird = { id: number; x: number; z: number; vx: number; vz: number; energy: number; state: BirdState; target: number | null; carriedSeed: number; seedTimer: number; pearls: number; reason: string }
export type Visitor = { id: number; x: number; z: number; timer: number; phase: 'arrive' | 'sip' | 'leave' }
export type Cup = { id: number; x: number; z: number }
export type Spill = { x: number; z: number; pearls: number; residue: number }
export type AgentsWorld = {
  time: number; birds: Bird[]; plants: Plant[]; visitors: Visitor[]; cups: Cup[]; spills: Spill[]; seeds: { x: number; z: number; age: number }[]
  pearls: number; landLoad: number; riverLoad: number; dissolvedOxygen: number; surfaceWetness: number
  visitorRate: number; vision: number; rain: number; flocking: number; nextPlantId: number; nextCupId: number
  arrivalClock: number; visitorsArrived: number; berriesEaten: number; pearlsPecked: number; cleanupCount: number; lastEvent: string
}
const clamp=(n:number,a:number,b:number)=>Math.max(a,Math.min(b,n))
const distance=(x:number,z:number,a:number,b:number)=>Math.hypot(x-a,z-b)
const unit=(x:number,z:number)=>{const d=Math.hypot(x,z)||1;return{x:x/d,z:z/d}}

export function createAgentsWorld():AgentsWorld {
  const plants:Plant[]=[]
  let id=0
  for(const [x,z] of [[-15,-9],[-11,-11],[-6,-12],[0,-11],[7,-10],[13,-8],[17,-3],[-16,0],[-12,4],[-10,10],[-4,11],[4,11],[11,10],[16,6],[-17,8]] as const) plants.push({id:id++,x,z,kind:'tree',health:.9,fruit:0})
  for(const [x,z] of [[-10,-5],[-8,-2],[-13,5],[-7,7],[-3,-9],[2,-7],[5,-3],[11,-5],[13,2],[5,7],[0,5],[-3,1]] as const) plants.push({id:id++,x,z,kind:'shrub',health:.92,fruit:2})
  const birds:Bird[]=Array.from({length:12},(_,i)=>{
    const centers=[[-9,-3],[3,-6],[12,4],[-5,7]],center=centers[Math.floor(i/3)],a=(i%3)*2.4,r=1.2+(i%2)*.7
    return{id:i,x:center[0]+Math.cos(a)*r,z:center[1]+Math.sin(a)*r,vx:Math.sin(a)*.35,vz:Math.cos(a)*.3,energy:.53+(i%5)*.09,state:'flock',target:null,carriedSeed:0,seedTimer:0,pearls:0,reason:'Keeping within sight of the flock.'}
  })
  return {time:0,birds,plants,visitors:[{id:0,x:-3,z:-1,timer:0,phase:'sip'}],cups:[],spills:[],seeds:[],pearls:0,landLoad:0,riverLoad:0,dissolvedOxygen:.92,surfaceWetness:.22,visitorRate:0,vision:8,rain:0,flocking:.72,nextPlantId:id,nextCupId:0,arrivalClock:18,visitorsArrived:1,berriesEaten:0,pearlsPecked:0,cleanupCount:0,lastEvent:'One visitor has parked near the meadow.'}
}

export function spillTea(w:AgentsWorld,x=-3.3,z=-1.2){
  w.cups.push({id:w.nextCupId++,x:x+1.2,z:z-.3});w.pearls+=7;w.spills.push({x,z,pearls:7,residue:1.2});w.landLoad+=1.2;w.surfaceWetness=Math.min(1,w.surfaceWetness+.55)
  w.lastEvent='A cup tipped over. The spill is food-like bait to curious birds, and waste on the ground.'
}
export function addVisitor(w:AgentsWorld){
  if(w.visitorsArrived>=12){w.lastEvent='The twelve arriving visitors have all reached the island. Pause arrivals or reset to replay.';return}
  const id=w.visitorsArrived++,angle=(id*2.399)%6.28
  w.visitors.push({id,x:Math.cos(angle)*20,z:Math.sin(angle)*12,timer:0,phase:'arrive'})
  w.lastEvent=`Visitor ${id+1} has entered the island. Visitors follow a schedule; the birds do not know why.`
}
export function cleanShore(w:AgentsWorld){
  const before=w.cups.length;w.cups=[];w.landLoad*=.12;w.spills.forEach(s=>{s.residue*=.12;s.pearls=0});w.pearls=0;w.cleanupCount++
  w.lastEvent=`Cleanup removed ${before} cup${before===1?'':'s'} and most surface residue. The stream still has to recover.`
}
function forageTarget(w:AgentsWorld,b:Bird){
  let best:Plant|null=null,bd=w.vision
  for(const p of w.plants){if(p.kind!=='shrub'||p.fruit<=0)continue;const d=distance(b.x,b.z,p.x,p.z);if(d<bd){best=p;bd=d}}
  return best?{kind:'berry' as const,id:best.id,x:best.x,z:best.z,d:bd}:null
}

/** Fixed-timestep classroom model: perception is local, needs drive FSM transitions, and steering uses visible flockmates. */
export function stepAgents(w:AgentsWorld,dt:number){
  const n=clamp(dt,0,.08);if(n<=0)return
  w.time+=n;w.arrivalClock-=n
  if(w.visitorRate>0&&w.arrivalClock<=0&&w.visitorsArrived<12){addVisitor(w);w.arrivalClock=30/Math.max(.2,w.visitorRate)}
  for(const v of w.visitors){
    v.timer+=n
    if(v.phase==='arrive'&&v.timer>2){v.phase='sip';v.timer=0;v.x=clamp(v.x*.82,-17,17);v.z=clamp(v.z*.82,-12,12);spillTea(w,v.x,v.z)}
    else if(v.phase==='sip'&&v.timer>5){v.phase='leave';v.timer=0}
    else if(v.phase==='leave'){v.x+=Math.sign(v.x||1)*n*4;v.z+=Math.sign(v.z||1)*n*2}
  }
  w.visitors=w.visitors.filter(v=>!(v.phase==='leave'&&Math.abs(v.x)>24))
  // Rain transports some organic residue downhill. Sun evaporates water but leaves solids behind.
  const runoff=Math.min(w.landLoad,w.rain*n*.16)
  w.landLoad-=runoff;w.riverLoad+=runoff
  w.surfaceWetness=clamp(w.surfaceWetness+n*(w.rain*.16-(.015+w.surfaceWetness*.055)),0,1)
  const decomposition=Math.min(w.riverLoad,.004*n+w.riverLoad*.04*n)
  w.riverLoad-=decomposition
  w.dissolvedOxygen=clamp(w.dissolvedOxygen+n*(.012*(1-w.dissolvedOxygen)-decomposition*.12),.18,1)
  const quality=clamp(1-w.riverLoad/5,0,1)
  for(const p of w.plants){
    const nearWater=Math.abs(p.x-(7+Math.sin(p.z*.22)*2))<5
    p.health=clamp(p.health+n*(nearWater?(quality-.72)*.018:.002),.18,1)
    if(p.kind==='shrub'&&p.health>.48)p.fruit=Math.min(4,p.fruit+n*.025*p.health)
  }
  w.seeds=w.seeds.filter(seed=>{
    seed.age+=n
    if(seed.age<8)return true
    const crowded=w.plants.some(p=>distance(seed.x,seed.z,p.x,p.z)<2.3)
    if(!crowded&&quality>.34&&w.plants.length<48&&Math.hypot(seed.x,seed.z)<20){w.plants.push({id:w.nextPlantId++,x:seed.x,z:seed.z,kind:'shrub',health:.55,fruit:0});w.lastEvent='A carried seed found open ground. One small plant joined the population.'}
    return false
  })
  for(const b of w.birds){
    const nearby=w.birds.filter(o=>o.id!==b.id&&distance(b.x,b.z,o.x,o.z)<w.vision)
    const threat=w.visitors.find(v=>v.phase!=='leave'&&distance(b.x,b.z,v.x,v.z)<3.2)
    const food=forageTarget(w,b)
    let pearl: {x:number;z:number;d:number;site:Spill}|null=null
    for(const site of w.spills){if(site.pearls<=0)continue;const d=distance(b.x,b.z,site.x,site.z);if(d<w.vision&&(!pearl||d<pearl.d))pearl={x:site.x,z:site.z,d,site}}
    if(threat){b.state='evade';b.target=threat.id;b.reason='A large unfamiliar visitor is close, so I am giving it space.'}
    else if(b.energy<.24){b.state='rest';b.target=null;b.reason='My energy is low; I need a quiet perch.'}
    else if(food&&b.energy<.84){b.state='forage';b.target=food.id;b.reason=`I can see fruit ${food.d.toFixed(1)} m away; hunger makes it worth the flight.`}
    else if(pearl&&b.energy<.8){b.state='inspect';b.target=null;b.reason='A bright spill is inside my vision. I am inspecting it, not treating it as safe food.'}
    else if(nearby.length){b.state='flock';b.target=nearby[0].id;b.reason=`${nearby.length} flockmates are inside my ${w.vision.toFixed(0)} m perception radius.`}
    else {b.state='flock';b.target=null;b.reason='No urgent need or nearby flockmate; I am wandering locally.'}
    const seek=(tx:number,tz:number)=>unit(tx-b.x,tz-b.z)
    let ax=0,az=0
    if(b.state==='rest'){ax=-b.vx*.8;az=-b.vz*.8;b.energy=clamp(b.energy+n*.09,0,1)}
    else if(b.state==='forage'&&food){const d=seek(food.x,food.z);ax=d.x*1.35;az=d.z*1.35;if(food.d<.75){const p=w.plants.find(p=>p.id===food.id)!;p.fruit=Math.max(0,p.fruit-.24*n);b.energy=clamp(b.energy+n*.22,0,1);b.carriedSeed=1;b.seedTimer=0;w.berriesEaten+=n*.24}}
    else if(b.state==='inspect'&&pearl){const d=seek(pearl.x,pearl.z);ax=d.x*.95;az=d.z*.95;if(pearl.d<.7){b.reason='I reached the spill and am inspecting it. The model does not assume this is safe food.'}}
    else if(b.state==='evade'&&threat){const d=unit(b.x-threat.x,b.z-threat.z);ax=d.x*1.6;az=d.z*1.6}
    else if(nearby.length){let cx=0,cz=0,vx=0,vz=0,sx=0,sz=0
      for(const o of nearby){cx+=o.x;cz+=o.z;vx+=o.vx;vz+=o.vz;const d=distance(b.x,b.z,o.x,o.z)||.01;if(d<2.2){sx+=(b.x-o.x)/d;sz+=(b.z-o.z)/d}}
      const count=nearby.length,co=unit(cx/count-b.x,cz/count-b.z),al=unit(vx/count,vz/count),sep=unit(sx,sz)
      ax=(co.x*.48+al.x*.3+sep.x*.9)*w.flocking;az=(co.z*.48+al.z*.3+sep.z*.9)*w.flocking
    }else{ax=Math.sin(w.time*.61+b.id*9)*.25;az=Math.cos(w.time*.53+b.id*7)*.25}
    if(b.state!=='rest')b.energy=clamp(b.energy-n*.0095,0,1)
    const damp=Math.exp(-1.65*n);b.vx=(b.vx+ax*n)*damp;b.vz=(b.vz+az*n)*damp
    const speed=Math.hypot(b.vx,b.vz),max=b.state==='evade'?3.7:2.1;if(speed>max){b.vx*=max/speed;b.vz*=max/speed}
    b.x=clamp(b.x+b.vx*n,-20,20);b.z=clamp(b.z+b.vz*n,-14,14)
    if(b.carriedSeed){b.seedTimer+=n;if(b.seedTimer>4.2){w.seeds.push({x:b.x,z:b.z,age:0});b.carriedSeed=0;b.seedTimer=0}}
  }
  // Keep a small finite seed cohort at startup. Later dispersal is agent-driven.
}
export function selectedBird(w:AgentsWorld,id:number){return w.birds.find(b=>b.id===id)??w.birds[0]}
export function agentMetrics(w:AgentsWorld){return{flock:w.birds.length,resting:w.birds.filter(b=>b.state==='rest').length,foraging:w.birds.filter(b=>b.state==='forage').length,inspecting:w.birds.filter(b=>b.state==='inspect').length,trees:w.plants.filter(p=>p.kind==='tree').length,shrubs:w.plants.filter(p=>p.kind==='shrub').length,seedlings:w.plants.length-27,quality:Math.round((1-w.riverLoad/5)*100),landResidue:w.landLoad,riverLoad:w.riverLoad}}
