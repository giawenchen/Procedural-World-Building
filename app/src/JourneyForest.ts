/** A quiet, side-scrolling illustrated woodland behind the paper map. */
export class JourneyForest {
 private canvas=document.createElement('canvas')
 private context=this.canvas.getContext('2d')!
 private layers:HTMLCanvasElement[]=[]
 private observer:ResizeObserver
 private width=0
 private height=0
 private time=0
 private raf=0
 private reduced=matchMedia('(prefers-reduced-motion: reduce)').matches
 constructor(host:HTMLDivElement,autoplay=true){
  host.appendChild(this.canvas)
  this.layers=[0,1,2].map(layer=>this.woodland(layer))
  this.observer=new ResizeObserver(()=>{
   this.width=host.clientWidth;this.height=host.clientHeight
   if(!this.width||!this.height)return
   const ratio=Math.min(devicePixelRatio,1.5)
   this.canvas.width=Math.round(this.width*ratio);this.canvas.height=Math.round(this.height*ratio)
   this.context.setTransform(ratio,0,0,ratio,0,0);this.draw(this.time)
  });this.observer.observe(host)
  if(autoplay&&!this.reduced){const start=performance.now();let last=0
   const tick=(now:number)=>{if(now-last>40&&!host.hidden&&!document.hidden){this.draw((now-start)/1000);last=now}this.raf=requestAnimationFrame(tick)}
   this.raf=requestAnimationFrame(tick)
  }
 }
 private woodland(layer:number){
  const canvas=document.createElement('canvas');canvas.width=1800;canvas.height=850
  const c=canvas.getContext('2d')!,colors=[['#a8b7a0','#94ab9a','#b7bb91'],['#6c9384','#7d9b82','#ada66d'],['#426d62','#587e68','#898e5e']][layer]
  const tree=(x:number,base:number,height:number,index:number)=>{
   c.save();c.translate(x,base);const top=-height,spread=height*(index%3===0?.13:.18)
   c.fillStyle=layer===0?'#80988a':layer===1?'#617e70':'#4e695a'
   c.beginPath();c.moveTo(-height*.013,0);c.lineTo(-height*.007,top);c.lineTo(height*.009,top);c.lineTo(height*.017,0);c.fill()
   c.fillStyle=colors[index%3]
   if(index%3===0){
    // Separate boughs keep the pine silhouette legible at a distance.
    for(let tier=0;tier<9;tier++){const y=top+height*(.06+tier*.078),w=spread*(.2+tier*.11)
     c.beginPath();c.moveTo(0,y-height*.12);c.lineTo(w,y+height*.075);c.lineTo(w*.37,y+height*.054);c.lineTo(0,y+height*.073);c.lineTo(-w,y+height*.086);c.closePath();c.fill()}
   }else{
    for(let crown=0;crown<7;crown++){const a=crown*2.4,xx=Math.sin(a)*spread*.53,yy=top+height*(.2+.14*Math.cos(a))
     c.beginPath();c.ellipse(xx,yy,spread*(.6+(crown%2)*.12),height*.14,a*.04,0,Math.PI*2);c.fill()}
    c.strokeStyle=layer===2?'#526957':'#7c9380';c.lineWidth=height*.012;c.lineCap='round'
    for(const side of [-1,1]){c.beginPath();c.moveTo(0,-height*.35);c.quadraticCurveTo(side*spread*.15,-height*.49,side*spread*.6,-height*.65);c.stroke()}
   }
   // A small warm edge, with no noisy texture or oversized geometric crowns.
   c.globalAlpha=.15;c.fillStyle='#f3d795';c.beginPath();c.ellipse(-spread*.32,top+height*.19,spread*.2,height*.1,-.25,0,Math.PI*2);c.fill();c.restore()
  }
  for(let i=0;i<22;i++){const x=i*86+Math.sin(i*7.7+layer)*24,base=690+layer*65+Math.sin(i*1.8)*17,height=240+layer*105+(Math.sin(i*3.7+layer)+1)*95
   for(const offset of [-1800,0,1800])tree(x+offset,base,height,i+layer)}
  c.fillStyle=colors[0];c.beginPath();c.moveTo(0,850);c.lineTo(0,735+layer*36)
  for(let x=0;x<=1800;x+=30)c.lineTo(x,735+layer*36+Math.sin(x/180)*12)
  c.lineTo(1800,850);c.fill();return canvas
 }
 draw(time:number){
  this.time=time;if(!this.width||!this.height)return
  const c=this.context,w=this.width,h=this.height,t=this.reduced?0:time
  const sky=c.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#d4d7b9');sky.addColorStop(.5,'#b7c9bb');sky.addColorStop(1,'#75958a');c.fillStyle=sky;c.fillRect(0,0,w,h)
  const glow=c.createRadialGradient(w*.24,h*.13,0,w*.24,h*.13,w*.65);glow.addColorStop(0,'#fff0c4c0');glow.addColorStop(.42,'#fae7b948');glow.addColorStop(1,'#fae7b900');c.fillStyle=glow;c.fillRect(0,0,w,h)
  this.layers.forEach((layer,i)=>{
   const tileWidth=h/850*1800,offset=-(t*[7,13,21][i])%tileWidth
   c.save();c.filter=`blur(${[4,2.4,1.2][i]}px)`;c.globalAlpha=[.5,.68,.8][i]
   for(let x=offset-tileWidth;x<w+tileWidth;x+=tileWidth)c.drawImage(layer,x,0,tileWidth,h)
   c.restore()
   if(i<2){c.fillStyle=i?'#d5dac51b':'#e7e3c531';c.fillRect(0,0,w,h)}
  })
  c.save();c.globalCompositeOperation='screen';c.fillStyle='#f6dda21a';c.beginPath();c.moveTo(w*.16,-20);c.lineTo(w*.23,-20);c.lineTo(w*.66,h);c.lineTo(w*.4,h);c.fill();c.restore()
  const mist=c.createLinearGradient(0,h*.3,0,h);mist.addColorStop(0,'#e6dfc500');mist.addColorStop(1,'#ced9c65e');c.fillStyle=mist;c.fillRect(0,0,w,h)
 }
 dispose(){cancelAnimationFrame(this.raf);this.observer.disconnect();this.canvas.remove();this.layers=[]}
}
