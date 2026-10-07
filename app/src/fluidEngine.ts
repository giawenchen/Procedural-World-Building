export type Fluid={n:number;u:Float32Array;v:Float32Array;dye:Float32Array;time:number;before:number;after:number}
export function makeFluid(n:number):Fluid {const f={n,u:new Float32Array(n*n),v:new Float32Array(n*n),dye:new Float32Array(n*n),time:0,before:0,after:0};for(let y=0;y<n;y++)for(let x=0;x<n;x++)f.dye[y*n+x]=Math.exp(-((x-n*.32)**2+(y-n*.5)**2)/(n*n*.012));return f}
const index=(x:number,y:number,n:number)=>((y%n+n)%n)*n+(x%n+n)%n
function sample(a:Float32Array,n:number,x:number,y:number){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;return (a[index(ix,iy,n)]*(1-fx)+a[index(ix+1,iy,n)]*fx)*(1-fy)+(a[index(ix,iy+1,n)]*(1-fx)+a[index(ix+1,iy+1,n)]*fx)*fy}
export function divergence(f:Fluid){const {n,u,v}=f,result=new Float32Array(n*n);for(let y=0;y<n;y++)for(let x=0;x<n;x++)result[y*n+x]=(u[index(x+1,y,n)]-u[index(x-1,y,n)]+v[index(x,y+1,n)]-v[index(x,y-1,n)])*.5;return result}
export function divergenceNorm(f:Fluid){return Math.sqrt(divergence(f).reduce((sum,v)=>sum+v*v,0)/(f.n*f.n))}
export function project(f:Fluid,iterations:number){const {n}=f,div=divergence(f);let p=new Float32Array(n*n),next=new Float32Array(n*n);for(let k=0;k<iterations;k++){for(let y=0;y<n;y++)for(let x=0;x<n;x++)next[y*n+x]=(p[index(x+1,y,n)]+p[index(x-1,y,n)]+p[index(x,y+1,n)]+p[index(x,y-1,n)]-div[y*n+x])*.25;[p,next]=[next,p]}
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){f.u[y*n+x]-=(p[index(x+1,y,n)]-p[index(x-1,y,n)])*.5;f.v[y*n+x]-=(p[index(x,y+1,n)]-p[index(x,y-1,n)])*.5}
}
export function stepFluid(f:Fluid,dt:number,force:number,iterations:number,source:boolean,viscosity:number){
 const {n}=f,u=new Float32Array(n*n),v=new Float32Array(n*n),dye=new Float32Array(n*n)
 for(let y=0;y<n;y++)for(let x=0;x<n;x++){const i=y*n+x,bx=x-f.u[i]*dt,by=y-f.v[i]*dt;u[i]=sample(f.u,n,bx,by)*Math.exp(-viscosity*dt);v[i]=sample(f.v,n,bx,by)*Math.exp(-viscosity*dt);dye[i]=sample(f.dye,n,bx,by)*Math.exp(-.05*dt)
  const dx=x-n*.5,dy=y-n*.5,r=Math.exp(-(dx*dx+dy*dy)/(n*n*.07));u[i]+=-dy*r*force*dt;v[i]+=dx*r*force*dt
  if(source)dye[i]=Math.min(1,dye[i]+Math.exp(-((x-n*.3)**2+(y-n*.5)**2)/(n*n*.006))*dt*.5)
 }
 f.u=u;f.v=v;f.dye=dye;f.before=divergenceNorm(f);project(f,iterations);f.after=divergenceNorm(f);f.time+=dt
}
