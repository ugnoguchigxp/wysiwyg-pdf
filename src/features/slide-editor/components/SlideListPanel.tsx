import React, { useMemo } from 'react'
import { Trash2, Copy, MoreHorizontal } from 'lucide-react'
import {
    type Doc,
    type Surface,
    type UnifiedNode,
} from '@/types/canvas'
import { Button } from '@/components/ui/Button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { cn } from '@/lib/utils'

interface SlideListPanelProps {
    doc: Doc
    currentSlideId: string
    onSlideSelect: (id: string) => void
    onChange: (doc: Doc) => void
    thumbnails?: Record<string, string>
    onAddSlide: (layoutId: string) => void
}

export const SlideListPanel: React.FC<SlideListPanelProps> = ({
    doc,
    currentSlideId,
    onSlideSelect,
    onChange,
    thumbnails = {},
    onAddSlide,
}) => {
    const surfaces = useMemo(() => doc.surfaces.filter(s => s.type === 'slide'), [doc.surfaces])

    // Simple HTML5 Drag & Drop
    const [draggedSlideId, setDraggedSlideId] = React.useState<string | null>(null)

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedSlideId(id)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault()
        if (!draggedSlideId || draggedSlideId === targetId) return
        e.dataTransfer.dropEffect = 'move'
    }

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault()
        if (!draggedSlideId || draggedSlideId === targetId) return

        const oldIndex = doc.surfaces.findIndex((s) => s.id === draggedSlideId)
        const newIndex = doc.surfaces.findIndex((s) => s.id === targetId)

        if (oldIndex === -1 || newIndex === -1) return

        const newSurfaces = [...doc.surfaces]
        const [moved] = newSurfaces.splice(oldIndex, 1)
        newSurfaces.splice(newIndex, 0, moved)

        onChange({
            ...doc,
            surfaces: newSurfaces,
        })
        setDraggedSlideId(null)
    }

    const handleDelete = (e: React.MouseEvent | React.KeyboardEvent, id: string) => {
        e.stopPropagation()
        if (doc.surfaces.length <= 1) return // Prevent deleting last slide

        const newSurfaces = doc.surfaces.filter((s) => s.id !== id)
        // Also remove nodes belonging to this surface
        const newNodes = doc.nodes.filter((n) => n.s !== id)

        // Determine new current slide if we deleted the current one
        let newCurrentId = currentSlideId
        if (currentSlideId === id) {
            const uiIndex = surfaces.findIndex(s => s.id === id)
            const nextUiIndex = uiIndex > 0 ? uiIndex - 1 : 0
            newCurrentId = surfaces.filter(s => s.id !== id)[nextUiIndex]?.id ?? ''
        }

        onChange({
            ...doc,
            surfaces: newSurfaces,
            nodes: newNodes,
        })
        if (newCurrentId && newCurrentId !== currentSlideId) {
            onSlideSelect(newCurrentId)
        }
    }

    const handleDuplicate = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        const surfaceToClone = doc.surfaces.find(s => s.id === id)
        if (!surfaceToClone) return

        const newId = `slide-${crypto.randomUUID()}`
        const newSurface: Surface = {
            ...surfaceToClone,
            id: newId,
        }

        // Clone nodes
        const nodesToClone = doc.nodes.filter(n => n.s === id)
        const newNodes: UnifiedNode[] = nodesToClone.map(n => ({
            ...n,
            id: `${n.t}-${crypto.randomUUID()}`,
            s: newId,
        }))

        const index = doc.surfaces.findIndex(s => s.id === id)
        const newSurfaces = [...doc.surfaces]
        if (index !== -1) {
            newSurfaces.splice(index + 1, 0, newSurface)
        } else {
            newSurfaces.push(newSurface)
        }

        onChange({
            ...doc,
            surfaces: newSurfaces,
            nodes: [...doc.nodes, ...newNodes],
        })
        onSlideSelect(newId)
    }

    return (
        <div className="flex flex-col w-full h-full bg-muted/30 border-r border-border overflow-hidden">
            <div className="p-2 border-b border-border bg-background/50">
                <span className="text-xs font-semibold text-muted-foreground uppercase">Slides</span>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-4">
                {surfaces.map((slide, index) => {
                    const isSelected = slide.id === currentSlideId
                    return (
                        <SlideThumbnail
                            key={slide.id}
                            slide={slide}
                            isSelected={isSelected}
                            isDragged={draggedSlideId === slide.id}
                            index={index}
                            onSelect={onSlideSelect}
                            onDragStart={handleDragStart}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                            onDuplicate={handleDuplicate}
                            onDelete={handleDelete}
                            onAddSlide={onAddSlide}
                            surfacesCount={surfaces.length}
                            thumbnailUrl={thumbnails[slide.id]}
                        />
                    )
                })}
            </div>
        </div>
    )
}

// Sub-component for individual thumbnail to handle sizing independently
interface SlideThumbnailProps {
    slide: any // UnifiedNode/Surface
    isSelected: boolean
    isDragged: boolean
    index: number
    onSelect: (id: string) => void
    onDragStart: (e: React.DragEvent, id: string) => void
    onDragOver: (e: React.DragEvent, id: string) => void
    onDrop: (e: React.DragEvent, id: string) => void
    onDuplicate: (e: React.MouseEvent, id: string) => void
    onDelete: (e: React.MouseEvent | React.KeyboardEvent, id: string) => void
    onAddSlide: (layoutId: string) => void
    surfacesCount: number
    thumbnailUrl?: string
    doc?: Doc // Optional now
}

const SlideThumbnail: React.FC<SlideThumbnailProps> = ({
    slide,
    isSelected,
    isDragged,
    index,
    onSelect,
    onDragStart,
    onDragOver,
    onDrop,
    onDuplicate,
    onDelete,
    onAddSlide,
    surfacesCount,
    thumbnailUrl
}) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            e.stopPropagation()
            onAddSlide('title-content')
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault()
            e.stopPropagation()
            onDelete(e, slide.id)
        }
    }

    return (
        <div
            draggable
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onDragStart={(e) => onDragStart(e, slide.id)}
            onDragOver={(e) => onDragOver(e, slide.id)}
            onDrop={(e) => onDrop(e, slide.id)}
            onClick={() => onSelect(slide.id)}
            className={cn(
                'group relative flex flex-col gap-1 items-start rounded-md p-2 transition-all cursor-pointer border-2 bg-background shadow-sm focus:outline-none focus:ring-2 focus:ring-primary',
                isSelected
                    ? 'border-primary ring-1 ring-primary/20'
                    : 'border-transparent hover:border-border',
                isDragged && 'opacity-50'
            )}
        >
            <div
                className="relative w-full shadow-sm overflow-hidden rounded-sm ring-1 ring-border/20 pointer-events-none select-none flex items-center justify-center bg-white"
                style={{ aspectRatio: `${slide.w || 297}/${slide.h || 210}` }}
            >
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={`Slide ${index + 1}`}
                        className="w-full h-full object-contain"
                    />
                ) : (
                    <div className="text-xs text-muted-foreground">...</div>
                )}

                {/* Floating Number */}
                <div className="absolute top-0 left-0 bg-background/80 text-foreground text-[10px] font-mono px-1.5 py-0.5 rounded-br border-r border-b border-border/50 backdrop-blur-[2px]">
                    {index + 1}
                </div>
            </div>

            {/* Actions - overlay on bottom right or corner */}
            <div className={cn(
                "absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10",
                "focus-within:opacity-100"
            )}>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-background/80 shadow-sm backdrop-blur-sm">
                            <MoreHorizontal className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={(e) => onDuplicate(e, slide.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            <span>Duplicate</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={(e) => onDelete(e as any, slide.id)}
                            className="text-destructive focus:text-destructive"
                            disabled={surfacesCount <= 1}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Delete</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    )
}
