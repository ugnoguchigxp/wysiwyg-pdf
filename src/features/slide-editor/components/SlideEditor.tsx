import React, { useState, useRef, useEffect, useCallback } from 'react'
import type { Doc, UnifiedNode } from '@/types/canvas'
import { PAGE_SIZES } from '@/constants/pageSizes'

import { KonvaCanvasEditor, type KonvaCanvasEditorHandle } from '@/components/canvas/KonvaCanvasEditor'
import { WysiwygPropertiesPanel } from '@/features/report-editor/components/PropertyPanel/WysiwygPropertiesPanel'
import { SlideListPanel } from './SlideListPanel'
import { TopToolbar } from './TopToolbar'
import { PresentationMode } from './PresentationMode'
import { useSlideHistory } from '../hooks/useSlideHistory'
import { useFitToScreen } from '../hooks/useFitToScreen'
import { exportToPptx } from '../utils/pptxExport'
import { SLIDE_LAYOUTS } from '../constants/layouts'

const INITIAL_DOC: Doc = {
    v: 1,
    id: 'slide-doc-1',
    title: 'New Presentation',
    unit: 'mm',
    surfaces: [{
        id: 'slide-1',
        type: 'slide',
        w: PAGE_SIZES.A4_LANDSCAPE.w,
        h: PAGE_SIZES.A4_LANDSCAPE.h,
        bg: '#ffffff'
    }],
    nodes: SLIDE_LAYOUTS.find(l => l.id === 'title')?.generateNodes('slide-1', PAGE_SIZES.A4_LANDSCAPE.w, PAGE_SIZES.A4_LANDSCAPE.h) || [],
}

export const SlideEditor: React.FC = () => {
    const { doc, setDoc, undo, redo, canUndo, canRedo } = useSlideHistory(INITIAL_DOC)
    const [currentSlideId, setCurrentSlideId] = useState<string>(doc.surfaces[0]?.id || '')
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [activeTool, setActiveTool] = useState('select')
    const [isPresentationMode, setIsPresentationMode] = useState(false)
    const [showGrid, setShowGrid] = useState(false)
    const [gridSize, setGridSize] = useState(15)
    const [snapStrength, setSnapStrength] = useState(5)


    const editorContainerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<KonvaCanvasEditorHandle>(null)

    // Ensure currentSlideId is valid
    useEffect(() => {
        if (!doc.surfaces.find(s => s.id === currentSlideId)) {
            if (doc.surfaces.length > 0) {
                setCurrentSlideId(doc.surfaces[0].id)
            }
        }
    }, [doc.surfaces, currentSlideId])

    const currentSlide = doc.surfaces.find(s => s.id === currentSlideId)
    const slideNodes = doc.nodes.filter(n => n.s === currentSlideId)

    // Auto Zoom
    const { zoom } = useFitToScreen(
        editorContainerRef,
        currentSlide?.w || PAGE_SIZES.A4_LANDSCAPE.w,
        currentSlide?.h || PAGE_SIZES.A4_LANDSCAPE.h

    )

    // Zoom control
    const [userZoom, setUserZoom] = useState<number | null>(null)
    const effectiveZoom = userZoom ?? zoom

    const handleZoomChange = (z: number) => {
        setUserZoom(Math.max(10, Math.min(400, z)))
    }

    // Thumbnails state
    const [thumbnails, setThumbnails] = useState<Record<string, string>>({})


    const captureThumbnail = useCallback(() => {
        if (!canvasRef.current) return
        const stage = canvasRef.current.getStage()
        if (!stage) return

        // Calculate dynamic pixelRatio to get ~300px width thumbnail
        // stage.width() is in pixels.
        const width = stage.width()
        const targetWidth = 300
        const pixelRatio = targetWidth / width

        try {
            const dataURL = stage.toDataURL({ pixelRatio: Number.isFinite(pixelRatio) ? pixelRatio : 0.2 })
            setThumbnails(prev => ({
                ...prev,
                [currentSlideId]: dataURL
            }))
        } catch (e) {
            console.error('Failed to capture thumbnail', e)
        }
    }, [currentSlideId])

    // Capture when user stops interacting (MouseUp/TouchEnd) - likely history point
    const handleStageInteractionEnd = useCallback(() => {
        // Small delay to ensure render is complete
        setTimeout(captureThumbnail, 50)
    }, [captureThumbnail])

    // Initial capture
    useEffect(() => {
        const timer = setTimeout(captureThumbnail, 500)
        return () => clearTimeout(timer)
    }, [currentSlideId, captureThumbnail])

    // Also capture when doc structure changes (e.g. undo/redo)
    useEffect(() => {
        // Debounce slightly to avoid rapid updates during playback/undo
        const timer = setTimeout(captureThumbnail, 500)
        return () => clearTimeout(timer)
    }, [doc.nodes, captureThumbnail]) // Listen to nodes specifically


    // Element Selection
    const handleSelect = useCallback((ids: string[]) => {
        setSelectedIds(ids)
    }, [])

    // Single selected element for Properties Panel
    const selectedElementId = selectedIds.length === 1 ? selectedIds[0] : null

    // Update from Canvas
    const handleCanvasChange = useCallback((
        updates: (Partial<UnifiedNode> & { id?: string }) | (Partial<UnifiedNode> & { id?: string })[],
        options?: { saveToHistory?: boolean; force?: boolean }
    ) => {
        setDoc(prev => {
            const changesArray = Array.isArray(updates) ? updates : [updates]
            const updateMap = new Map(changesArray.map(u => [u.id!, u]))

            const nextNodes = prev.nodes.map(n => {
                if (n.id && updateMap.has(n.id)) {
                    return { ...n, ...updateMap.get(n.id) } as UnifiedNode
                }
                return n
            })
            return { ...prev, nodes: nextNodes }
        }, options)
        // Note: we rely on handleStageInteractionEnd and the effect on doc.nodes for thumbnails now
        // to avoid heavy work during drag (onChange)
    }, [setDoc])

    // Add Slide with Layout
    const handleAddSlide = useCallback((layoutId: any) => {
        // layoutId is LayoutType
        const layout = SLIDE_LAYOUTS.find(l => l.id === layoutId) || SLIDE_LAYOUTS[0] // fallback to first? or blank?

        // Ensure we create a valid slide from current defaults or A4
        const newSlideId = `slide-${crypto.randomUUID()}`
        const newSurface = {
            id: newSlideId,
            type: 'slide',
            w: currentSlide?.w || PAGE_SIZES.A4_LANDSCAPE.w,
            h: currentSlide?.h || PAGE_SIZES.A4_LANDSCAPE.h,
            bg: '#ffffff'
        } as const

        const newNodes = layout.generateNodes(newSlideId, newSurface.w, newSurface.h)

        setDoc(prev => ({
            ...prev,
            surfaces: [...prev.surfaces, newSurface],
            nodes: [...prev.nodes, ...newNodes] // Add layout nodes
        }))

        // Select the new slide
        setCurrentSlideId(newSlideId)

        // Wait for render then capture thumb? Handled by useEffect([currentSlideId])
    }, [currentSlide, setDoc])

    // Export
    const handleExport = useCallback(async () => {
        try {
            await exportToPptx(doc, `${doc.title || 'presentation'}.pptx`)
        } catch (e) {
            alert('Failed to export PPTX')
            console.error(e)
        }
    }, [doc])

    if (isPresentationMode) {
        return (
            <PresentationMode
                doc={doc}
                initialSlideId={currentSlideId}
                onExit={() => setIsPresentationMode(false)}
            />
        )
    }

    return (
        <div className="flex flex-col w-full h-full bg-background overflow-hidden">
            {/* Top Toolbar */}
            <TopToolbar
                doc={doc}
                currentSlideId={currentSlideId}
                onDocChange={setDoc}
                onSelectElement={(id) => setSelectedIds([id])}
                zoom={effectiveZoom}
                onZoomChange={handleZoomChange}
                onPlay={() => setIsPresentationMode(true)}
                onExport={handleExport}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
                activeTool={activeTool}
                onToolSelect={setActiveTool}
                onAddSlide={handleAddSlide}
            />

            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar: Slide List */}
                <div className="w-48 flex-shrink-0">
                    <SlideListPanel
                        doc={doc}
                        currentSlideId={currentSlideId}
                        onSlideSelect={setCurrentSlideId}
                        onChange={setDoc}
                        thumbnails={thumbnails}
                        onAddSlide={handleAddSlide}
                    />
                </div>

                {/* Center: Canvas */}
                <div className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-900" ref={editorContainerRef}>
                    {currentSlide && (
                        <KonvaCanvasEditor
                            ref={canvasRef}

                            elements={slideNodes}
                            selectedIds={selectedIds}
                            onSelect={handleSelect}
                            onChange={handleCanvasChange}
                            zoom={effectiveZoom / 100}
                            paperWidth={currentSlide.w}
                            paperHeight={currentSlide.h}
                            showGrid={showGrid}
                            // Connect undo/redo shortcuts?
                            onUndo={undo}
                            onRedo={redo}
                            onDelete={() => {
                                // Implement node delete logic from toolbar or keyboard
                                // KonvaCanvasEditor handles keyboard delete calls to this prop
                                if (selectedIds.length > 0) {
                                    setDoc(prev => ({
                                        ...prev,
                                        nodes: prev.nodes.filter(n => !selectedIds.includes(n.id))
                                    }))
                                }
                            }}
                            className="flex items-center justify-center"
                            onStageMouseUp={handleStageInteractionEnd}
                        />
                    )}
                </div>

                {/* Right Sidebar: Properties */}
                <div className="w-72 border-l border-border bg-background">
                    <WysiwygPropertiesPanel
                        templateDoc={doc}
                        selectedElementId={selectedElementId}
                        onTemplateChange={setDoc}
                        currentPageId={currentSlideId}
                        showGrid={showGrid}
                        onShowGridChange={setShowGrid}
                        gridSize={gridSize}
                        onGridSizeChange={setGridSize}
                        snapStrength={snapStrength}
                        onSnapStrengthChange={setSnapStrength}
                    // selectedCell={null} // Table cell selection not yet implemented
                    />
                </div>
            </div>
        </div >
    )
}
