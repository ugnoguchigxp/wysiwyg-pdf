import { useState, useEffect } from 'react'
import { DashboardPage } from './pages/DashboardPage'
import { ReportEditorPage } from './pages/ReportEditorPage'
import { BedLayoutEditorPage } from './pages/BedLayoutEditorPage'

import { ViewerPage } from './pages/ViewerPage'
import { SignatureDemoPage } from './pages/SignatureDemoPage'
import { MindmapDemoPage } from './pages/MindmapDemoPage'
import { SlideEditorPage } from './pages/SlideEditorPage'
import { QueueProvider, QueueViewer } from 'wysiwyg-pdf'


import { ExcelImportPage } from './pages/ExcelImportPage'

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

function App() {
  const { location, params, navigate } = useHashLocation()

  return (
    <QueueProvider>
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
      <QueueViewer />
    </QueueProvider>
  )
}

export default App
