import { StrictMode, lazy, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './Atlas.css'
import './Workbench.css'

// Entry-point selection lives outside the refreshable component tree.
// oxlint-disable-next-line react/only-export-components
const Exhibition = lazy(() => import('./Exhibition'))
const isExhibition = new URLSearchParams(location.search).has('exhibition')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isExhibition ? <Suspense fallback={<p>Preparing the exhibition…</p>}><Exhibition /></Suspense> : <App />}
  </StrictMode>,
)
