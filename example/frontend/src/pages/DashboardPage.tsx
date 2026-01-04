import React from 'react'
import { FileText, LayoutTemplate, Moon, Sun, Monitor, GitBranch, FileSpreadsheet } from 'lucide-react'


interface DashboardPageProps {
    onNavigate: (page: 'report' | 'bed' | 'viewer' | 'signature' | 'mindmap' | 'slide' | 'excel-import') => void
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigate }) => {
    const [darkMode, setDarkMode] = React.useState(false)

    React.useEffect(() => {
        const theme = darkMode ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.classList.toggle('dark', darkMode)
    }, [darkMode])

    return (
        <div className="flex flex-col h-screen w-screen bg-background text-foreground transition-colors duration-200">
            <header className="h-14 border-b border-border bg-secondary flex items-center justify-between px-4 shrink-0">
                <h1 className="text-lg font-semibold text-foreground">WYSIWYG PDF Example</h1>
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors"
                >
                    {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </header>

            <main className="flex-1 flex p-8 overflow-auto">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full m-auto">
                    <button
                        onClick={() => onNavigate('report')}
                        className="flex flex-col items-center justify-center p-12 rounded-xl border-2 border-border bg-card hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200 group h-80"
                    >
                        <div className="w-24 h-24 rounded-full bg-blue-600 dark:bg-blue-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                            <FileText className="w-12 h-12 !text-white dark:text-blue-400" style={{ color: 'white' }} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-foreground">Report Editor</h2>
                        <p className="text-muted-foreground text-center">
                            Create and edit PDF report templates with drag-and-drop ease.
                        </p>
                    </button>

                    <button
                        onClick={() => onNavigate('excel-import')}
                        className="flex flex-col items-center justify-center p-12 rounded-xl border-2 border-border bg-card hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 group h-80"
                    >
                        <div className="w-24 h-24 rounded-full bg-green-600 dark:bg-green-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                            <FileSpreadsheet className="w-12 h-12 !text-white dark:text-green-400" style={{ color: 'white' }} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-foreground">Excel Import</h2>
                        <p className="text-muted-foreground text-center">
                            Convert Excel files to PDF templates.
                        </p>
                    </button>

                    <button
                        onClick={() => onNavigate('bed')}
                        className="flex flex-col items-center justify-center p-12 rounded-xl border-2 border-border bg-card hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200 group h-80"
                    >
                        <div className="w-24 h-24 rounded-full bg-purple-600 dark:bg-purple-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                            <LayoutTemplate className="w-12 h-12 !text-white dark:text-purple-400" style={{ color: 'white' }} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-foreground">Bed Layout Editor</h2>
                        <p className="text-muted-foreground text-center">
                            Design hospital ward layouts and manage bed positions.
                        </p>
                    </button>

                    <button
                        onClick={() => onNavigate('viewer')}
                        className="flex flex-col items-center justify-center p-12 rounded-xl border-2 border-border bg-card hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 group h-80"
                    >
                        <div className="w-24 h-24 rounded-full bg-green-600 dark:bg-green-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                            <Monitor className="w-12 h-12 !text-white dark:text-green-400" style={{ color: 'white' }} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-foreground">Viewer Demo</h2>
                        <p className="text-muted-foreground text-center">
                            Live dashboard view of a ward with patient status and vitals.
                        </p>
                    </button>

                    <button
                        onClick={() => onNavigate('signature')}
                        className="flex flex-col items-center justify-center p-12 rounded-xl border-2 border-border bg-card hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-all duration-200 group h-80"
                    >
                        <div className="w-24 h-24 rounded-full bg-orange-600 dark:bg-orange-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                            <FileText className="w-12 h-12 !text-white dark:text-orange-400" style={{ color: 'white' }} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-foreground">Signature Demo</h2>
                        <p className="text-muted-foreground text-center">
                            Draw and save signatures.
                        </p>
                    </button>

                    <button
                        onClick={() => onNavigate('mindmap')}
                        className="flex flex-col items-center justify-center p-12 rounded-xl border-2 border-border bg-card hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-all duration-200 group h-80"
                    >
                        <div className="w-24 h-24 rounded-full bg-teal-600 dark:bg-teal-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                            <GitBranch className="w-12 h-12 !text-white dark:text-teal-400" style={{ color: 'white' }} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-foreground">Mindmap Editor</h2>
                        <p className="text-muted-foreground text-center">
                            FreeMind-like keyboard centric mind mapping.
                        </p>
                    </button>

                    <button
                        onClick={() => onNavigate('slide')}
                        className="flex flex-col items-center justify-center p-12 rounded-xl border-2 border-border bg-card hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 group h-80"
                    >
                        <div className="w-24 h-24 rounded-full bg-red-600 dark:bg-red-900/50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-200">
                            <Monitor className="w-12 h-12 !text-white dark:text-red-400" style={{ color: 'white' }} />
                        </div>
                        <h2 className="text-2xl font-bold mb-2 text-foreground">Slide Editor</h2>
                        <p className="text-muted-foreground text-center">
                            PowerPoint-like slide editor with PPTX export.
                        </p>
                    </button>
                </div>
            </main>
        </div>
    )
}
