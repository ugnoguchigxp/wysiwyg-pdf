import React, { useState } from 'react'
import { BedLayoutViewer } from 'wysiwyg-pdf'
import { dummyBedLayout, dummyDashboardData } from '../data/dummyBedLayout'
import { ArrowLeft, Moon, Sun } from 'lucide-react'

interface ViewerPageProps {
    onBack: () => void
}

export const ViewerPage: React.FC<ViewerPageProps> = ({ onBack }) => {
    const [darkMode, setDarkMode] = useState(false)
    const [zoom, setZoom] = useState(100)

    React.useEffect(() => {
        const theme = darkMode ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.classList.toggle('dark', darkMode)
    }, [darkMode])

    return (
        <div className="flex flex-col h-screen w-screen bg-theme-bg-primary text-theme-text-primary transition-colors duration-200">
            {/* Simple Viewer Header */}
            <header className="h-14 border-b border-theme-border bg-theme-bg-secondary flex items-center justify-between px-4 shrink-0 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-full hover:bg-theme-bg-tertiary text-theme-text-secondary transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-semibold text-theme-text-primary">
                        {dummyBedLayout.name} (Live View)
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-theme-bg-tertiary px-3 py-1 rounded-md">
                        <span className="text-xs font-medium text-theme-text-secondary">Zoom</span>
                        <input
                            type="range"
                            min="50"
                            max="150"
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-24 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                        />
                        <span className="text-xs font-medium w-8 text-right">{zoom}%</span>
                    </div>

                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 rounded-md hover:bg-theme-bg-tertiary text-theme-text-secondary transition-colors"
                    >
                        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>
            </header>

            {/* Viewer Canvas */}
            <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-900 border-t border-theme-border relative">
                <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 p-3 rounded-lg shadow-lg border border-theme-border z-10 text-xs backdrop-blur-sm">
                    <h3 className="font-bold mb-2 text-theme-text-primary">Status Legend</h3>
                    <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>Idle / Empty</span></div>
                    <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>Stable</span></div>
                    <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span>Warning</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>Alarm / Critical</span></div>
                </div>

                <BedLayoutViewer
                    document={dummyBedLayout}
                    dashboardData={dummyDashboardData}
                    zoom={zoom / 100}
                />
            </div>
        </div>
    )
}
