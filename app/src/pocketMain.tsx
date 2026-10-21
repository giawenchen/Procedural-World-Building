import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import PocketIsland from './PocketIsland'
import './index.css'
createRoot(document.getElementById('root')!).render(<StrictMode><PocketIsland/></StrictMode>)
