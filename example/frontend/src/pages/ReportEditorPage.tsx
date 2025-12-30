import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
    ReportKonvaEditor,
    WysiwygEditorToolbar,
    WysiwygPropertiesPanel,
    PrintLayout,
    type IDataSchema,
    useReportHistory,
    type ReportKonvaEditorHandle,
    type Doc,
    EditorHeader,
    ShortcutHelpModal,
    DocumentLoadMenu,
    useQueue,
} from 'wysiwyg-pdf'
import { useReactToPrint, type UseReactToPrintOptions } from 'react-to-print'
import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'
import { EDITOR_TRANSLATIONS } from '../constants/translations'
import { saveDocument, listDocuments, getDocument } from '../api/documents'
import { uploadDocAssets } from '../utils/upload-helper'

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

const INITIAL_DOC: Doc = {
    v: 1,
    id: 'doc-1',
    title: 'New Template',
    unit: 'mm',
    surfaces: [
        {
            id: 'page-1',
            type: 'page',
            w: 210,
            h: 297,
            bg: '#ffffff',
            margin: { t: 0, r: 0, b: 0, l: 0 },
        },
    ],
    nodes: [],
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
    const [activeTool, setActiveTool] = useState<string>('select')
    const [drawingSettings, setDrawingSettings] = useState<{ stroke: string; strokeWidth: number; tolerance?: number }>({ stroke: '#000000', strokeWidth: 0.2, tolerance: 2.0 })

    const [showGrid, setShowGrid] = useState(false)
    const [gridSize, setGridSize] = useState(15)
    const [snapStrength, setSnapStrength] = useState(5)
    const { addTask } = useQueue()

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

    const fetchRecent = useCallback(async () => {
        const response = await listDocuments({ user: 'anonymous', type: 'report', limit: 5 })
        return response.items
    }, [])

    const fetchBrowse = useCallback(
        async (query: string, offset: number) => {
            const response = await listDocuments({
                user: 'anonymous',
                type: 'report',
                q: query || undefined,
                limit: 20,
                offset,
            })
            return {
                items: response.items,
                hasMore: response.items.length === 20,
            }
        },
        []
    )

    const handleLoad = useCallback(async (id: string) => {
        const detail = await getDocument(id, 'anonymous')
        setDocument(detail.payload as Doc)
        setTemplateName(detail.title)
        setSelectedElementId(null)
    }, [setDocument])

    const handleSave = () => {
        const save = async () => {
            try {
                let updatedDoc = null
                if (editorRef.current) {
                    updatedDoc = editorRef.current.flushSignature()
                } else {
                    console.error('[ReportEditorPage] editorRef is null!')
                }

                const trimmedTitle = templateName.trim() || 'Untitled'
                if (trimmedTitle !== templateName) {
                    setTemplateName(trimmedTitle)
                }

                console.log('[ReportEditorPage] Uploading assets...', trimmedTitle)
                let docWithAssets: Doc
                try {
                    docWithAssets = await uploadDocAssets(
                        updatedDoc || doc,
                        addTask
                    )
                } catch (e) {
                    console.error('[ReportEditorPage] Asset upload failed:', e)
                    alert('Failed to upload assets. Check console.')
                    return
                }
                console.log('[ReportEditorPage] Assets uploaded. Saving document...', docWithAssets)

                let result
                try {
                    result = await saveDocument({
                        user: 'anonymous',
                        type: 'report',
                        title: trimmedTitle,
                        payload: docWithAssets,
                    })
                } catch (e) {
                    console.error('[ReportEditorPage] saveDocument call failed:', e)
                    alert('Save API call failed. Check console.')
                    return
                }
                console.log('[ReportEditorPage] Save result:', result)

                if (result.status === 'exists') {
                    console.log('[ReportEditorPage] Title exists, asking for confirmation...')
                    const confirmed = window.confirm('同名の保存データがあります。上書きしますか？')
                    if (!confirmed) return
                    try {
                        const overwriteResult = await saveDocument({
                            user: 'anonymous',
                            type: 'report',
                            title: trimmedTitle,
                            payload: docWithAssets,
                            force: true,
                        })
                        console.log('[ReportEditorPage] Overwrite result:', overwriteResult)
                    } catch (e) {
                        console.error('[ReportEditorPage] Overwrite save call failed:', e)
                        alert('Overwrite save failed. Check console.')
                        return
                    }
                }

                alert(t('editor_save_success') || 'Saved!')
                console.log('[ReportEditorPage] handleSave completed successfully.')
            } catch (error) {
                console.error('[ReportEditorPage] Top-level error in handleSave:', error)
                alert('Fatal error during save. See console.')
            }
        }

        void save()
    }

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
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
                i18nOverrides={EDITOR_TRANSLATIONS}
                loadMenu={
                    <DocumentLoadMenu
                        fetchRecent={fetchRecent}
                        fetchBrowse={fetchBrowse}
                        onLoad={handleLoad}
                    />
                }
            >
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors"
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
                <div className="w-16 border-r border-border bg-secondary shrink-0 flex flex-col z-10 shadow-[1px_0_3px_rgb(0,0,0,0.05)]">
                    <WysiwygEditorToolbar
                        zoom={zoom}
                        onZoomChange={setZoom}
                        templateDoc={doc}
                        onTemplateChange={setDocument}
                        onSelectElement={(id) => setSelectedElementId(id)}
                        currentPageId={doc.surfaces[0]?.id}
                        activeTool={activeTool}
                        onToolSelect={setActiveTool}
                        i18nOverrides={EDITOR_TRANSLATIONS}
                    />
                </div>

                {/* Center Canvas */}
                <div className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                    <ReportKonvaEditor
                        ref={editorRef}
                        templateDoc={doc}
                        zoom={zoom / 100}
                        selectedElementId={selectedElementId || undefined}
                        onElementSelect={(el) => {
                            if (activeTool !== 'signature') {
                                setSelectedElementId(el?.id ?? null)
                            }
                        }}
                        onTemplateChange={setDocument}
                        currentPageId={doc.surfaces[0]?.id}
                        onSelectedCellChange={setSelectedCell}
                        onUndo={canUndo ? undo : undefined}
                        onRedo={canRedo ? redo : undefined}
                        orientation={orientation}
                        activeTool={activeTool}
                        drawingSettings={drawingSettings}
                        showGrid={showGrid}
                        gridSize={gridSize}
                        snapStrength={snapStrength}
                    />
                </div>

                {/* Right Properties Panel */}
                <div className="w-72 border-l border-border bg-secondary shrink-0 overflow-hidden flex flex-col z-10 shadow-[-1px_0_3px_rgb(0,0,0,0.05)]">
                    <WysiwygPropertiesPanel
                        templateDoc={doc}
                        selectedElementId={selectedElementId}
                        onTemplateChange={setDocument}
                        currentPageId={doc.surfaces[0]?.id}
                        selectedCell={selectedCell}
                        schema={MOCK_SCHEMA}
                        activeTool={activeTool}
                        onToolSelect={setActiveTool}
                        drawingSettings={drawingSettings}
                        onDrawingSettingsChange={setDrawingSettings}
                        showGrid={showGrid}
                        onShowGridChange={setShowGrid}
                        gridSize={gridSize}
                        onGridSizeChange={setGridSize}
                        snapStrength={snapStrength}
                        onSnapStrengthChange={setSnapStrength}
                        i18nOverrides={EDITOR_TRANSLATIONS}
                    />
                </div>
            </div>
        </div>
    )
}
