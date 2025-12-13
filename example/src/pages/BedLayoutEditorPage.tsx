import React, { useRef, useState, useEffect } from 'react'
import {
    BedLayoutHeader,
    ShortcutHelpModal,
    BedLayoutEditor,
    BedToolbar,
    BedPropertyPanel,
    type BedLayoutDocument,
    type BedLayoutEditorHandle,
    useEditorHistory as useBedEditorHistory,
} from 'wysiwyg-pdf'
import { useReactToPrint, type UseReactToPrintOptions } from 'react-to-print'
import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'

// Initial State (Moved from App.tsx)
const INITIAL_BED_DOC: BedLayoutDocument = {
    id: 'bed-layout-1',
    type: 'bed_layout',
    name: 'New Bed Layout',
    layout: {
        mode: 'portrait',
        width: 600,
        height: 800,
    },
    elementsById: {},
    elementOrder: [],
}

interface BedLayoutEditorPageProps {
    onBack: () => void
}

export const BedLayoutEditorPage: React.FC<BedLayoutEditorPageProps> = ({ onBack }) => {
    const { t } = useTranslation()
    const [templateName, setTemplateName] = useState('New Bed Layout')
    const [zoom, setZoom] = useState(100)
    const [orientation, setOrientation] = useState<string>('portrait')
    const [darkMode, setDarkMode] = useState(false)
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [activeTool, setActiveTool] = useState<string>('select')

    // State for Bed Layout Document
    const [bedDoc, setBedDocument] = useState<BedLayoutDocument>(INITIAL_BED_DOC)

    // History Management
    const {
        execute: executeBedOp,
        undo: undoBed,
        redo: redoBed,
        canUndo: canUndoBed,
        canRedo: canRedoBed,
    } = useBedEditorHistory(bedDoc, setBedDocument)

    // Sync layout dimensions when orientation changes
    useEffect(() => {
        setBedDocument(prev => {
            let width = 600
            let height = 800
            let mode = 'portrait'

            if (orientation === 'landscape') {
                width = 800
                height = 600
                mode = 'landscape'
            } else if (orientation === 'square') {
                width = 800
                height = 800
                mode = 'custom' // or 'square' if supported by type, usually 'custom' or just width/height matters
            }

            // Only update if changed to avoid loop
            if (prev.layout.width === width && prev.layout.height === height) return prev

            return {
                ...prev,
                layout: {
                    ...prev.layout,
                    mode: mode as any,
                    width,
                    height
                }
            }
        })
    }, [orientation])

    // Refs
    const bedEditorRef = useRef<BedLayoutEditorHandle>(null)
    const printRef = useRef<HTMLDivElement>(null)

    // Toggle Dark Mode
    useEffect(() => {
        const theme = darkMode ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.classList.toggle('dark', darkMode)
    }, [darkMode])

    // Handle Tool Select (Add Elements)
    const handleToolSelect = (tool: string, subType?: string) => {
        setActiveTool(tool)

        // Simple "Add to center" logic for now
        if (tool === 'select') return

        const newId = crypto.randomUUID()
        const center = { x: bedDoc.layout.width / 2, y: bedDoc.layout.height / 2 }

        let newElement: any = null

        if (tool === 'text') {
            newElement = {
                id: newId,
                type: 'Text',
                rotation: 0,
                text: 'New Text',
                font: { family: 'Arial', size: 14, weight: 400, italic: false, underline: false, strikethrough: false },
                color: '#000000',
                align: 'left',
                box: { x: center.x, y: center.y, width: 100, height: 20 },
            }
        } else if (tool === 'bed') {
            newElement = {
                id: newId,
                type: 'Bed',
                box: {
                    x: center.x,
                    y: center.y,
                    width: 100,
                    height: 200,
                },
                rotation: 0,
                name: 'Bed 1',
                bedType: 'standard', // or whatever required
                opacity: 1,
            }
        } else if (tool === 'shape' && subType) {
            newElement = {
                id: newId,
                type: subType, // e.g. Rect, Circle
                box: {
                    x: center.x,
                    y: center.y,
                    width: 100,
                    height: 100,
                },
                rotation: 0,
                fill: { color: '#cccccc' },
                stroke: { color: '#000000', width: 1 },
            }
        } else if (tool === 'line') {
            newElement = {
                id: newId,
                type: 'Line',
                rotation: 0,
                startPoint: { x: 0, y: 0 },
                endPoint: { x: 100, y: 0 },
                stroke: { color: '#000000', width: 2 },
                startArrow: 'none',
                endArrow: 'none',
            }
        }

        if (newElement) {
            executeBedOp({
                kind: 'create-element',
                element: newElement,
            })
            setActiveTool('select')
        }
    }

    const handleDownloadImage = () => {
        bedEditorRef.current?.downloadImage()
    }

    const handleSave = () => {
        console.log('Save bed document:', bedDoc)
        alert(t('editor_save_success') || 'Saved! (Check Console)')
    }

    // Print Logic (stubbed for now or reuse existing hidden print layout if compatible)
    const reactToPrintFn = useReactToPrint({
        contentRef: printRef, // We might need a BedPrintLayout later
        documentTitle: templateName,
    } as UseReactToPrintOptions)

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-theme-bg-primary text-theme-text-primary transition-colors duration-200">
            {/* Header */}
            {/* Header */}
            <BedLayoutHeader
                templateName={templateName}
                onTemplateNameChange={setTemplateName}
                orientation={orientation}
                onOrientationChange={setOrientation}
                canUndo={canUndoBed}
                canRedo={canRedoBed}
                onUndo={undoBed}
                onRedo={redoBed}
                onDownloadImage={handleDownloadImage}
                onDownloadPdf={() => reactToPrintFn()}
                onSave={handleSave}
                onShowShortcuts={() => setShowShortcuts(true)}
                onBack={onBack}
            >
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-md hover:bg-theme-bg-tertiary text-theme-text-secondary transition-colors"
                >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
            </BedLayoutHeader>

            <ShortcutHelpModal open={showShortcuts} onOpenChange={setShowShortcuts} />

            {/* Print Ref (Placeholder) */}
            <div style={{ display: 'none' }} ref={printRef}>
                {/* Implement BedPrintLayout if needed */}
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Toolbar */}
                <div className="w-16 border-r border-theme-border bg-theme-bg-secondary shrink-0 flex flex-col z-10 shadow-[1px_0_3px_rgb(0,0,0,0.05)]">
                    <BedToolbar
                        activeTool={activeTool as any}
                        onSelectTool={handleToolSelect}
                        canUndo={canUndoBed}
                        canRedo={canRedoBed}
                        onUndo={undoBed}
                        onRedo={redoBed}
                        zoom={zoom / 100}
                        onZoomIn={() => setZoom(Math.min(zoom + 10, 200))}
                        onZoomOut={() => setZoom(Math.max(zoom - 10, 10))}
                    />
                </div>

                {/* Center Canvas */}
                <div className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                    <BedLayoutEditor
                        ref={bedEditorRef}
                        document={bedDoc}
                        zoom={zoom / 100}
                        selection={selectedElementId ? [selectedElementId] : []}
                        onSelect={(ids) => setSelectedElementId(ids[0] || null)}
                        onChangeElement={(id, newAttrs) => {
                            const element = bedDoc.elementsById[id]
                            if (!element) return
                            executeBedOp({
                                kind: 'update-element',
                                id,
                                prev: element,
                                next: newAttrs,
                            })
                        }}
                        onDelete={(id) => {
                            const element = bedDoc.elementsById[id]
                            if (!element) return
                            executeBedOp({
                                kind: 'delete-element',
                                id,
                                prevElement: element,
                            })
                            setSelectedElementId(null)
                        }}
                        onUndo={undoBed}
                        onRedo={redoBed}
                    />
                </div>

                {/* Right Properties Panel */}
                <div className="w-72 border-l border-theme-border bg-theme-bg-secondary shrink-0 overflow-hidden flex flex-col z-10 shadow-[-1px_0_3px_rgb(0,0,0,0.05)]">
                    <BedPropertyPanel
                        selectedElement={selectedElementId ? bedDoc.elementsById[selectedElementId] : null}
                        onChange={(id, attrs) => {
                            const element = bedDoc.elementsById[id]
                            if (!element) return
                            executeBedOp({
                                kind: 'update-element',
                                id,
                                prev: element,
                                next: attrs,
                            })
                        }}
                        onDelete={(id) => {
                            const element = bedDoc.elementsById[id]
                            if (!element) return
                            executeBedOp({
                                kind: 'delete-element',
                                id,
                                prevElement: element,
                            })
                            setSelectedElementId(null)
                        }}
                        document={bedDoc}
                        onDocumentChange={(newDoc) => {
                            setBedDocument(newDoc)
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
