import { useState, useEffect } from 'react'
import { DashboardPage } from './pages/DashboardPage'
import { ReportEditorPage } from './pages/ReportEditorPage'
import { BedLayoutEditorPage } from './pages/BedLayoutEditorPage'

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

  // Routing Logic
  if (location === '/report') {
    return <ReportEditorPage onBack={() => navigate('/')} />
  }

  if (location === '/bed') {
    return <BedLayoutEditorPage onBack={() => navigate('/')} />
  }

  return <DashboardPage onNavigate={(page) => navigate(`/${page}`)} />
}

export default App
