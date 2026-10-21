import { StrictMode, lazy, Suspense } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import './Atlas.css'
import './Workbench.css'
import './Adventure.css'

// Entry-point selection lives outside the refreshable component tree.
// oxlint-disable-next-line react/only-export-components
const Exhibition = lazy(() => import('./Exhibition'))
// oxlint-disable-next-line react/only-export-components
const AtlasFilm = lazy(() => import('./AtlasFilm'))
// oxlint-disable-next-line react/only-export-components
const JourneyExport = lazy(() => import('./JourneyExport.tsx'))
// oxlint-disable-next-line react/only-export-components
const PocketIsland = lazy(() => import('./PocketIsland'))
// oxlint-disable-next-line react/only-export-components
const ControlledStudies = lazy(() => import('./ComparisonLab.tsx'))
const isExperiments = new URLSearchParams(location.search).has('experiments')
const isMobile = new URLSearchParams(location.search).has('mobile')
const isJourneyExport = new URLSearchParams(location.search).has('journeyexport')
const isAtlasFilm = new URLSearchParams(location.search).has('atlasfilm')
const isExhibition = new URLSearchParams(location.search).has('exhibition')

// Keep the same React root when Vite re-evaluates this entry module.
const root:Root=import.meta.hot?.data.root??createRoot(document.getElementById('root')!)
if(import.meta.hot)import.meta.hot.data.root=root
root.render(
  <StrictMode>
    {isMobile ? <Suspense fallback={<p>Preparing your island…</p>}><PocketIsland /></Suspense> : isExperiments ? <Suspense fallback={<p>Preparing comparisons…</p>}><ControlledStudies /></Suspense> : isJourneyExport ? <Suspense fallback={<p>Preparing film export…</p>}><JourneyExport /></Suspense> : isAtlasFilm ? <Suspense fallback={<p>Preparing course experiments…</p>}><AtlasFilm /></Suspense> : isExhibition ? <Suspense fallback={<p>Preparing the exhibition…</p>}><Exhibition /></Suspense> : <App />}
  </StrictMode>,
)
