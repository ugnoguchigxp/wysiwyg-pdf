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
    Save, // Added
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
    currentSlideId: string
    onDocChange: (doc: Doc) => void
    onSelectElement: (id: string) => void
    zoom: number
    onZoomChange: (z: number) => void
    onPlay: () => void
    onExport: () => void
    canUndo: boolean
    canRedo: boolean
    onUndo: () => void
    onRedo: () => void
    activeTool: string
    onToolSelect: (tool: string) => void
    onAddSlide: (layout: LayoutType) => void
    isMasterEditMode: boolean
    onToggleMasterEdit: () => void
    onSaveMaster?: () => void
    onSelectTemplate?: (templateId: string) => void
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
    doc,
    currentSlideId,
    onDocChange,
    onSelectElement,
    zoom,
    onZoomChange,
    onPlay,
    onExport,
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
    onSaveMaster,
    onSelectTemplate,
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
        <div className="h-12 border-b border-border bg-background flex items-center px-4 gap-4 overflow-x-auto">
            {/* Slide Layouts */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2">
                        <LayoutTemplate className="h-4 w-4" />
                        スライドレイアウト
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


            <div className="h-6 w-px bg-border" />

            {/* Insert Tools */}
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={handleAddText}>
                    <Type className="h-4 w-4" />
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
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
                <Button variant="ghost" size="icon" onClick={handleAddImage}>
                    <ImageIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleAddLine}>
                    <Minus className="h-4 w-4" />
                </Button>
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Master Edit Toggle */}
            <Button
                variant={isMasterEditMode ? "secondary" : "ghost"}
                size="sm"
                onClick={onToggleMasterEdit}
                className={isMasterEditMode ? "bg-accent text-accent-foreground border-accent" : ""}
            >
                <Layers className="h-4 w-4 mr-2" />
                {isMasterEditMode ? 'マスター編集中' : 'マスター編集'}
            </Button>

            <div className="h-6 w-px bg-border" />

            {/* Zoom */}
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => onZoomChange(zoom - 10)}>
                    <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-xs w-8 text-center">{zoom}%</span>
                <Button variant="ghost" size="icon" onClick={() => onZoomChange(zoom + 10)}>
                    <ZoomIn className="h-4 w-4" />
                </Button>
            </div>

            <div className="flex-1" />

            {/* History */}
            <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={onUndo} disabled={!canUndo}>
                    <Undo2 className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onRedo} disabled={!canRedo}>
                    <Redo2 className="h-4 w-4" />
                </Button>
            </div>

            <div className="h-6 w-px bg-border" />

            {/* Play & Export */}
            {/* Play/Export vs Master Controls */}
            {isMasterEditMode ? (
                <div className="flex items-center gap-2">
                    {/* Template Selector */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2">
                                <Palette className="h-4 w-4" />
                                テンプレート切替
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

                    {/* Save Master */}
                    <Button variant="default" size="sm" onClick={onSaveMaster}>
                        <Save className="h-4 w-4 mr-2" />
                        マスター保存
                    </Button>
                </div>
            ) : (
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={onPlay}>
                        <Play className="h-4 w-4 mr-1 map-fill" fill="currentColor" />
                        Play
                    </Button>
                    {pptxEnabled && (
                        <Button variant="outline" size="sm" onClick={onExport}>
                            <Download className="h-4 w-4 mr-1" />
                            Export PPTX
                        </Button>
                    )}
                </div>
            )}
        </div>
    )
}
