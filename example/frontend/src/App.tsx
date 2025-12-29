import { useState, useEffect } from 'react'
import { DashboardPage } from './pages/DashboardPage'
import { ReportEditorPage } from './pages/ReportEditorPage'
import { BedLayoutEditorPage } from './pages/BedLayoutEditorPage'

import { ViewerPage } from './pages/ViewerPage'
import { SignatureDemoPage } from './pages/SignatureDemoPage'
import { MindmapDemoPage } from './pages/MindmapDemoPage'
import { SlideEditorPage } from './pages/SlideEditorPage'
import { QueueProvider, QueueViewer } from 'wysiwyg-pdf'


// Simple Hash Router Hook
const useHashLocation = () => {
  const [location, setLocation] = useState(window.location.hash.replace('#', '') || '/')

  useEffect(() => {
    const handleHashChange = () => {
      setLocation(window.location.hash.replace('#', '') || '/')
    }
    // Handle initial hash check and also regular changes
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const navigate = (path: string) => {
    window.location.hash = path
  }

  return { location, navigate }
}

function App() {
  const { location, navigate } = useHashLocation()

  return (
    <QueueProvider>
      {location === '/report' && <ReportEditorPage onBack={() => navigate('/')} />}
      {location === '/bed' && <BedLayoutEditorPage onBack={() => navigate('/')} />}
      {location === '/viewer' && <ViewerPage onBack={() => navigate('/')} />}
      {location === '/signature' && <SignatureDemoPage onBack={() => navigate('/')} />}
      {location === '/mindmap' && <MindmapDemoPage onBack={() => navigate('/')} />}
      {location === '/slide' && <SlideEditorPage onBack={() => navigate('/')} />}
      {location === '/' && <DashboardPage onNavigate={(page) => navigate(`/${page}`)} />}
      <QueueViewer />
    </QueueProvider>
  )
}

export default App
