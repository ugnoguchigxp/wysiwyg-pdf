import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
    BedLayoutHeader,
    ShortcutHelpModal,
    BedLayoutEditor,
    BedToolbar,
    BedPropertyPanel,
    BedLayoutViewer,
    type Doc,
    type BedLayoutEditorHandle,
    type BedStatusData,
    useEditorHistoryDoc as useBedEditorHistoryDoc,
    DocumentLoadMenu,
} from 'wysiwyg-pdf'
import { EDITOR_TRANSLATIONS } from '../constants/translations'
import { useReactToPrint, type UseReactToPrintOptions } from 'react-to-print'
import { useTranslation } from 'react-i18next'
import { Moon, Sun, LayoutDashboard, Edit } from 'lucide-react'
import { saveDocument, listDocuments, getDocument } from '../api/documents'

// Initial State (Unified Doc)
const INITIAL_BED_DOC: Doc = {
    v: 1,
    id: 'bed-layout-1',
    title: 'New Bed Layout',
    unit: 'mm',
    surfaces: [
        { id: 'layout', type: 'canvas', w: 200, h: 300 },
    ],
    nodes: [],
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
    const [isDashboardMode, setIsDashboardMode] = useState(false)
    const [dashboardData, setDashboardData] = useState<Record<string, BedStatusData>>({})

    const [showGrid, setShowGrid] = useState(false)
    const [gridSize, setGridSize] = useState(15)
    const [snapStrength, setSnapStrength] = useState(5)

    // State for Bed Layout Document (Unified)
    const [bedDoc, setBedDocument] = useState<Doc>(INITIAL_BED_DOC)

    // Use a ref to always have the latest state for handleSave (avoid stale closures)
    const bedDocRef = useRef(bedDoc)
    useEffect(() => {
        bedDocRef.current = bedDoc
    }, [bedDoc])

    const normalizeNumber = (value: unknown) => {
        if (typeof value === 'number') return value
        if (typeof value === 'string') {
            const parsed = Number(value)
            return Number.isFinite(parsed) ? parsed : undefined
        }
        return undefined
    }

    const normalizeDoc = (raw: Doc) => {
        const surfaceId =
            raw.surfaces.find((s: Doc['surfaces'][number]) => s.type === 'canvas')?.id ||
            raw.surfaces[0]?.id ||
            'layout'

        return {
            ...raw,
            surfaces: raw.surfaces.map((surface) => ({
                ...surface,
                w: normalizeNumber(surface.w) ?? surface.w,
                h: normalizeNumber(surface.h) ?? surface.h,
            })),
            nodes: raw.nodes.map((node) => {
                if (node.t === 'line') {
                    return {
                        ...node,
                        s: node.s || surfaceId,
                        pts: Array.isArray(node.pts)
                            ? node.pts
                                .map((pt) => normalizeNumber(pt))
                                .filter((pt): pt is number => typeof pt === 'number')
                            : node.pts,
                    }
                }
                return {
                    ...node,
                    s: node.s || surfaceId,
                    x: normalizeNumber(node.x) ?? node.x,
                    y: normalizeNumber(node.y) ?? node.y,
                    w: normalizeNumber(node.w) ?? node.w,
                    h: normalizeNumber(node.h) ?? node.h,
                    r: normalizeNumber(node.r) ?? node.r,
                    opacity: normalizeNumber(node.opacity) ?? node.opacity,
                }
            }),
        }
    }

    // History Management
    const {
        execute: executeBedOp,
        undo: undoBed,
        redo: redoBed,
        canUndo: canUndoBed,
        canRedo: canRedoBed,
    } = useBedEditorHistoryDoc(bedDoc, setBedDocument)

    // Derived orientation from document
    useEffect(() => {
        const surface = bedDoc.surfaces.find((s: Doc['surfaces'][number]) => s.type === 'canvas') ?? bedDoc.surfaces[0]
        if (!surface) return

        if (surface.w > surface.h) {
            if (orientation !== 'landscape') setOrientation('landscape')
        } else if (surface.w === surface.h) {
            if (orientation !== 'square') setOrientation('square')
        } else {
            if (orientation !== 'portrait') setOrientation('portrait')
        }
    }, [bedDoc.surfaces])

    // Handle manual orientation change
    const prevOrientation = useRef(orientation)
    useEffect(() => {
        if (prevOrientation.current === orientation) return
        prevOrientation.current = orientation

        setBedDocument((prev: Doc) => {
            const surface = prev.surfaces.find((s: Doc['surfaces'][number]) => s.type === 'canvas') ?? prev.surfaces[0]
            if (!surface) return prev

            let w = 200
            let h = 300

            if (orientation === 'landscape') {
                w = 300
                h = 200
            } else if (orientation === 'square') {
                w = 200
                h = 200
            }

            if (surface.w === w && surface.h === h) return prev

            return {
                ...prev,
                surfaces: prev.surfaces.map((s: Doc['surfaces'][number]) =>
                    s.id === surface.id ? { ...s, w, h } : s
                ),
            }
        })
    }, [orientation])

    // Generate Mock Dashboard Data
    useEffect(() => {
        if (isDashboardMode) {
            const data: Record<string, BedStatusData> = {}
            const resolvedSurfaceId = bedDoc.surfaces.find((s: Doc['surfaces'][number]) => s.type === 'canvas')?.id || bedDoc.surfaces[0]?.id || 'layout'
            const bedIds = bedDoc.nodes
                .filter((n: Doc['nodes'][number]) => n.s === resolvedSurfaceId)
                .filter((n: Doc['nodes'][number]) => n.t === 'widget' && (n as any).widget === 'bed')
                .map((n: Doc['nodes'][number]) => n.id)

            const patientNames = ['T. Yamada', 'H. Suzuki', 'K. Sato', 'M. Tanaka', 'Y. Kobayashi', 'J. Doe', 'A. Smith']

            bedIds.forEach((id: string, index: number) => {
                // Random status
                const rand = Math.random()
                let status: BedStatusData['status'] = 'free'
                const alerts: string[] = []

                if (rand > 0.8) {
                    status = 'occupied'
                    alerts.push('High BP', 'Tachycardia')
                } else if (rand > 0.6) {
                    status = 'occupied'
                    alerts.push('Check IV')
                } else if (rand > 0.3) {
                    status = 'occupied'
                }

                data[id] = {
                    bedId: `b${index + 1}`,
                    status,
                    alerts,
                    patientName: status !== 'free' ? patientNames[index % patientNames.length] : undefined,
                    vitals: status !== 'free' ? {
                        bp: {
                            systolic: 120 + Math.floor(Math.random() * 40),
                            diastolic: 80 + Math.floor(Math.random() * 20),
                        },
                        hr: 60 + Math.floor(Math.random() * 40),
                    } : undefined,
                    isOccupied: status !== 'free',
                }
            })
            setDashboardData(data)
        }
    }, [isDashboardMode, bedDoc])

    // Refs
    const bedEditorRef = useRef<BedLayoutEditorHandle>(null)
    const printRef = useRef<HTMLDivElement>(null)

    // Toggle Dark Mode
    useEffect(() => {
        const theme = darkMode ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.classList.toggle('dark', darkMode)
    }, [darkMode])

    const handleDownloadImage = () => {
        bedEditorRef.current?.downloadImage()
    }

    const handleSave = () => {
        const save = async (force = false) => {
            const currentDoc = bedDocRef.current
            console.log('[BedLayoutEditorPage] handleSave called. Latest bedDocRef:', {
                title: templateName,
                nodesCount: currentDoc.nodes.length,
                beds: currentDoc.nodes.filter(n => n.t === 'widget' && (n as any).widget === 'bed').map(n => ({ id: n.id, x: n.x, y: n.y })),
                firstSurface: currentDoc.surfaces[0]
            })
            try {
                const trimmedTitle = templateName.trim() || 'Untitled'
                if (trimmedTitle !== templateName) {
                    setTemplateName(trimmedTitle)
                }

                const result = await saveDocument({
                    user: 'anonymous',
                    type: 'bed-layout',
                    title: trimmedTitle,
                    payload: currentDoc,
                    force,
                })

                if (result.status === 'exists' && !force) {
                    const confirmed = window.confirm('同名の保存データがあります。上書きしますか？')
                    if (!confirmed) return
                    await save(true) // Call save again with force: true
                    return
                }

                alert(t('editor_save_success') || 'Saved!')
            } catch (error) {
                console.error('[BedLayoutEditorPage] Error during save:', error)
                alert('Error during save. See console.')
            }
        }

        void save()
    }

    const fetchRecent = useCallback(async () => {
        const response = await listDocuments({ user: 'anonymous', type: 'bed-layout', limit: 5 })
        return response.items
    }, [])

    const fetchBrowse = useCallback(
        async (query: string, offset: number) => {
            const response = await listDocuments({
                user: 'anonymous',
                type: 'bed-layout',
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
        if (detail.payload) {
            const loadedDoc = normalizeDoc(detail.payload as Doc)
            console.log('[BedLayoutEditorPage] loadDocument success. Normalized doc beds:',
                loadedDoc.nodes.filter(n => n.t === 'widget' && (n as any).widget === 'bed').map(n => ({ id: n.id, x: n.x, y: n.y }))
            )
            setBedDocument(loadedDoc)
            setTemplateName(detail.title)
        }
        setSelectedElementId(null)
    }, [])

    // Print Logic (stubbed for now or reuse existing hidden print layout if compatible)
    const reactToPrintFn = useReactToPrint({
        contentRef: printRef, // We might need a BedPrintLayout later
        documentTitle: templateName,
    } as UseReactToPrintOptions)

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
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
                i18nOverrides={EDITOR_TRANSLATIONS}
            >
                <DocumentLoadMenu
                    fetchRecent={fetchRecent}
                    fetchBrowse={fetchBrowse}
                    onLoad={handleLoad}
                />
                <button
                    onClick={() => setIsDashboardMode(!isDashboardMode)}
                    className={`p-2 rounded-md hover:bg-accent transition-colors flex items-center gap-2 ${isDashboardMode ? 'text-blue-500 bg-blue-100 dark:bg-blue-900' : 'text-muted-foreground'}`}
                    title={isDashboardMode ? "Switch to Editor" : "Switch to Dashboard"}
                >
                    {isDashboardMode ? <Edit className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
                </button>

                <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="p-2 rounded-md hover:bg-accent text-muted-foreground transition-colors"
                >
                    {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
            </BedLayoutHeader>

            <ShortcutHelpModal open={showShortcuts} onOpenChange={setShowShortcuts} />

            {/* Print Ref (Placeholder) */}
            <div style={{ display: 'none' }}>
                <div ref={printRef}>
                    <BedLayoutViewer
                        document={bedDoc}
                        dashboardData={dashboardData}
                        zoom={1.0} // Print usually 1.0 or fit
                    />
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {!isDashboardMode && (
                    <div className="w-16 border-r border-border bg-secondary shrink-0 flex flex-col z-10 shadow-[1px_0_3px_rgb(0,0,0,0.05)]">
                        <BedToolbar
                            activeTool={activeTool as any}
                            document={bedDoc}
                            onAddElement={(element) => {
                                executeBedOp({
                                    kind: 'create-element',
                                    element,
                                })
                            }}
                            onSelectElement={(id) => setSelectedElementId(id)}
                            onToolSelect={(tool) => setActiveTool(tool)}
                            canUndo={canUndoBed}
                            canRedo={canRedoBed}
                            onUndo={undoBed}
                            onRedo={redoBed}
                            zoom={zoom / 100}
                            onZoomIn={() => setZoom(Math.min(zoom + 25, 200))}
                            onZoomOut={() => setZoom(Math.max(zoom - 25, 25))}
                            surfaceId={bedDoc.surfaces.find((s: Doc['surfaces'][number]) => s.type === 'canvas')?.id || bedDoc.surfaces[0]?.id || 'layout'}
                            i18nOverrides={{
                                toolbar_text: 'テキスト',
                                toolbar_bed: 'ベッド',
                                toolbar_copy: 'コピー',
                                toolbar_paste: '貼り付け',
                            }}
                            onCopy={() => bedEditorRef.current?.copy()}
                            onPaste={() => bedEditorRef.current?.paste()}
                        />
                    </div>
                )}

                {/* Center Canvas */}
                <div className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                    {isDashboardMode ? (
                        <BedLayoutViewer
                            document={bedDoc}
                            dashboardData={dashboardData}
                            zoom={zoom / 100}
                        />
                    ) : (
                        <BedLayoutEditor
                            ref={bedEditorRef}
                            document={bedDoc}
                            zoom={zoom / 100}
                            selection={selectedElementId ? [selectedElementId] : []}
                            onSelect={(ids) => setSelectedElementId(ids[0] || null)}
                            onChangeElement={(updates) => {
                                const list = Array.isArray(updates) ? updates : [updates]
                                if (list.length === 0) return

                                // With the improved functional executeBedOp, we can now safely loop
                                // and commit each update. Each update will be correctly batched.
                                list.forEach(u => {
                                    if (!u.id) return
                                    const element = bedDoc.nodes.find((n: any) => n.id === u.id)
                                    if (!element) return
                                    executeBedOp({
                                        kind: 'update-element',
                                        id: u.id,
                                        prev: element,
                                        next: u,
                                    })
                                })
                            }}
                            onDelete={(id) => {
                                const element = bedDoc.nodes.find((n: Doc['nodes'][number]) => n.id === id)
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
                            showGrid={showGrid}
                            gridSize={gridSize}
                            snapStrength={snapStrength}
                            onCreateNodes={(nodes) => {
                                nodes.forEach((element) => {
                                    executeBedOp({
                                        kind: 'create-element',
                                        element,
                                    })
                                })
                                if (nodes.length > 0) {
                                    setSelectedElementId(nodes[nodes.length - 1].id)
                                }
                            }}
                        />
                    )}
                </div>

                {/* Right Properties Panel */}
                {!isDashboardMode && (
                    <div className="w-72 border-l border-border bg-secondary shrink-0 overflow-hidden flex flex-col z-10 shadow-[-1px_0_3px_rgb(0,0,0,0.05)]">
                        <BedPropertyPanel
                            selectedElement={
                                selectedElementId
                                    ? (bedDoc.nodes.find((n: Doc['nodes'][number]) => n.id === selectedElementId) ?? null)
                                    : null
                            }
                            onChange={(id, attrs, options) => {
                                const element = bedDoc.nodes.find((n: Doc['nodes'][number]) => n.id === id)
                                if (!element) return
                                executeBedOp({
                                    kind: 'update-element',
                                    id,
                                    prev: element,
                                    next: attrs,
                                }, options)
                            }}
                            onDelete={(id) => {
                                const element = bedDoc.nodes.find((n: Doc['nodes'][number]) => n.id === id)
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
                            surfaceId={bedDoc.surfaces.find((s: Doc['surfaces'][number]) => s.type === 'canvas')?.id || bedDoc.surfaces[0]?.id || 'layout'}
                            showGrid={showGrid}
                            onShowGridChange={setShowGrid}
                            gridSize={gridSize}
                            onGridSizeChange={setGridSize}
                            snapStrength={snapStrength}
                            onSnapStrengthChange={setSnapStrength}
                            i18nOverrides={{
                                properties_bed_info: 'ベッド情報',
                                properties_label: 'ラベル',
                            }}
                        />
                    </div>
                )}
            </div>
        </div>
    )
}
