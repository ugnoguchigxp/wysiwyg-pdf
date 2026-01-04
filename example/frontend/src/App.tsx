import { useState, useEffect, Suspense, lazy } from 'react'
import { QueueProvider, QueueViewer } from 'wysiwyg-pdf'

// Lazy load pages
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })))
const ReportEditorPage = lazy(() => import('./pages/ReportEditorPage').then(module => ({ default: module.ReportEditorPage })))
const BedLayoutEditorPage = lazy(() => import('./pages/BedLayoutEditorPage').then(module => ({ default: module.BedLayoutEditorPage })))
const ViewerPage = lazy(() => import('./pages/ViewerPage').then(module => ({ default: module.ViewerPage })))
const SignatureDemoPage = lazy(() => import('./pages/SignatureDemoPage').then(module => ({ default: module.SignatureDemoPage })))
const MindmapDemoPage = lazy(() => import('./pages/MindmapDemoPage').then(module => ({ default: module.MindmapDemoPage })))
const SlideEditorPage = lazy(() => import('./pages/SlideEditorPage').then(module => ({ default: module.SlideEditorPage })))
const ExcelImportPage = lazy(() => import('./pages/ExcelImportPage').then(module => ({ default: module.ExcelImportPage })))

// Simple Hash Router Hook
const useHashLocation = () => {
  const [hash, setHash] = useState(window.location.hash.replace('#', '') || '/')

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash.replace('#', '') || '/')
    }
    // Handle initial hash check and also regular changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigate = (path: string) => {
    window.location.hash = path
  }

  const [path, queryString] = hash.split('?')
  const params = new URLSearchParams(queryString)

  return { location: path, params, navigate }
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-screen w-screen bg-background">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  )
}

function App() {
  const { location, params, navigate } = useHashLocation()

  return (
    <QueueProvider>
      <Suspense fallback={<LoadingSpinner />}>
        {location === '/report' && (
          <ReportEditorPage
            onBack={() => navigate('/')}
            initialDocId={params.get('id') || undefined}
          />
        )}
        {location === '/bed' && <BedLayoutEditorPage onBack={() => navigate('/')} />}
        {location === '/viewer' && <ViewerPage onBack={() => navigate('/')} />}
        {location === '/signature' && <SignatureDemoPage onBack={() => navigate('/')} />}
        {location === '/mindmap' && <MindmapDemoPage onBack={() => navigate('/')} />}
        {location === '/slide' && <SlideEditorPage onBack={() => navigate('/')} />}

        {location === '/excel-import' && (
          <ExcelImportPage
            onBack={() => navigate('/')}
            onComplete={(id) => navigate(`/report?id=${id}`)}
          />
        )}

        {location === '/' && <DashboardPage onNavigate={(page) => navigate(`/${page}`)} />}
      </Suspense>
      <QueueViewer />
    </QueueProvider>
  )
}

export default App
