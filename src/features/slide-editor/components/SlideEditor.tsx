import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Rect } from 'react-konva' // Added Rect
import type { Doc, UnifiedNode } from '@/types/canvas'


import { KonvaCanvasEditor, type KonvaCanvasEditorHandle } from '@/components/canvas/KonvaCanvasEditor'
import { WysiwygPropertiesPanel } from '@/features/report-editor/components/PropertyPanel/WysiwygPropertiesPanel'
import { SlideListPanel } from './SlideListPanel'
import { TopToolbar } from './TopToolbar'
import { PresentationMode } from './PresentationMode'

import { useSlideHistory } from '../hooks/useSlideHistory'
import { useFitToScreen } from '../hooks/useFitToScreen'
import { exportToPptx } from '../utils/pptxExport'
import { PAGE_SIZES } from '@/constants/pageSizes' // Keeping PAGE_SIZES


import { INITIAL_DOC } from '../utils/slideFactories'
import { useSlideOperations } from '../hooks/useSlideOperations'



interface SlideEditorProps {
    loadDoc?: Doc
    loadNonce?: number
    onDocChange?: (doc: Doc) => void
    toolbarActions?: React.ReactNode
}

export const SlideEditor: React.FC<SlideEditorProps> = ({
    loadDoc,
    loadNonce,
    onDocChange,
    toolbarActions,
}) => {
    const { doc, setDoc, undo, redo, canUndo, canRedo, reset } = useSlideHistory(INITIAL_DOC)
    const [currentSlideId, setCurrentSlideId] = useState<string>(() => {
        return (
            doc.surfaces.find((s) => s.masterId !== undefined)?.id ||
            doc.surfaces[0]?.id ||
            ''
        )
    })
    const [selectedIds, setSelectedIds] = useState<string[]>([])
    const [activeTool, setActiveTool] = useState('select')
    const [isPresentationMode, setIsPresentationMode] = useState(false)
    const [showGrid, setShowGrid] = useState(false)
    const [gridSize, setGridSize] = useState(15)
    const [snapStrength, setSnapStrength] = useState(5)


    const editorContainerRef = useRef<HTMLDivElement>(null)
    const canvasRef = useRef<KonvaCanvasEditorHandle>(null)
    const lastSlideIdRef = useRef<string | null>(null) // To restore slide after master edit
    const lastLoadNonceRef = useRef<number | undefined>(undefined)

    useEffect(() => {
        onDocChange?.(doc)
    }, [doc, onDocChange])

    useEffect(() => {
        if (!loadDoc) return
        if (loadNonce === undefined) return
        if (lastLoadNonceRef.current === loadNonce) return

        reset(loadDoc)
        setSelectedIds([])
        setActiveTool('select')
        setIsPresentationMode(false)
        setShowGrid(false)
        setThumbnails({})

        const nextSlideId =
            loadDoc.surfaces.find((s) => s.masterId !== undefined)?.id ||
            loadDoc.surfaces[0]?.id ||
            ''
        setCurrentSlideId(nextSlideId)
        requestAnimationFrame(() => {
            setCurrentSlideId(nextSlideId)
        })
        lastLoadNonceRef.current = loadNonce
    }, [loadDoc, loadNonce, reset])

    // Ensure currentSlideId is valid
    useEffect(() => {
        if (!doc.surfaces.find(s => s.id === currentSlideId)) {
            if (doc.surfaces.length > 0) {
                setCurrentSlideId(doc.surfaces[0].id)
            }
        }
    }, [doc.surfaces, currentSlideId])

    const currentSlide = doc.surfaces.find(s => s.id === currentSlideId)
    // Master vs Slide logic
    // If masterId is undefined/missing -> It is a master surface (or blank master)
    const isMasterEditMode = currentSlide?.masterId === undefined && currentSlide?.id !== 'master-blank'

    // Resolve Master (for Slide View)
    const masterSurfaceForSlide = currentSlide?.masterId
        ? doc.surfaces.find(s => s.id === currentSlide.masterId)
        : null

    // Get nodes
    const masterNodes = masterSurfaceForSlide
        ? doc.nodes.filter(n => n.s === masterSurfaceForSlide.id)
        : []
    // If we are editing master, we filter by currentSlideId (which IS the master id)
    // If we are editing slide, we also filter by currentSlideId
    const currentSurfaceNodes = doc.nodes.filter(n => n.s === currentSlideId)

    // Calculate Slide Number
    // Filter only standard slides (not masters) to count index
    const allSlides = doc.surfaces.filter(s => s.masterId !== undefined)
    const slideIndex = allSlides.findIndex(s => s.id === currentSlideId)
    const pageNumber = slideIndex >= 0 ? slideIndex + 1 : 1

    // Process Master Nodes for Dynamic Content
    // AND Filter out placeholders (they are hidden on slide view, as they are copied to slide)
    const processedMasterNodes = masterNodes
        .filter(n => !n.isPlaceholder) // Hide placeholders
        .map(n => {
            // Lock by default
            const node = { ...n, locked: true }

            // Dynamic Content Replacement
            if (node.t === 'text' && node.dynamicContent === 'slide-number') {
                return { ...node, text: String(pageNumber) }
            }
            return node
        })

    // Merge for display
    // Case 1: Master Edit Mode -> Show ONLY master nodes (editable, no replacement)
    // Case 2: Slide Edit Mode -> Show Master Nodes (Locked background, processed) + Slide Nodes (Editable)
    const displayNodes = isMasterEditMode
        ? currentSurfaceNodes
        : [
            ...processedMasterNodes,
            ...currentSurfaceNodes
        ]

    const handleToggleMasterEdit = () => {
        if (isMasterEditMode) {
            // Exit Master Mode
            const targetId = lastSlideIdRef.current || doc.surfaces.find(s => s.masterId !== undefined)?.id || doc.surfaces[0].id
            setCurrentSlideId(targetId)
        } else {
            // Enter Master Mode
            lastSlideIdRef.current = currentSlideId
            // Find master for this slide
            const targetMasterId = currentSlide?.masterId || 'master-default' // Fallback
            // Check if master exists
            const masterExists = doc.surfaces.find(s => s.id === targetMasterId)

            if (masterExists) {
                setCurrentSlideId(targetMasterId)
            } else {
                // If referenced master not found (e.g. 'blank' or missing), try finding ANY master
                const anyMaster = doc.surfaces.find(s => s.masterId === undefined && s.id !== 'master-blank')
                if (anyMaster) {
                    setCurrentSlideId(anyMaster.id)
                } else {
                    // No master found? Create default? For now just stay.
                    console.warn('No master slide found to edit.')
                }
            }
        }
    }

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

    const { handleAddSlide, handleSelectTemplate } = useSlideOperations({
        setDoc,
        currentSlideId,
        doc,
        setCurrentSlideId,
        isMasterEditMode
    })

    // Export
    const handleExport = useCallback(async () => {
        try {
            await exportToPptx(doc, `${doc.title || 'presentation'}.pptx`)
        } catch (e) {
            alert('Failed to export PPTX')
            console.error(e)
        }
    }, [doc])

    const handleExportImage = useCallback(() => {
        const stage = canvasRef.current?.getStage()
        if (!stage) return

        const dataURL = stage.toDataURL({ pixelRatio: 2 })
        const link = document.createElement('a')
        link.download = `${doc.title || 'presentation'}.png`
        link.href = dataURL
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }, [doc.title])

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
                presentationTitle={doc.title ?? ''}
                onPresentationTitleChange={(title) => {
                    setDoc((prev) => ({
                        ...prev,
                        title,
                    }))
                }}
                currentSlideId={currentSlideId}
                onDocChange={setDoc}
                onSelectElement={(id) => setSelectedIds([id])}
                zoom={effectiveZoom}
                onZoomChange={handleZoomChange}
                onPlay={() => setIsPresentationMode(true)}
                onExport={handleExport}
                onExportImage={handleExportImage}
                canUndo={canUndo}
                canRedo={canRedo}
                onUndo={undo}
                onRedo={redo}
                activeTool={activeTool}
                onToolSelect={setActiveTool}
                onAddSlide={handleAddSlide}
                isMasterEditMode={isMasterEditMode}
                onToggleMasterEdit={handleToggleMasterEdit}
                onSelectTemplate={handleSelectTemplate}
                extraActions={toolbarActions}
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
                        isMasterEditMode={isMasterEditMode}
                    />
                </div>

                {/* Center: Canvas */}
                <div className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-900" ref={editorContainerRef}>
                    {currentSlide && (
                        <KonvaCanvasEditor
                            ref={canvasRef}

                            elements={displayNodes}
                            selectedIds={selectedIds}
                            onSelect={handleSelect}
                            onChange={handleCanvasChange}
                            zoom={effectiveZoom / 100}
                            paperWidth={currentSlide?.w || PAGE_SIZES.A4_LANDSCAPE.w}
                            paperHeight={currentSlide?.h || PAGE_SIZES.A4_LANDSCAPE.h}
                            background={
                                <Rect
                                    x={0}
                                    y={0}
                                    width={currentSlide?.w || PAGE_SIZES.A4_LANDSCAPE.w}
                                    height={currentSlide?.h || PAGE_SIZES.A4_LANDSCAPE.h}
                                    fill={
                                        // If editing master, use its own bg
                                        isMasterEditMode ? (currentSlide?.bg || '#ffffff') :
                                            // If editing slide, use slide bg. If slide bg missing, use master bg.
                                            (currentSlide?.bg || masterSurfaceForSlide?.bg || '#ffffff')
                                    }
                                />
                            }
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
