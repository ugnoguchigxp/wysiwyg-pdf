import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Rect } from 'react-konva' // Added Rect
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
import { SLIDE_LAYOUTS, type LayoutDefinition } from '@/features/slide-editor/constants/layouts'
import { SLIDE_TEMPLATES } from '@/features/slide-editor/constants/templates'
import { ptToMm } from '@/utils/units'

// Helper to generate default master nodes (e.g. page number)
const generateMasterNodes = (surfaceId: string, w: number, h: number): UnifiedNode[] => {
    return [{
        id: `master-pagenum-${surfaceId}`,
        t: 'text',
        s: surfaceId,
        x: w - 20, // Bottom right
        y: h - 15,
        w: 15,
        h: 10,
        text: '#',
        dynamicContent: 'slide-number',
        fontSize: ptToMm(12), // 12pt
        align: 'r',
        fill: '#94a3b8',
        locked: true
    }]
}

// Generate Initial Masters for every layout type
const INITIAL_MASTERS = SLIDE_LAYOUTS.map((layout: LayoutDefinition) => ({
    surface: {
        id: `master-${layout.id}`,
        type: 'slide',
        w: PAGE_SIZES.A4_LANDSCAPE.w,
        h: PAGE_SIZES.A4_LANDSCAPE.h,
        bg: '#ffffff',
        // masterId undefined -> This IS a master
    } as const,
    nodes: [
        ...generateMasterNodes(`master-${layout.id}`, PAGE_SIZES.A4_LANDSCAPE.w, PAGE_SIZES.A4_LANDSCAPE.h),
        ...layout.generateNodes(`master-${layout.id}`, PAGE_SIZES.A4_LANDSCAPE.w, PAGE_SIZES.A4_LANDSCAPE.h)
    ]
}))

const INITIAL_DOC: Doc = {
    v: 1,
    id: 'slide-doc-1',
    title: 'New Presentation',
    unit: 'mm',
    surfaces: [
        // 1. All Layout Masters
        ...INITIAL_MASTERS.map((m: any) => m.surface),
        // 2. Initial Slide (Title Layout)
        {
            id: 'slide-1',
            type: 'slide',
            w: PAGE_SIZES.A4_LANDSCAPE.w,
            h: PAGE_SIZES.A4_LANDSCAPE.h,
            bg: undefined, // Transparent bg, uses master's
            masterId: 'master-title' // Linked to Title Master
        }
    ],
    // Initial nodes: Master Nodes + Slide Nodes (Title Layout)
    nodes: [
        ...INITIAL_MASTERS.flatMap((m: any) => m.nodes),
        ...(SLIDE_LAYOUTS.find((l: any) => l.id === 'title')?.generateNodes('slide-1', PAGE_SIZES.A4_LANDSCAPE.w, PAGE_SIZES.A4_LANDSCAPE.h) || [])
    ],
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
    const lastSlideIdRef = useRef<string | null>(null) // To restore slide after master edit

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

    // Add Slide with Layout
    const handleAddSlide = useCallback((layoutId: any) => {
        // layoutId is LayoutType
        const layout = SLIDE_LAYOUTS.find(l => l.id === layoutId) || SLIDE_LAYOUTS[0] // fallback

        // Helper to generate nodes for a surface
        const generateLayoutNodes = (surfaceId: string, w: number, h: number) => {
            return layout.generateNodes(surfaceId, w, h) || []
        }

        if (isMasterEditMode) {
            // Create a NEW MASTER
            const newMasterId = `master-${crypto.randomUUID()}`
            const newSurface = {
                id: newMasterId,
                type: 'slide',
                w: currentSlide?.w || PAGE_SIZES.A4_LANDSCAPE.w,
                h: currentSlide?.h || PAGE_SIZES.A4_LANDSCAPE.h,
                bg: '#ffffff',
                // masterId: undefined (It is a master)
            } as const

            // For master, maybe we don't add title/body placeholders? 
            // Or we do, but they will be static content on all slides.
            // For now, let's add them so the user has something to edit/turn into background.
            const newNodes = generateLayoutNodes(newMasterId, newSurface.w, newSurface.h)

            setDoc(prev => ({
                ...prev,
                surfaces: [newSurface, ...prev.surfaces], // Add to top? Or after current? 
                // Masters usually stored at logical start, but order in surfaces array doesn't strictly matter for rendering priority (we filter).
                // Let's Add to top (start of array) so it's consistent.
                nodes: [...prev.nodes, ...newNodes]
            }))
            setCurrentSlideId(newMasterId)

        } else {
            // Create a Normal Slide
            const newSlideId = `slide-${crypto.randomUUID()}`
            // Inherit master based on selected layout
            const targetMasterId = `master-${layoutId}`
            // Check if it exists?
            const masterSurface = doc.surfaces.find(s => s.id === targetMasterId)
            // Fallback to 'master-blank' if not found
            const safeMasterId = masterSurface ? targetMasterId : 'master-blank'

            const newSurface = {
                id: newSlideId,
                type: 'slide',
                w: currentSlide?.w || PAGE_SIZES.A4_LANDSCAPE.w,
                h: currentSlide?.h || PAGE_SIZES.A4_LANDSCAPE.h,
                bg: undefined, // Transparent, use master
                masterId: safeMasterId
            } as const

            // Generate Nodes: Clone Placeholders from Master
            let newNodes: UnifiedNode[] = []
            if (masterSurface) {
                const masterPlaceholders = doc.nodes.filter(n => n.s === masterSurface.id && n.isPlaceholder)
                newNodes = masterPlaceholders.map(n => ({
                    ...n,
                    id: `${n.t}-${crypto.randomUUID()}`, // new ID
                    s: newSlideId, // retarget to new slide
                    // keep isPlaceholder? Or remove?
                    // If we keep it, it helps identify them. But usually they become "content".
                    // Let's keep strict "isPlaceholder" for Master defs.
                    // But if we ever want to "Reset Slide", we need to know linked placeholders.
                    // For now, let's remove isPlaceholder or treat them as normal nodes.
                    isPlaceholder: undefined,
                    locked: false // Ensure editable
                }))
            }

            // Fallback: If no placeholders found (or master not found), use factory?
            // But if master is 'blank', empty nodes is correct.
            // If master HAS placeholders, we copied them.
            // If master was just created via factory, it HAS placeholders.
            // So this logic covers everything.

            setDoc(prev => {
                // Insert after current slide
                const currentIndex = prev.surfaces.findIndex(s => s.id === currentSlideId)
                const insertIndex = currentIndex >= 0 ? currentIndex + 1 : prev.surfaces.length

                const newSurfaces = [...prev.surfaces]
                newSurfaces.splice(insertIndex, 0, newSurface)

                return {
                    ...prev,
                    surfaces: newSurfaces,
                    nodes: [...prev.nodes, ...newNodes]
                }
            }, { saveToHistory: true })

            setCurrentSlideId(newSlideId)
        }

    }, [currentSlideId, currentSlide, isMasterEditMode, setDoc])

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

    // Master Actions
    const handleSaveMaster = useCallback(() => {
        // In a real app, this might start a download or save to backend
        console.log('Saving Master...', doc)
        alert('Master saved (logged to console)')
    }, [doc])

    const handleSelectTemplate = useCallback((templateId: string) => {
        const template = SLIDE_TEMPLATES.find(t => t.id === templateId)
        if (!template) return

        setDoc(prev => {
            const masterSurfaces = prev.surfaces.filter(s => s.masterId === undefined && s.type === 'slide')

            // 1. Update Surfaces (Background)
            const newSurfaces = prev.surfaces.map(s => {
                if (masterSurfaces.find(m => m.id === s.id)) {
                    return { ...s, bg: template.master.bg }
                }
                return s
            })

            // 2. Update Nodes
            // For each master, we want to:
            //   - Keep Placeholders (Title, Content boxes)
            //   - Remove existing Background decorations
            //   - Add new Template nodes (cloned for each master)

            let newNodes = prev.nodes.filter(n => {
                // Keep nodes that are NOT on a master surface
                if (!masterSurfaces.find(m => m.id === n.s)) return true
                // Keep nodes on master if they are placeholders
                if (n.isPlaceholder) return true
                // Also keep slide numbers? They are dynamic content, but template might provide its own styling for them.
                // Our template definition includes 'master-text-page-num'.
                // So we should remove existing slide numbers to avoid duplicate/clashing styles.
                return false
            }).map(n => {
                // Apply Template Text Color to Placeholders
                if (n.isPlaceholder && n.t === 'text' && template.master.textColor) {
                    return { ...n, fill: template.master.textColor }
                }
                return n
            })

            // Add Template Nodes for each Master
            masterSurfaces.forEach(master => {
                const templateNodesForMaster = template.master.nodes.map(n => ({
                    ...n,
                    id: `${n.t}-${crypto.randomUUID()}`, // New ID
                    s: master.id, // Retarget to this master
                }))
                newNodes = [...newNodes, ...templateNodesForMaster]
            })

            return {
                ...prev,
                surfaces: newSurfaces,
                nodes: newNodes
            }
        })
    }, [setDoc])

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
                isMasterEditMode={isMasterEditMode}
                onToggleMasterEdit={handleToggleMasterEdit}
                onSaveMaster={handleSaveMaster}
                onSelectTemplate={handleSelectTemplate}
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
