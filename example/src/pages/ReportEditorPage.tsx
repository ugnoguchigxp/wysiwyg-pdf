import React, { useRef, useState, useEffect } from 'react'
import {
    ReportKonvaEditor,
    WysiwygEditorToolbar,
    WysiwygPropertiesPanel,
    PrintLayout,
    type ITemplateDoc,
    type IDataSchema,
    useReportHistory,
    type ReportKonvaEditorHandle,
    EditorHeader,
    ShortcutHelpModal,
} from 'wysiwyg-pdf'
import { useReactToPrint, type UseReactToPrintOptions } from 'react-to-print'
import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'

// Local Mock Data (Moved from App.tsx)
const MOCK_SCHEMA: IDataSchema = {
    id: 'medical-v1',
    version: '1.0.0',
    locale: 'en-US',
    categories: [
        {
            id: 'patient',
            label: 'Patient Info',
            isRepeater: false,
            fields: [
                { id: 'patient.name', label: 'Name', type: 'string' },
                { id: 'patient.id', label: 'ID', type: 'string' },
                { id: 'patient.dob', label: 'Date of Birth', type: 'date' },
            ],
        },
        {
            id: 'vitals',
            label: 'Vitals',
            isRepeater: true,
            fields: [
                { id: 'vitals.bp', label: 'Blood Pressure', type: 'string' },
                { id: 'vitals.pulse', label: 'Pulse', type: 'number' },
            ],
        },
    ],
}

const INITIAL_DOC: ITemplateDoc = {
    meta: { id: 'doc-1', name: 'New Template', version: 1 },
    pages: [
        {
            id: 'page-1',
            size: 'A4',
            margin: { top: 0, right: 0, bottom: 0, left: 0, unit: 'pt' },
            background: { color: '#ffffff' },
        },
    ],
    elements: [],
}

interface ReportEditorPageProps {
    onBack: () => void
}

export const ReportEditorPage: React.FC<ReportEditorPageProps> = ({ onBack }) => {
    const { t } = useTranslation()
    const [templateName, setTemplateName] = useState('New Template')
    const [zoom, setZoom] = useState(100)
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
    const [darkMode, setDarkMode] = useState(false)
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
    const [selectedCell, setSelectedCell] = useState<{
        elementId: string
        row: number
        col: number
    } | null>(null)
    const [showShortcuts, setShowShortcuts] = useState(false)

    // History Management
    const { document: doc, setDocument, undo, redo, canUndo, canRedo } = useReportHistory(INITIAL_DOC)

    // Refs
    const editorRef = useRef<ReportKonvaEditorHandle>(null)
    const printRef = useRef<HTMLDivElement>(null)

    // Toggle Dark Mode
    useEffect(() => {
        const theme = darkMode ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.classList.toggle('dark', darkMode)
    }, [darkMode])

    // Handle Selection
    const handleElementSelect = (element: any | null) => {
        setSelectedElementId(element?.id || null)
        if (!element) setSelectedCell(null)
    }

    // Print Logic
    const reactToPrintFn = useReactToPrint({
        contentRef: printRef,
        documentTitle: templateName,
        pageStyle: `
      @page {
        size: A4 ${orientation};
        margin: 0;
      }
    `,
    } as UseReactToPrintOptions)

    const handleDownloadImage = () => {
        editorRef.current?.downloadImage()
    }

    const handleSave = () => {
        console.log('Save document:', doc)
        alert(t('editor_save_success') || 'Saved! (Check Console)')
    }

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-theme-bg-primary text-theme-text-primary transition-colors duration-200">
            {/* Header */}
            <EditorHeader
                templateName={templateName}
                onTemplateNameChange={setTemplateName}
                orientation={orientation}
                onOrientationChange={setOrientation}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
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
            </EditorHeader>

            <ShortcutHelpModal open={showShortcuts} onOpenChange={setShowShortcuts} />

            {/* Hidden Print Layout */}
            <div style={{ display: 'none' }}>
                <PrintLayout ref={printRef} doc={doc} orientation={orientation} />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Toolbar */}
                <div className="w-16 border-r border-theme-border bg-theme-bg-secondary shrink-0 flex flex-col z-10 shadow-[1px_0_3px_rgb(0,0,0,0.05)]">
                    <WysiwygEditorToolbar
                        zoom={zoom}
                        onZoomChange={setZoom}
                        templateDoc={doc}
                        onTemplateChange={setDocument}
                        onSelectElement={(id) => setSelectedElementId(id)}
                        currentPageId={doc.pages[0]?.id}
                    />
                </div>

                {/* Center Canvas */}
                <div className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                    <ReportKonvaEditor
                        ref={editorRef}
                        templateDoc={doc}
                        zoom={zoom / 100}
                        selectedElementId={selectedElementId || undefined}
                        onElementSelect={handleElementSelect}
                        onTemplateChange={setDocument}
                        currentPageId={doc.pages[0]?.id}
                        onSelectedCellChange={setSelectedCell}
                        onUndo={undo}
                        onRedo={redo}
                        orientation={orientation}
                    />
                </div>

                {/* Right Properties Panel */}
                <div className="w-72 border-l border-theme-border bg-theme-bg-secondary shrink-0 overflow-hidden flex flex-col z-10 shadow-[-1px_0_3px_rgb(0,0,0,0.05)]">
                    <WysiwygPropertiesPanel
                        templateDoc={doc}
                        selectedElementId={selectedElementId}
                        onTemplateChange={setDocument}
                        currentPageId={doc.pages[0]?.id}
                        selectedCell={selectedCell}
                        schema={MOCK_SCHEMA}
                    />
                </div>
            </div>
        </div>
    )
}
