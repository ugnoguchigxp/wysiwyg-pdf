import React from 'react'
import { FileText, LayoutTemplate, Moon, Sun, Monitor } from 'lucide-react'


interface DashboardPageProps {
    onNavigate: (page: 'report' | 'bed' | 'viewer') => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
    const [darkMode, setDarkMode] = React.useState(false)

    React.useEffect(() => {
        const theme = darkMode ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.classList.toggle('dark', darkMode)
    }, [darkMode])

    return (
        <div className="flex flex-col h-screen w-screen bg-theme-bg-primary text-theme-text-primary transition-colors duration-200">
            <header className="h-14 border-b border-theme-border bg-theme-bg-secondary flex items-center justify-between px-4 shrink-0">
                <h1 className="text-lg font-semibold text-theme-text-primary">WYSIWYG PDF Example</h1>
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-md hover:bg-theme-bg-tertiary text-theme-text-secondary transition-colors"
                >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </header>

            <main className="flex-1 flex items-center justify-center p-8 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
                    <button
                        onClick={() => onNavigate('report')}
                        className="flex flex-col items-center justify-center p-12 rounded-xl border-2 border-theme-border bg-theme-bg-secondary hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group h-80"
                    >
                        <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                            <FileText className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-theme-text-primary">Report Editor</h2>
                        <p className="text-theme-text-secondary text-center">
                            Create and edit PDF report templates with drag-and-drop ease.
                        </p>
                    </button>

                    <button
                        onClick={() => onNavigate('bed')}
                        className="flex flex-col items-center justify-center p-12 rounded-xl border-2 border-theme-border bg-theme-bg-secondary hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 group h-80"
                    >
                        <div className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                            <LayoutTemplate className="w-12 h-12 text-purple-600 dark:text-purple-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-theme-text-primary">Bed Layout Editor</h2>
                        <p className="text-theme-text-secondary text-center">
                            Design hospital ward layouts and manage bed positions.
                        </p>
                    </button>

                    <button
                        onClick={() => onNavigate('viewer')}
                        className="flex flex-col items-center justify-center p-12 rounded-xl border-2 border-theme-border bg-theme-bg-secondary hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 group h-80"
                    >
                        <div className="w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                            <Monitor className="w-12 h-12 text-green-600 dark:text-green-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-theme-text-primary">Viewer Demo</h2>
                        <p className="text-theme-text-secondary text-center">
                            Live dashboard view of a ward with patient status and vitals.
                        </p>
                    </button>
                </div>
            </main>
        </div>
    )
}
