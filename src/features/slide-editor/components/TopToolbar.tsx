import React, { useState, useEffect } from 'react'
import {
    Type,
    Square,
    Image as ImageIcon,
    Minus,
    Play,
    Download,
    Undo2,
    Redo2,
    ZoomIn, // Re-added
    ZoomOut,
    LayoutTemplate,
    Layers,
    Palette, // For Templates
} from 'lucide-react'
import { SLIDE_TEMPLATES } from '../constants/templates'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { Button } from '@/components/ui/Button'
import type { Doc } from '@/types/canvas'
import { isPptxAvailable } from '../utils/pptxExport'
import { useCanvasOperations } from '@/features/konva-editor/hooks/useCanvasOperations'
import { EDITOR_SHAPES } from '@/features/konva-editor/constants/shapes'
import { SLIDE_LAYOUTS, type LayoutType } from '../constants/layouts'


interface TopToolbarProps {
    doc: Doc
    presentationTitle: string
    onPresentationTitleChange: (title: string) => void
    currentSlideId: string
    onDocChange: (doc: Doc) => void
    onSelectElement: (id: string) => void
    zoom: number
    onZoomChange: (z: number) => void
    onPlay: () => void
    onExport: () => void
    onExportImage: () => void
    canUndo: boolean
    canRedo: boolean
    onUndo: () => void
    onRedo: () => void
    activeTool: string
    onToolSelect: (tool: string) => void
    onAddSlide: (layout: LayoutType) => void
    isMasterEditMode: boolean
    onToggleMasterEdit: () => void
    onSelectTemplate?: (templateId: string) => void
    extraActions?: React.ReactNode
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
    doc,
    presentationTitle,
    onPresentationTitleChange,
    currentSlideId,
    onDocChange,
    onSelectElement,
    zoom,
    onZoomChange,
    onPlay,
    onExport,
    onExportImage,
    canUndo,
    canRedo,
    onUndo,
    onRedo,
    activeTool: _activeTool, // Reserved but unused
    onToolSelect,
    onAddSlide,
    // Removed duplicate onAddSlide
    isMasterEditMode,
    onToggleMasterEdit,
    onSelectTemplate,
    extraActions,
}) => {
    const [pptxEnabled, setPptxEnabled] = useState(false)

    // Shared Canvas Operations
    const { addText, addShape, addLine, addImage } = useCanvasOperations({
        templateDoc: doc,
        onTemplateChange: onDocChange,
        onSelectElement,
        onToolSelect,
        resolveText: (key, def) => def || key,
        dpi: 96
    })


    useEffect(() => {
        isPptxAvailable().then(setPptxEnabled)
    }, [])

    // Handlers for shared operations
    const handleAddText = () => addText(currentSlideId)
    const handleAddLine = () => addLine(currentSlideId)
    const handleAddImage = () => addImage(currentSlideId)
    const handleAddShape = (type: string) => addShape(type, currentSlideId)


    return (
        <div className="h-12 border-b border-border bg-background flex items-center px-2 gap-1 overflow-x-auto">
            {/* Slide Layouts */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" title="スライドレイアウト">
                        <LayoutTemplate className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[360px] p-2" align="start">
                    <div className="grid grid-cols-2 gap-2">
                        {SLIDE_LAYOUTS.map((layout) => (
                            <button
                                key={layout.id}
                                className="flex flex-col items-center p-2 hover:bg-accent rounded-md group text-center border border-transparent hover:border-border transition-all"
                                onClick={() => onAddSlide(layout.id)}
                            >
                                {layout.icon}
                                <span className="text-xs mt-2 font-medium">{layout.label}</span>
                            </button>
                        ))}
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>

            <input
                value={presentationTitle}
                onChange={(event) => onPresentationTitleChange(event.target.value)}
                placeholder="プレゼンテーション名"
                className="border border-border rounded-md px-2 py-1 text-xs w-48 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />


            <div className="h-6 w-px bg-border" />

            {/* Insert Tools */}
            <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" onClick={handleAddText} title="テキスト">
                    <Type className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" title="図形">
                            <Square className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        {EDITOR_SHAPES.map((shape) => (
                            <DropdownMenuItem
                                key={shape.type}
                                onClick={() => handleAddShape(shape.type)}
                                title={shape.label}
                            >
                                {shape.icon}
                                <span className="ml-2">{shape.label}</span>
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="ghost" size="icon" onClick={handleAddImage} title="画像">
                    <ImageIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleAddLine} title="線">
                    <Minus className="h-4 w-4" />
                </Button>
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Master Edit Toggle */}
            <Button
                variant={isMasterEditMode ? "secondary" : "ghost"}
                size="icon"
                onClick={onToggleMasterEdit}
                className={isMasterEditMode ? "bg-accent text-accent-foreground border-accent" : ""}
                title={isMasterEditMode ? "マスター編集中" : "マスター編集"}
            >
                <Layers className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-border" />

            {/* Zoom */}
            <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" onClick={() => onZoomChange(zoom - 10)} title="ズームアウト">
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs w-8 text-center">{zoom}%</span>
                <Button variant="ghost" size="icon" onClick={() => onZoomChange(zoom + 10)} title="ズームイン">
                    <ZoomIn className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1" />

            {extraActions && (
                <div className="flex items-center gap-0.5">
                    {extraActions}
                </div>
            )}

            {extraActions && <div className="h-6 w-px bg-border" />}

            {/* History */}
            <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo} title="元に戻す">
                    <Undo2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo} title="やり直し">
                    <Redo2 className="h-4 w-4" />
                </Button>
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Play & Export */}
            {/* Play/Export vs Master Controls */}
            {isMasterEditMode ? (
                <div className="flex items-center gap-1">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 px-2 py-1 text-xs"
                                title="テンプレートをロード"
                            >
                                <Palette className="h-4 w-4" />
                                テンプレートをロード
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                            {SLIDE_TEMPLATES.map(t => (
                                <DropdownMenuItem key={t.id} onClick={() => onSelectTemplate?.(t.id)}>
                                    {t.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            ) : (
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="px-2 py-1 text-xs"
                        onClick={onPlay}
                        title="プレゼン再生"
                    >
                        <Play className="h-4 w-4 mr-1 map-fill" fill="currentColor" />
                        Play
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1 px-2 py-1 text-xs"
                                title="エクスポート"
                            >
                                <Download className="h-4 w-4" />
                                Export
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={onExportImage}>
                                <ImageIcon className="h-4 w-4 mr-2" />
                                Image
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onExport} disabled={!pptxEnabled}>
                                <Download className="h-4 w-4 mr-2" />
                                PPTX
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )}
        </div>
    )
}
