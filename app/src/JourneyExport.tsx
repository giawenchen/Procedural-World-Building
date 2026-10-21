import {useEffect,useRef,useState} from 'react'
import {exportJourney} from './journeyExporter'
export default function JourneyExport(){
 const canvas=useRef<HTMLCanvasElement>(null),controller=useRef<AbortController|null>(null),url=useRef('')
 const [busy,setBusy]=useState(false),[progress,setProgress]=useState(0),[download,setDownload]=useState(''),[error,setError]=useState('')
 useEffect(()=>()=>{controller.current?.abort();if(url.current)URL.revokeObjectURL(url.current)},[])
 const start=async()=>{if(!canvas.current)return;setBusy(true);setError('');setDownload('');controller.current=new AbortController()
  try{const film=await exportJourney(canvas.current,setProgress,controller.current.signal);if(url.current)URL.revokeObjectURL(url.current);url.current=URL.createObjectURL(film);setDownload(url.current)}catch(e){setError(String(e))}finally{setBusy(false)}
 }
 return <main style={{background:'#f4ecdb',color:'#324d4d',padding:24,minHeight:'100vh',fontFamily:'Arial'}}><h1>The Fieldwork Express · short film export</h1><p>2:56 · 14-second opening · 1440 × 900 · 24 fps · frame-accurate render of the app models. Audio is mixed into the MP4 after export.</p><button disabled={busy} onClick={()=>void start()}>Render full film</button>{busy&&<button onClick={()=>controller.current?.abort()}>Cancel render</button>}<p role="status">{busy?`Rendering ${Math.floor(progress*100)}%`:download?'Film frames ready':error||'Ready to render'}</p>{download&&<a href={download} download="fieldwork-express-v5.ivf">Download rendered film</a>}<canvas ref={canvas} style={{display:'block',width:'min(100%,1100px)',height:'auto',marginTop:20}}/></main>
}
