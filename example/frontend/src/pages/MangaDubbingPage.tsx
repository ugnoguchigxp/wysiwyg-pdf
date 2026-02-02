import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import {
    ReportKonvaEditor,
    WysiwygEditorToolbar,
    WysiwygPropertiesPanel,
    type ReportKonvaEditorHandle,
    type Doc,
    type Surface,
    EditorHeader,
    ShortcutHelpModal,
    DocumentLoadMenu,
    useReportHistory,
    PageNavigator,
    generateUUID,
} from 'wysiwyg-pdf'
import { useTranslation } from 'react-i18next'
import { Moon, Sun } from 'lucide-react'
import { EDITOR_TRANSLATIONS } from '../constants/translations'
import { saveDocument, listDocuments, getDocument } from '../api/documents'

const INITIAL_DOC: Doc = {
    v: 1,
    id: `manga-${Date.now()}`,
    title: 'Manga Dubbing Project',
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

interface MangaDubbingPageProps {
    onBack: () => void
    initialDocId?: string
}

export const MangaDubbingPage: React.FC<MangaDubbingPageProps> = ({ onBack, initialDocId }) => {
    const { t } = useTranslation()
    const [templateName, setTemplateName] = useState('Manga Dubbing Project')
    const [zoom, setZoom] = useState(100)
    const [darkMode, setDarkMode] = useState(false)
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [activeTool, setActiveTool] = useState<string>('select')
    const [drawingSettings, setDrawingSettings] = useState<{ stroke: string; strokeWidth: number; tolerance?: number }>({ stroke: '#000000', strokeWidth: 0.2, tolerance: 2.0 })

    const [showGrid, setShowGrid] = useState(false)
    const [gridSize, setGridSize] = useState(15)
    const [snapStrength, setSnapStrength] = useState(5)

    const [currentPageIndex, setCurrentPageIndex] = useState(0)

    // History Management
    const { document: doc, setDocument, undo, redo, canUndo, canRedo } = useReportHistory(INITIAL_DOC)

    // Current Surface ID
    const currentPageId = useMemo(() => {
        return doc.surfaces[currentPageIndex]?.id || doc.surfaces[0]?.id
    }, [doc.surfaces, currentPageIndex])

    // Refs
    const editorRef = useRef<ReportKonvaEditorHandle>(null)

    // Toggle Dark Mode
    useEffect(() => {
        const theme = darkMode ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.classList.toggle('dark', darkMode)
    }, [darkMode])

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
        const loadedDoc = detail.payload as Doc
        setDocument(loadedDoc)
        setTemplateName(detail.title)
        setSelectedElementId(null)
        setCurrentPageIndex(0)
    }, [setDocument])

    useEffect(() => {
        if (initialDocId) {
            void handleLoad(initialDocId)
        }
    }, [initialDocId, handleLoad])

    const handleSave = () => {
        const save = async () => {
            try {
                await saveDocument({
                    user: 'anonymous',
                    type: 'report',
                    title: templateName.trim() || 'Untitled Manga',
                    payload: doc,
                    force: true, // Auto overwrite for demo
                })
                alert(t('editor_save_success') || 'Saved!')
            } catch (error) {
                console.error('Save failed', error)
                alert('Save failed')
            }
        }
        void save()
    }

    const handleBulkImport = (newSurfaces: Surface[]) => {
        setDocument({
            ...doc,
            surfaces: [...doc.surfaces, ...newSurfaces],
        })
        // Switch to the first newly added page
        setCurrentPageIndex(doc.surfaces.length)
    }

    const handleAddBlankPage = () => {
        const newSurface: Surface = {
            id: `page-${generateUUID()}`,
            type: 'page',
            w: 210,
            h: 297,
            bg: '#ffffff',
            margin: { t: 0, r: 0, b: 0, l: 0 },
        }
        setDocument({
            ...doc,
            surfaces: [...doc.surfaces, newSurface],
        })
        setCurrentPageIndex(doc.surfaces.length)
    }

    const handleDeletePage = (index: number) => {
        if (doc.surfaces.length <= 1) return

        const surfaceToDelete = doc.surfaces[index].id
        const newSurfaces = doc.surfaces.filter((_, i) => i !== index)
        const newNodes = doc.nodes.filter(n => n.s !== surfaceToDelete)

        setDocument({
            ...doc,
            surfaces: newSurfaces,
            nodes: newNodes,
        })

        if (currentPageIndex >= newSurfaces.length) {
            setCurrentPageIndex(newSurfaces.length - 1)
        }
    }

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
            <EditorHeader
                templateName={templateName}
                onTemplateNameChange={setTemplateName}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
                onSave={handleSave}
                onShowShortcuts={() => setShowShortcuts(true)}
                onBack={onBack}
                i18nOverrides={EDITOR_TRANSLATIONS}
                orientation="portrait"
                onOrientationChange={() => { }}
                onDownloadImage={() => editorRef.current?.downloadImage()}
                onDownloadPdf={() => { }}
                hideDownloadButtons={true}
                endContent={
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors"
                    >
                        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                }
                loadMenu={
                    <DocumentLoadMenu
                        fetchRecent={fetchRecent}
                        fetchBrowse={fetchBrowse}
                        onLoad={handleLoad}
                    />
                }
            >
                <PageNavigator
                    currentPageIndex={currentPageIndex}
                    totalPages={doc.surfaces.length}
                    onPageChange={setCurrentPageIndex}
                    onAddPage={handleAddBlankPage}
                    onDeletePage={handleDeletePage}
                />
            </EditorHeader>

            <ShortcutHelpModal open={showShortcuts} onOpenChange={setShowShortcuts} />

            <div className="flex flex-1 overflow-hidden">
                <div className="w-16 border-r border-border bg-secondary shrink-0 flex flex-col z-10 shadow-[1px_0_3px_rgb(0,0,0,0.05)]">
                    <WysiwygEditorToolbar
                        zoom={zoom}
                        onZoomChange={setZoom}
                        templateDoc={doc}
                        onTemplateChange={setDocument}
                        onSelectElement={(id) => setSelectedElementId(id)}
                        currentPageId={currentPageId}
                        activeTool={activeTool}
                        onToolSelect={setActiveTool}
                        i18nOverrides={EDITOR_TRANSLATIONS}
                        editorType="manga"
                    />
                </div>

                <div className="flex-1 relative overflow-hidden bg-editor-canvas flex flex-col">
                    <div className="flex-1 min-h-0">
                        <ReportKonvaEditor
                            ref={editorRef}
                            templateDoc={doc}
                            zoom={zoom / 100}
                            selectedElementId={selectedElementId || undefined}
                            onElementSelect={(el) => setSelectedElementId(el?.id ?? null)}
                            onTemplateChange={setDocument}
                            currentPageId={currentPageId}
                            onUndo={canUndo ? undo : undefined}
                            onRedo={canRedo ? redo : undefined}
                            activeTool={activeTool}
                            drawingSettings={drawingSettings}
                            showGrid={showGrid}
                            gridSize={gridSize}
                            // @ts-expect-error - snapStrength might be missing in types
                            snapStrength={snapStrength}
                            onDrawingFinish={(tool: string) => {
                                if (tool === 'speech-bubble' || tool === 'signature') {
                                    setActiveTool('select')
                                }
                            }}
                        />
                    </div>
                </div>

                <div className="w-80 border-l border-border bg-secondary shrink-0 overflow-hidden flex flex-col z-10 shadow-[-1px_0_3px_rgb(0,0,0,0.05)]">
                    <WysiwygPropertiesPanel
                        templateDoc={doc}
                        selectedElementId={selectedElementId}
                        onTemplateChange={setDocument}
                        currentPageId={currentPageId}
                        selectedCell={null}
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
                        onBulkImport={handleBulkImport}
                        i18nOverrides={EDITOR_TRANSLATIONS}
                        editorType="manga"
                    />
                </div>
            </div>
        </div>
    )
}
