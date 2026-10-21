/** Quiet, original synthesized ambience. One shared gain can always silence it. */
export class JourneySoundscape {
 private context:AudioContext|null=null
 private master:GainNode|null=null
 private filter:BiquadFilterNode|null=null
 private birdTime=-20
 private level=.18
 private enabled=false
 start(){
  if(!this.context){
   const c=this.context=new AudioContext(),g=this.master=c.createGain();g.gain.value=0;g.connect(c.destination)
   const b=c.createBuffer(1,c.sampleRate*4,c.sampleRate),a=b.getChannelData(0);let previous=0
   for(let i=0;i<a.length;i++){previous=(previous+(Math.random()*2-1)*.022)/1.022;a[i]=previous*3.2}
   const source=c.createBufferSource();source.buffer=b;source.loop=true
   const filter=this.filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=750
   source.connect(filter);filter.connect(g);source.start()
  }
  this.enabled=true;void this.context.resume()
 }
 setLevel(v:number){this.level=Math.max(0,Math.min(.5,v))}
 update(kind:string,time:number,speaking:boolean){
  const c=this.context,g=this.master;if(!c||!g)return
  g.gain.setTargetAtTime(this.enabled?this.level*(speaking?.035:.07):0,c.currentTime,.3)
  this.filter?.frequency.setTargetAtTime(kind==='rain'?2200:kind==='water'?1300:kind==='wind'?440:680,c.currentTime,1)
  if(kind==='forest'&&time-this.birdTime>9&&this.enabled&&this.level>0){
   this.birdTime=time
   for(let i=0;i<2;i++){const o=c.createOscillator(),v=c.createGain(),at=c.currentTime+i*.18;o.type='sine';o.frequency.setValueAtTime(1550+i*280,at);o.frequency.exponentialRampToValueAtTime(2600+i*200,at+.07);o.frequency.exponentialRampToValueAtTime(1800,at+.16);v.gain.setValueAtTime(0,at);v.gain.linearRampToValueAtTime(this.level*(speaking?.008:.015),at+.035);v.gain.exponentialRampToValueAtTime(.00001,at+.2);o.connect(v);v.connect(c.destination);o.start(at);o.stop(at+.21);o.onended=()=>{o.disconnect();v.disconnect()}}
  }
 }
 pause(){this.enabled=false;if(this.context&&this.master)this.master.gain.setTargetAtTime(0,this.context.currentTime,.04);this.birdTime=-20}
 dispose(){this.pause();void this.context?.close();this.context=null}
}
