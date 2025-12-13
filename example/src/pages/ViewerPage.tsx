import React, { useState } from 'react'
import { BedLayoutViewer, KonvaViewer } from 'wysiwyg-pdf'
import type { ITemplateDoc } from 'wysiwyg-pdf'
import { dummyBedLayout, dummyDashboardData } from '../data/dummyBedLayout'
import { INVOICE_TEMPLATE, SIGNATURE_TEMPLATE } from '../data/dummyReportTemplates'
import { ArrowLeft, Moon, Sun, X, ZoomIn } from 'lucide-react'


interface ViewerPageProps {
    onBack: () => void
}

type DemoType = 'bedlayout' | 'invoice' | 'signature'

interface DemoItem {
    id: DemoType
    title: string
    description: string
    thumbnailColor: string
}

const DEMOS: DemoItem[] = [
    { id: 'bedlayout', title: 'Bed Layout Monitor', description: 'Real-time patient monitoring dashboard', thumbnailColor: 'bg-blue-100 text-blue-600' },
    { id: 'invoice', title: 'Invoice Preview', description: 'Standard business invoice template', thumbnailColor: 'bg-green-100 text-green-600' },
    { id: 'signature', title: 'Signature Document', description: 'Legal document with digital signature', thumbnailColor: 'bg-purple-100 text-purple-600' },
]

const StatusLegend = () => (
    <div className="absolute top-4 right-4 bg-white/90 dark:bg-black/80 p-3 rounded-lg shadow-lg border border-theme-border z-10 text-xs backdrop-blur-sm pointer-events-none">
        <h3 className="font-bold mb-2 text-theme-text-primary">Status Legend</h3>
        <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span>Idle / Empty</span></div>
        <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-green-500"></div><span>Stable</span></div>
        <div className="flex items-center gap-2 mb-1"><div className="w-3 h-3 rounded-full bg-yellow-500"></div><span>Warning</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div><span>Alarm / Critical</span></div>
    </div>
)

// Helper to adapt ITemplateDoc to KonvaViewer
import { Rect } from 'react-konva'

const getPageDimensions = (size: any) => {
    if (typeof size === 'string') {
        if (size === 'A4') return { width: 595.28, height: 841.89 }
        // Default to A4 for now for other strings
        return { width: 595.28, height: 841.89 }
    }
    return size || { width: 595.28, height: 841.89 }
}

const TemplateViewer: React.FC<{ doc: ITemplateDoc; zoom: number }> = ({ doc, zoom }) => {
    const page = doc.pages[0]
    const dims = getPageDimensions(page?.size)
    const bgColor = page?.background?.color || '#ffffff'

    // Cast elements to any to avoid strict type mismatch during rapid dev
    const elements = (doc.elements || []) as any[]

    return (
        <div className="shadow-lg bg-white">
            <KonvaViewer
                elements={elements}
                zoom={zoom}
                paperWidth={dims.width}
                paperHeight={dims.height}
                background={
                    <Rect x={0} y={0} width={dims.width} height={dims.height} fill={bgColor} />
                }
            />
        </div>
    )
}

export const ViewerPage: React.FC<ViewerPageProps> = ({ onBack }) => {
    const [darkMode, setDarkMode] = useState(false)
    const [selectedDemo, setSelectedDemo] = useState<DemoType | null>(null)
    const [zoom, setZoom] = useState(100)

    React.useEffect(() => {
        const theme = darkMode ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.classList.toggle('dark', darkMode)
    }, [darkMode])

    const handleClose = () => {
        setSelectedDemo(null)
        setZoom(100)
    }

    const renderViewerContent = () => {
        if (!selectedDemo) return null

        if (selectedDemo === 'bedlayout') {
            return (
                <div className="relative w-full h-full bg-gray-100 dark:bg-gray-900 overflow-hidden">
                    <StatusLegend />
                    <BedLayoutViewer
                        document={dummyBedLayout}
                        dashboardData={dummyDashboardData}
                        zoom={zoom / 100}
                    />
                </div>
            )
        }

        const template: ITemplateDoc = selectedDemo === 'invoice' ? INVOICE_TEMPLATE : SIGNATURE_TEMPLATE
        return (
            <div className="w-full h-full bg-gray-50 dark:bg-gray-900 flex justify-center overflow-auto p-4">
                <TemplateViewer doc={template} zoom={zoom / 100} />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen w-screen bg-theme-bg-primary text-theme-text-primary transition-colors duration-200">
            {/* Header */}
            <header className="h-14 border-b border-theme-border bg-theme-bg-secondary flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 rounded-full hover:bg-theme-bg-tertiary text-theme-text-secondary transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-semibold text-theme-text-primary">
                        Viewer Demos
                    </h1>
                </div>
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-md hover:bg-theme-bg-tertiary text-theme-text-secondary transition-colors"
                >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
            </header>

            {/* Grid Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {DEMOS.map((demo) => (
                        <div
                            key={demo.id}
                            onClick={() => setSelectedDemo(demo.id)}
                            className="group bg-theme-bg-secondary border border-theme-border rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col h-full"
                        >
                            {/* Live Thumbnail */}
                            <div className="h-48 relative bg-gray-100 overflow-hidden pointer-events-none border-b border-theme-border">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {/* Wrapper to scale down the content. Assuming A4 width ~600px, 0.25 scale = 150px which fits in 192px height container */}
                                    <div className="transform scale-[0.25] flex items-center justify-center">
                                        {demo.id === 'bedlayout' ? (
                                            <div className="w-[800px] h-[600px] bg-white border border-gray-200 shadow-md">
                                                <BedLayoutViewer
                                                    document={dummyBedLayout}
                                                    dashboardData={dummyDashboardData}
                                                    zoom={1}
                                                />
                                            </div>
                                        ) : (
                                            <TemplateViewer
                                                doc={demo.id === 'invoice' ? INVOICE_TEMPLATE : SIGNATURE_TEMPLATE}
                                                zoom={1} // Zoom 1 inside the scaled container
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-transparent group-hover:bg-theme-object-primary/5 transition-colors duration-300" />
                            </div>

                            <div className="p-5">
                                <h3 className="font-semibold text-lg text-theme-text-primary mb-2 flex items-center gap-2">
                                    {demo.title}
                                </h3>
                                <p className="text-sm text-theme-text-secondary leading-relaxed">{demo.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {/* Modal Viewer */}
            {selectedDemo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200">
                    <div className="bg-theme-bg-primary w-full h-full max-w-7xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-theme-border">
                        {/* Modal Header */}
                        <div className="h-16 border-b border-theme-border bg-theme-bg-secondary flex items-center justify-between px-6 shrink-0">
                            <h2 className="font-semibold text-xl text-theme-text-primary">
                                {DEMOS.find(d => d.id === selectedDemo)?.title}
                            </h2>

                            <div className="flex items-center gap-6">
                                {/* Zoom Controls */}
                                <div className="flex items-center gap-3 bg-theme-bg-tertiary px-4 py-2 rounded-full border border-theme-border/50">
                                    <span className="text-xs font-bold text-theme-text-secondary uppercase tracking-wider">Zoom</span>
                                    <input
                                        type="range"
                                        min="50"
                                        max="150"
                                        step="10"
                                        value={zoom}
                                        onChange={(e) => setZoom(Number(e.target.value))}
                                        className="w-32 h-1.5 bg-gray-300 rounded-lg appearance-none cursor-pointer dark:bg-gray-600 accent-theme-object-primary"
                                    />
                                    <span className="text-xs font-mono w-10 text-right">{zoom}%</span>
                                </div>

                                <button
                                    onClick={handleClose}
                                    className="p-2 hover:bg-theme-bg-tertiary rounded-full transition-colors text-theme-text-secondary hover:text-theme-text-primary"
                                    aria-label="Close"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-hidden relative bg-theme-bg-tertiary/50">
                            {renderViewerContent()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
