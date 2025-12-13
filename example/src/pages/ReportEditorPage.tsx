import React, { useRef, useState, useEffect } from 'react'
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

const INITIAL_DOC: Doc = {
    v: 1,
    id: 'doc-1',
    title: 'New Template',
    unit: 'pt',
    surfaces: [
        {
            id: 'page-1',
            type: 'page',
            w: 595.28,
            h: 841.89, // A4 at 72dpi? or PT. A4 is 595x842 pt
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
    const [drawingSettings, setDrawingSettings] = useState<{ stroke: string; strokeWidth: number }>({ stroke: '#000000', strokeWidth: 2 })

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
                i18nOverrides={{
                    // Header
                    editor_orientation: '用紙方向',
                    orientations_portrait: '縦',
                    orientations_landscape: '横',
                    save: '保存',
                    back: '戻る',
                    header_image: '画像保存',
                    header_pdf: 'PDF保存',
                    toolbar_undo: '元に戻す',
                    toolbar_redo: 'やり直す',
                    toolbar_shortcuts: 'ショートカット',

                    // Toolbar
                    toolbar_add_text: 'テキスト追加',
                    toolbar_add_image: '画像追加',
                    toolbar_line: '線',
                    toolbar_add_table: '表追加',
                    toolbar_shape: '図形',
                    shape_trapezoid: '台形',
                    toolbar_default_text: 'テキスト',

                    // Properties
                    properties_layout: 'レイアウト',
                    position: '位置',
                    properties_size: 'サイズ',
                    properties_width: '幅',
                    properties_height: '高さ',
                    properties_opacity: '不透明度',
                    properties_rotation: '回転',
                    color: '色',

                    properties_element_text: 'テキスト',
                    properties_font: 'フォント',
                    properties_font_size: 'サイズ',
                    properties_font_style_bold: '太字',
                    properties_font_style_italic: '斜体',
                    properties_text_decoration: '装飾',
                    properties_text_underline: '下線',
                    properties_text_strikethrough: '取り消し線',
                    properties_text_align: '配置',
                    properties_text_align_left: '左揃え',
                    properties_text_align_center: '中央揃え',
                    properties_text_align_right: '右揃え',

                    properties_element_image: '画像',
                    properties_select_image: '画像選択',
                    properties_preview: 'プレビュー',
                    no_image: '画像なし',

                    properties_element_line: '線',
                    properties_line_color: '線の色',
                    properties_line_width: '線の太さ',
                    properties_arrow_start: '始点',
                    properties_arrow_end: '終点',

                    properties_element_rect: '長方形',
                    properties_element_circle: '円',
                    properties_element_triangle: '三角形',
                    // ... add all shapes if needed similar to BedLayout
                    properties_shape_style: 'スタイル',

                    properties_element_table: '表',
                    properties_table_rows: '行',
                    properties_table_cols: '列',
                    properties_table_border: '枠線',
                    properties_table_cell: 'セル',
                    properties_vertical_align: '垂直配置',
                    properties_vertical_align_top: '上',
                    properties_vertical_align_middle: '中',
                    properties_vertical_align_bottom: '下',

                    // Print
                    shape_preview: '図形プレビュー',
                    report_image_alt: 'アセット',
                }}
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
                        currentPageId={doc.surfaces[0]?.id}
                        activeTool={activeTool}
                        onToolSelect={setActiveTool}
                        i18nOverrides={{
                            toolbar_text: 'Text',
                            toolbar_image: 'Img',
                        }}
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
                    />
                </div>

                {/* Right Properties Panel */}
                <div className="w-72 border-l border-theme-border bg-theme-bg-secondary shrink-0 overflow-hidden flex flex-col z-10 shadow-[-1px_0_3px_rgb(0,0,0,0.05)]">
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
                        i18nOverrides={{
                            properties_layout: 'Page Layout',
                            properties_text_align: 'Text Align',
                            properties_finish_drawing: 'Finish Drawing',
                        }}
                    />
                </div>
            </div>
        </div>
    )
}
