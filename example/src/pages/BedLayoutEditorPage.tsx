import React, { useRef, useState, useEffect } from 'react'
import {
    BedLayoutHeader,
    ShortcutHelpModal,
    BedLayoutEditor,
    BedToolbar,
    BedPropertyPanel,
    BedLayoutViewer,
    type BedLayoutDocument,
    type BedLayoutEditorHandle,
    type BedStatusData,
    useEditorHistory as useBedEditorHistory,
} from 'wysiwyg-pdf'
import { useReactToPrint, type UseReactToPrintOptions } from 'react-to-print'
import { useTranslation } from 'react-i18next'
import { Moon, Sun, LayoutDashboard, Edit } from 'lucide-react'

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
    const [isDashboardMode, setIsDashboardMode] = useState(false)
    const [dashboardData, setDashboardData] = useState<Record<string, BedStatusData>>({})

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

    // Generate Mock Dashboard Data
    useEffect(() => {
        if (isDashboardMode) {
            const data: Record<string, BedStatusData> = {}
            const bedIds = bedDoc.elementOrder.filter(id => {
                const el = bedDoc.elementsById[id]
                return el?.t === 'widget' && (el as any).widget === 'bed'
            })

            const patientNames = ['T. Yamada', 'H. Suzuki', 'K. Sato', 'M. Tanaka', 'Y. Kobayashi', 'J. Doe', 'A. Smith']

            bedIds.forEach((id, index) => {
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
                t: 'text',
                s: 'layout',
                r: 0,
                text: 'Text',
                font: 'Meiryo',
                fontSize: 12,
                fontWeight: 400,
                fill: '#000000',
                align: 'l',
                x: center.x,
                y: center.y,
                w: 100,
                h: 20
            }
        } else if (tool === 'image') {
            newElement = {
                id: newId,
                t: 'image',
                s: 'layout',
                r: 0,
                name: 'Image',
                x: center.x,
                y: center.y,
                w: 120,
                h: 80,
                src: '', // ImageNode requires src
                opacity: 1,
            }
        } else if (tool === 'bed') {
            newElement = {
                id: newId,
                t: 'widget',
                widget: 'bed',
                s: 'layout',
                x: center.x,
                y: center.y,
                w: 50,
                h: 100,
                r: 0,
                name: 'Bed',
                data: { bedType: 'standard' },
                opacity: 1,
            }
        } else if (tool === 'shape' && subType) {
            newElement = {
                id: newId,
                t: 'shape',
                s: 'layout',
                shape: subType.toLowerCase() as any, // Rect -> rect
                x: center.x,
                y: center.y,
                w: 100,
                h: 100,
                r: 0,
                fill: '#cccccc',
                stroke: '#000000',
                strokeW: 1
            }
        } else if (tool === 'line') {
            newElement = {
                id: newId,
                t: 'line',
                s: 'layout',
                pts: [60, 340, 220, 340],
                stroke: '#000000',
                strokeW: 1,
                arrows: ['none', 'none']
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
        console.log(bedDoc)
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
                i18nOverrides={{
                    // Header
                    editor_orientation: '部屋形状',
                    orientations_portrait: '縦長方形',
                    orientations_landscape: '横長方形',
                    orientations_square: '正四角形',
                    save: '保存',
                    back: '戻る',
                    header_image: '画像保存',
                    header_pdf: 'PDF保存',
                    toolbar_undo: '元に戻す',
                    toolbar_redo: 'やり直す',
                    toolbar_shortcuts: 'ショートカット',

                    // Toolbar
                    toolbar_text: '文字',
                    toolbar_image: '画像',
                    toolbar_bed: 'ベッド',
                    toolbar_wall: '壁',
                    toolbar_shape: '図形',
                    shape_trapezoid: '台形',
                    toolbar_zoom_in: '拡大',
                    toolbar_zoom_out: '縮小',
                    toolbar_zoom_reset: 'リセット',

                    // Properties Panel
                    loading: '読み込み中',
                    no_image: '画像なし',
                    properties_layout: 'レイアウト',
                    properties_width: '幅',
                    properties_height: '高さ',
                    position: '位置',
                    properties_size: 'サイズ',

                    // Element Types
                    properties_element_text: 'テキスト',
                    properties_element_rect: '長方形',
                    properties_element_triangle: '三角形',
                    properties_element_trapezoid: '台形',
                    properties_element_circle: '円',
                    properties_element_diamond: 'ひし形',
                    properties_element_cylinder: '円柱',
                    properties_element_heart: 'ハート',
                    properties_element_star: '星',
                    properties_element_pentagon: '五角形',
                    properties_element_hexagon: '六角形',
                    properties_element_arrow_up: '上矢印',
                    properties_element_arrow_down: '下矢印',
                    properties_element_arrow_left: '左矢印',
                    properties_element_arrow_right: '右矢印',
                    properties_element_tree: '木',
                    properties_element_house: '家',
                    properties_element_line: '線',
                    properties_element_image: '画像',

                    // Bed Properties
                    properties_bed_info: 'ベッド情報',
                    properties_label: 'ラベル',
                    properties_orientation: '方向',
                    properties_orientation_vertical: '縦',
                    properties_orientation_horizontal: '横',

                    // Shape/Line Properties
                    properties_shape_style: 'スタイル',
                    properties_line_color: '線の色',
                    properties_line_width: '線の太さ',
                    properties_line_style: '線の種類',
                    properties_line_style_solid: '実線',
                    properties_line_style_dashed: '破線',
                    properties_line_style_dotted: '点線',
                    properties_arrow_start: '始点',
                    properties_arrow_end: '終点',
                    properties_arrow_none: 'なし',
                    properties_arrow_standard: '標準',
                    properties_arrow_filled: '塗りつぶし',
                    properties_arrow_triangle: '三角',
                    properties_arrow_open: '開く',
                    properties_arrow_circle: '円',
                    properties_arrow_diamond: 'ダイヤ',
                    properties_arrow_square: '四角',

                    // Common
                    color: '色',
                    properties_font: 'フォント',
                    properties_font_size: 'サイズ',
                    properties_font_style_bold: '太字',
                    properties_font_style_italic: '斜体',
                    properties_text_align: '配置',
                    properties_opacity: '不透明度',
                    properties_rotation: '回転',
                    properties_select_image: '画像選択',
                    properties_preview: 'プレビュー',

                    // Print
                    bed_layout_shape_preview: '図形プレビュー',
                    bed_layout_image_preview: '画像プレビュー',
                }}
            >
                <button
                    onClick={() => setIsDashboardMode(!isDashboardMode)}
                    className={`p-2 rounded-md hover:bg-theme-bg-tertiary transition-colors flex items-center gap-2 ${isDashboardMode ? 'text-blue-500 bg-blue-100 dark:bg-blue-900' : 'text-theme-text-secondary'}`}
                    title={isDashboardMode ? "Switch to Editor" : "Switch to Dashboard"}
                >
                    {isDashboardMode ? <Edit className="w-4 h-4" /> : <LayoutDashboard className="w-4 h-4" />}
                </button>

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
                {!isDashboardMode && (
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
                            i18nOverrides={{
                                toolbar_text: 'テキスト',
                                toolbar_bed: 'ベッド',
                            }}
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
                    )}
                </div>

                {/* Right Properties Panel */}
                {!isDashboardMode && (
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
