import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react'
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
    Modal,
    useQueue,
    type DocumentSummary,
    resolveBindingData,
} from 'wysiwyg-pdf'
import { useReactToPrint, type UseReactToPrintOptions } from 'react-to-print'
import { useTranslation } from 'react-i18next'
import { Moon, Sun, Printer, FileSpreadsheet, Image as ImageIcon, Loader2 } from 'lucide-react'
import { EDITOR_TRANSLATIONS } from '../constants/translations'
import { saveDocument, listDocuments, getDocument, importExcel } from '../api/documents'
import { uploadDocAssets } from '../utils/upload-helper'

// Mapper to convert ID-based data to Label-based data
const mapDataToLabels = (data: Record<string, any[]>, schema: IDataSchema) => {
    const result: Record<string, any[]> = {}
    schema.categories.forEach(cat => {
        const catData = data[cat.id] || []
        const labelRecords = catData.map(record => {
            const mapped: Record<string, any> = {}
            cat.fields.forEach(field => {
                if (record[field.id] !== undefined) {
                    mapped[field.label] = record[field.id]
                }
            })
            return mapped
        })
        result[cat.label] = labelRecords
    })
    Object.keys(data).forEach(key => {
        if (!result[key]) result[key] = data[key]
    })
    return result
}

// Strictly matched schema following Excel template labels
const MOCK_SCHEMA: IDataSchema = {
    id: 'dialysis-v1',
    version: '1.0.1',
    locale: 'ja-JP',
    categories: [
        {
            id: '医師指示情報',
            label: '医師指示情報',
            isRepeater: false,
            fields: [
                { id: 'drInstructionSeq', label: '医師指示シーケンス', type: 'string' },
                { id: 'patientNo', label: '患者番号', type: 'string' },
                { id: 'patientName', label: '患者名', type: 'string' },
                { id: 'instructionDate', label: '指示日', type: 'string' },
                { id: 'instructionContents', label: '指示内容', type: 'string' },
            ],
        },
        {
            id: '透析条件情報',
            label: '透析条件情報',
            isRepeater: false,
            fields: [
                { id: 'dialysisDate', label: '透析日', type: 'date' },
                { id: 'patientName', label: '患者名（漢字）', type: 'string' }, // Updated to match exactly
                { id: 'gender', label: '性別', type: 'string' },
                { id: 'karteNo', label: 'カルテ番号', type: 'string' },
                { id: 'dialyzerName', label: 'ダイアライザ名称', type: 'string' }, 
                { id: 'dw', label: 'ＤＷ', type: 'string' },
                { id: 'prevWeight', label: '前回体重', type: 'string' },
                { id: 'dialysisTime', label: '透析時間', type: 'string' },
                { id: 'prevPostWeight', label: '前回後体重', type: 'string' },
                { id: 'preWeight', label: '前体重', type: 'string' },
                { id: 'preWeight', label: '透析前体重', type: 'string' },
                { id: 'postWeight', label: '透析後体重', type: 'string' }, // Matched from screenshot
                { id: 'postWeight', label: '後体重', type: 'string' }, // Fallback
                { id: 'anticoagulantName', label: '抗凝固剤名称', type: 'string' }, // Matched
                { id: 'anticoagulantInitial', label: '初回量', type: 'string' },
                { id: 'anticoagulantContinuous', label: '持続量', type: 'string' },
                { id: 'targetUfw', label: '目標除水量', type: 'string' },
                { id: 'staffName1', label: '担当者名1', type: 'string' }, // Fixed to match template
                { id: 'staffName2', label: '担当者名2', type: 'string' },
                { id: 'staffName3', label: '担当者名3', type: 'string' },
                { id: 'memo1', label: '備考1', type: 'string' },
                { id: 'memo2', label: '備考2', type: 'string' },
            ],
        },
        {
            id: '装置情報',
            label: '装置情報',
            isRepeater: true,
            fields: [
                { id: 'measureTime', label: '測定時刻', type: 'string' },
                { id: 'bloodFlow', label: '血液流量', type: 'string' },
                { id: 'venousPressure', label: '静脈圧', type: 'string' },
                { id: 'dialysatePressure', label: '透析液圧', type: 'string' },
                { id: 'ufRate', label: '除水速度', type: 'string' },
                { id: 'currentUfAmount', label: '現在除水量', type: 'string' },
                { id: 'anticoagulantTotal', label: '抗凝固剤積算量', type: 'string' },
            ],
        },
        {
            id: '酸素情報',
            label: '酸素情報',
            isRepeater: false,
            fields: [
                { id: 'oxygenAmount', label: '酸素量', type: 'string' },
                { id: 'startTime', label: '酸素開始時刻', type: 'string' },
                { id: 'endTime', label: '酸素終了時刻', type: 'string' },
                { id: 'totalTime', label: '酸素合計時間', type: 'string' },
            ],
        },
        {
            id: '薬剤・材料・処置情報',
            label: '薬剤・材料・処置情報',
            isRepeater: true,
            fields: [
                { id: 'medicineName', label: '薬剤名', type: 'string' },
            ],
        },
        {
            id: '処置コメント情報',
            label: '処置コメント情報',
            isRepeater: true,
            fields: [
                { id: 'comment', label: 'コメント', type: 'string' },
            ],
        },
    ],
}

const INITIAL_DOC: Doc = {
    v: 1,
    id: 'doc-1',
    title: 'New Template',
    unit: 'mm',
    surfaces: [{ id: 'page-1', type: 'page', w: 210, h: 297, bg: '#ffffff', margin: { t: 0, r: 0, b: 0, l: 0 } }],
    nodes: [],
}

interface ReportEditorPageProps {
    onBack: () => void
    initialDocId?: string
}

export const ReportEditorPage: React.FC<ReportEditorPageProps> = ({ onBack, initialDocId }) => {
    const { t } = useTranslation()
    const [templateName, setTemplateName] = useState('New Template')
    const [zoom, setZoom] = useState(100)
    const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
    const [darkMode, setDarkMode] = useState(false)
    const [selectedElementId, setSelectedElementId] = useState<string | null>(null)
    const [selectedCell, setSelectedCell] = useState<{ elementId: string; row: number; col: number } | null>(null)
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false)
    const [fitScale, setFitScale] = useState(1)
    const [manualScale, setManualScale] = useState<number | null>(null)
    const [previewModalSize, setPreviewModalSize] = useState({ width: 760, height: 1040 })
    const [activeTool, setActiveTool] = useState<string>('select')
    const [drawingSettings, setDrawingSettings] = useState<{ stroke: string; strokeWidth: number; tolerance?: number }>({ stroke: '#000000', strokeWidth: 0.2, tolerance: 2.0 })
    const [showGrid, setShowGrid] = useState(false)
    const [gridSize, setGridSize] = useState(15)
    const [snapStrength, setSnapStrength] = useState(5)
    const [previewData, setPreviewData] = useState<Record<string, any[]> | null>(null)
    const [previewSourceDoc, setPreviewSourceDoc] = useState<Doc | null>(null)
    const [isExcelImporting, setIsExcelImporting] = useState(false)
    const { addTask } = useQueue()
    const [presets, setPresets] = useState<DocumentSummary[]>([])

    const loadPresets = useCallback(async () => {
        try {
            const response = await listDocuments({ user: 'anonymous', type: 'report', limit: 50 })
            const templates = response.items.filter(doc => doc.title === '医師指示テンプレート' || doc.title === '透析記録テンプレート')
            setPresets(templates)
        } catch (e) { console.error(e) }
    }, [])

    useEffect(() => { loadPresets() }, [loadPresets])

    useEffect(() => {
        const loadPreviewData = async () => {
            try {
                const resp = await fetch('http://localhost:8000/api/preview-data')
                if (resp.ok) setPreviewData(await resp.json())
            } catch (e) { console.error(e) }
        }
        void loadPreviewData()
    }, [])

    const { document: doc, setDocument, reset, undo, redo, canUndo, canRedo } = useReportHistory(INITIAL_DOC)
    const editorRef = useRef<ReportKonvaEditorHandle>(null)
    const printRef = useRef<HTMLDivElement>(null)
    const excelFileInputRef = useRef<HTMLInputElement>(null)

    const sourceDoc = previewSourceDoc ?? doc

    const resolvedDoc = useMemo(() => {
        if (!previewData) return sourceDoc
        const labelMappedData = mapDataToLabels(previewData, MOCK_SCHEMA)
        return resolveBindingData(sourceDoc, labelMappedData)
    }, [sourceDoc, previewData])
    const previewDoc = useMemo(() => {
        const firstSurface = resolvedDoc.surfaces[0]
        if (!firstSurface) return resolvedDoc
        return {
            ...resolvedDoc,
            surfaces: [firstSurface],
            nodes: resolvedDoc.nodes.filter((node) => node.s === firstSurface.id),
        }
    }, [resolvedDoc])

    useEffect(() => {
        const theme = darkMode ? 'dark' : 'light'
        document.documentElement.setAttribute('data-theme', theme)
        document.documentElement.classList.toggle('dark', darkMode)
    }, [darkMode])

    const reactToPrintFn = useReactToPrint({ contentRef: printRef, documentTitle: templateName, pageStyle: `@page { size: A4 ${orientation}; margin: 0; }` } as UseReactToPrintOptions)

    const handleDownloadPreviewImage = useCallback(async () => {
        const page = printRef.current?.querySelector('.print-page') as HTMLElement | null
        if (!page) {
            alert('プレビュー画像を生成できませんでした。')
            return
        }

        try {
            if ('fonts' in document) {
                await (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready
            }

            const width = Math.max(1, Math.ceil(page.scrollWidth))
            const height = Math.max(1, Math.ceil(page.scrollHeight))
            const clone = page.cloneNode(true) as HTMLElement
            clone.style.margin = '0'

            const serialized = new XMLSerializer().serializeToString(clone)
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;">${serialized}</div></foreignObject></svg>`

            const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
            const url = URL.createObjectURL(blob)

            try {
                const image = await new Promise<HTMLImageElement>((resolve, reject) => {
                    const img = new Image()
                    img.onload = () => resolve(img)
                    img.onerror = () => reject(new Error('image load failed'))
                    img.src = url
                })

                const scale = 2
                const canvas = document.createElement('canvas')
                canvas.width = width * scale
                canvas.height = height * scale
                const ctx = canvas.getContext('2d')
                if (!ctx) throw new Error('canvas context unavailable')
                ctx.setTransform(scale, 0, 0, scale, 0, 0)
                ctx.drawImage(image, 0, 0, width, height)

                const safeTitle = (templateName.trim() || 'report').replace(/[\\/:*?"<>|]+/g, '_')
                const link = document.createElement('a')
                link.download = `${safeTitle}-${Date.now()}.png`
                link.href = canvas.toDataURL('image/png')
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
            } finally {
                URL.revokeObjectURL(url)
            }
        } catch (error) {
            console.error('Failed to export preview image', error)
            alert('画像保存に失敗しました。')
        }
    }, [templateName])

    const fetchRecent = useCallback(async () => { loadPresets(); const r = await listDocuments({ user: 'anonymous', type: 'report', limit: 10 }); return r.items }, [loadPresets])
    const fetchBrowse = useCallback(async (q: string, o: number) => { const r = await listDocuments({ user: 'anonymous', type: 'report', q: q || undefined, limit: 20, offset: o }); return { items: r.items, hasMore: r.items.length === 20 } }, [])

    const loadDocumentById = useCallback(async (id: string) => {
        try {
            const detail = await getDocument(id, 'anonymous')
            if (detail.payload) {
                reset(detail.payload as Doc)
                setTemplateName(detail.title)
                setSelectedElementId(null)
                setSelectedCell(null)
                return true
            }
            return false
        } catch (e) {
            console.error(e)
            return false
        }
    }, [reset])

    const handleLoad = useCallback(async (id: string) => {
        await loadDocumentById(id)
    }, [loadDocumentById])

    useEffect(() => { if (initialDocId) void handleLoad(initialDocId) }, [initialDocId, handleLoad])

    const handleOpenExcelImport = useCallback(() => {
        if (isExcelImporting) return
        excelFileInputRef.current?.click()
    }, [isExcelImporting])

    const handleExcelFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return

        if (!file.name.match(/\.(xlsx|xls|xlsm)$/i)) {
            alert('Excelファイル（.xlsx / .xls / .xlsm）を選択してください。')
            return
        }

        setIsExcelImporting(true)
        try {
            const result = await importExcel(file)
            const loaded = await loadDocumentById(result.id)
            if (!loaded) throw new Error('Failed to load imported document')
            await loadPresets()
            alert('Excelを取り込みました。')
        } catch (error) {
            console.error('Excel import failed', error)
            alert('Excelの取り込みに失敗しました。')
        } finally {
            setIsExcelImporting(false)
        }
    }, [loadDocumentById, loadPresets])

    const handleSave = () => {
        const save = async () => {
            try {
                const updatedDoc = editorRef.current?.flushSignature() || doc
                const trimmedTitle = templateName.trim() || 'Untitled'
                if (trimmedTitle !== templateName) setTemplateName(trimmedTitle)
                const docWithAssets = await uploadDocAssets(updatedDoc, addTask)
                const result = await saveDocument({ user: 'anonymous', type: 'report', title: trimmedTitle, payload: docWithAssets })
                if (result.status === 'exists' && window.confirm('上書きしますか？')) {
                    await saveDocument({ user: 'anonymous', type: 'report', title: trimmedTitle, payload: docWithAssets, force: true })
                }
                alert(t('editor_save_success') || 'Saved!')
            } catch (e) { console.error(e); alert('Fatal error during save.') }
        }
        void save()
    }

    const handlePrint = useCallback(() => {
        reactToPrintFn()
    }, [reactToPrintFn])

    const handleOpenPrintPreview = useCallback(() => {
        const flushedDoc = editorRef.current?.flushSignature()
        setPreviewSourceDoc(flushedDoc || doc)
        setManualScale(null)
        setIsPrintPreviewOpen(true)
    }, [doc])

    const previewPageSizeMm = useMemo(
        () => (orientation === 'landscape' ? { width: 297, height: 210 } : { width: 210, height: 297 }),
        [orientation]
    )
    const MM_TO_PX = 96 / 25.4

    const updatePreviewLayout = useCallback(() => {
        if (typeof window === 'undefined') return

        const pageWidthPx = previewPageSizeMm.width * MM_TO_PX
        const pageHeightPx = previewPageSizeMm.height * MM_TO_PX
        const viewportMargin = 24
        const headerHeight = 52
        const canvasPadding = 8
        const minModalWidth = 420

        const maxModalWidth = Math.max(320, window.innerWidth - viewportMargin * 2)
        const maxModalHeight = Math.max(320, window.innerHeight - viewportMargin * 2)
        const availableCanvasWidth = Math.max(120, maxModalWidth - canvasPadding * 2)
        const availableCanvasHeight = Math.max(120, maxModalHeight - headerHeight - canvasPadding * 2)

        const nextFitScale = Math.min(
            availableCanvasWidth / pageWidthPx,
            availableCanvasHeight / pageHeightPx,
            1
        )
        const safeFitScale = Math.max(0.15, nextFitScale)
        const previewWidthPx = Math.round(pageWidthPx * safeFitScale)
        const previewHeightPx = Math.round(pageHeightPx * safeFitScale)

        const modalWidth = Math.min(
            maxModalWidth,
            Math.max(minModalWidth, previewWidthPx + canvasPadding * 2)
        )
        const modalHeight = Math.min(
            maxModalHeight,
            previewHeightPx + headerHeight + canvasPadding * 2
        )

        setFitScale((prev) => (Math.abs(prev - safeFitScale) < 0.001 ? prev : safeFitScale))
        setPreviewModalSize({
            width: Math.round(modalWidth),
            height: Math.round(modalHeight),
        })
    }, [previewPageSizeMm.height, previewPageSizeMm.width])

    useEffect(() => {
        if (!isPrintPreviewOpen) return
        updatePreviewLayout()
        window.addEventListener('resize', updatePreviewLayout)
        return () => {
            window.removeEventListener('resize', updatePreviewLayout)
        }
    }, [isPrintPreviewOpen, updatePreviewLayout])

    const handlePreviewClick = useCallback(() => {
        setManualScale((prev) => {
            if (prev === null) {
                const next = Math.min(2.5, Math.max(1, fitScale * 1.8))
                return next
            }
            return null
        })
    }, [fitScale])

    const previewScale = manualScale ?? fitScale
    const previewPageWidthPx = previewPageSizeMm.width * MM_TO_PX
    const previewPageHeightPx = previewPageSizeMm.height * MM_TO_PX

    return (
        <div className="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground transition-colors duration-200">
            <EditorHeader templateName={templateName} onTemplateNameChange={setTemplateName} orientation={orientation} onOrientationChange={setOrientation} canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} onDownloadImage={() => { }} hideDownloadButtons={true} onDownloadPdf={handleOpenPrintPreview} onSave={handleSave} onShowShortcuts={() => setShowShortcuts(true)} onBack={onBack} i18nOverrides={EDITOR_TRANSLATIONS} loadMenu={<DocumentLoadMenu fetchRecent={fetchRecent} fetchBrowse={fetchBrowse} onLoad={handleLoad} presets={presets} />}>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleOpenExcelImport}
                        disabled={isExcelImporting}
                        className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {isExcelImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                        {isExcelImporting ? '取込中...' : 'Excel取込'}
                    </button>
                    <input
                        ref={excelFileInputRef}
                        type="file"
                        className="hidden"
                        accept=".xlsx,.xls,.xlsm"
                        onChange={handleExcelFileSelect}
                    />
                    <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-md hover:bg-accent text-muted-foreground">
                        {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                    </button>
                </div>
            </EditorHeader>
            <ShortcutHelpModal open={showShortcuts} onOpenChange={setShowShortcuts} />

            <Modal
                open={isPrintPreviewOpen}
                onOpenChange={(open) => {
                    setIsPrintPreviewOpen(open)
                    if (!open) {
                        setPreviewSourceDoc(null)
                        setManualScale(null)
                    }
                }}
                draggable={false}
                noPadding
                className="sm:!max-w-none sm:!max-h-none"
                contentStyle={{ width: `${previewModalSize.width}px`, height: `${previewModalSize.height}px` }}
                contentClassName="p-0 !overflow-hidden !overflow-y-hidden !overflow-x-hidden !flex !flex-col"
                headerActions={
                    <div className="inline-flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDownloadPreviewImage}
                            className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
                        >
                            <ImageIcon className="w-4 h-4" />
                            画像保存
                        </button>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            <Printer className="w-4 h-4" />
                            印刷 / PDF保存
                        </button>
                    </div>
                }
            >
                <style>{`.print-preview-fit .print-page{margin-bottom:0 !important;box-shadow:none !important;}`}</style>
                <div
                    className={`flex-1 min-h-0 min-w-0 bg-editor-canvas p-2 ${manualScale === null ? 'overflow-hidden cursor-zoom-in' : 'overflow-auto cursor-zoom-out'}`}
                    onClick={handlePreviewClick}
                >
                    <div className={`flex h-full w-full ${manualScale === null ? 'items-center justify-center' : 'items-start justify-center'}`}>
                        <div
                            style={
                                {
                                    width: previewPageWidthPx * previewScale,
                                    height: previewPageHeightPx * previewScale,
                                }
                            }
                        >
                            <div className="print-preview-fit" style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left' }}>
                                <PrintLayout doc={previewDoc} orientation={orientation} />
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>
            <div style={{ position: 'fixed', left: '-100000px', top: 0, pointerEvents: 'none' }} aria-hidden="true">
                <PrintLayout ref={printRef} doc={resolvedDoc} orientation={orientation} />
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-16 border-r border-border bg-secondary shrink-0 flex flex-col z-10 shadow-[1px_0_3px_rgb(0,0,0,0.05)]">
                    <WysiwygEditorToolbar zoom={zoom} onZoomChange={setZoom} templateDoc={doc} onTemplateChange={setDocument} onSelectElement={(id) => setSelectedElementId(id)} currentPageId={doc.surfaces[0]?.id} activeTool={activeTool} onToolSelect={setActiveTool} i18nOverrides={EDITOR_TRANSLATIONS} />
                </div>
                <div className="flex-1 relative overflow-hidden bg-editor-canvas">
                    <ReportKonvaEditor ref={editorRef} templateDoc={doc} zoom={zoom / 100} selectedElementId={selectedElementId || undefined} onElementSelect={(el) => { if (activeTool !== 'signature') setSelectedElementId(el?.id ?? null) }} onTemplateChange={setDocument} currentPageId={doc.surfaces[0]?.id} onSelectedCellChange={setSelectedCell} onUndo={canUndo ? undo : undefined} onRedo={canRedo ? redo : undefined} orientation={orientation} activeTool={activeTool} drawingSettings={drawingSettings} showGrid={showGrid} gridSize={gridSize} />
                </div>
                <div className="w-72 border-l border-border bg-secondary shrink-0 overflow-hidden flex flex-col z-10 shadow-[-1px_0_3px_rgb(0,0,0,0.05)]">
                    <WysiwygPropertiesPanel templateDoc={doc} selectedElementId={selectedElementId} onTemplateChange={setDocument} currentPageId={doc.surfaces[0]?.id} selectedCell={selectedCell} schema={MOCK_SCHEMA} activeTool={activeTool} onToolSelect={setActiveTool} drawingSettings={drawingSettings} onDrawingSettingsChange={setDrawingSettings} showGrid={showGrid} onShowGridChange={setShowGrid} gridSize={gridSize} onGridSizeChange={setGridSize} snapStrength={snapStrength} onSnapStrengthChange={setSnapStrength} i18nOverrides={EDITOR_TRANSLATIONS} />
                </div>
            </div>
        </div>
    )
}
