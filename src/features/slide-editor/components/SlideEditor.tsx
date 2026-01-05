import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Rect } from 'react-konva'
import {
  KonvaCanvasEditor,
  type KonvaCanvasEditorHandle,
} from '@/components/canvas/KonvaCanvasEditor'
import { PAGE_SIZES } from '@/constants/pageSizes'
import { WysiwygPropertiesPanel } from '@/features/report-editor/components/PropertyPanel/WysiwygPropertiesPanel'
import type { Doc, UnifiedNode } from '@/types/canvas'
import { useFitToScreen } from '../hooks/useFitToScreen'
import { useMasterModeToggle } from '../hooks/useMasterModeToggle'

import { useSlideHistory } from '../hooks/useSlideHistory'
import { useSlideOperations } from '../hooks/useSlideOperations'
import { exportToPptx } from '../utils/pptxExport'
import { INITIAL_DOC } from '../utils/slideFactories'
import {
  getSlidePageNumber,
  isMasterSurface,
  mergeDisplayNodes,
  processMasterNodesForDisplay,
} from '../utils/slideHelpers'
import { PresentationMode } from './PresentationMode'
import { SlideListPanel } from './SlideListPanel'
import { TopToolbar } from './TopToolbar'

interface SavedMasterSummary {
  id: string
  title: string
}

interface SlideEditorProps {
  loadDoc?: Doc
  loadNonce?: number
  onDocChange?: (doc: Doc) => void
  onMasterModeChange?: (isMasterMode: boolean) => void
  savedMasters?: SavedMasterSummary[]
  onLoadSavedMaster?: (masterId: string) => void
  toolbarActions?: React.ReactNode
}

export const SlideEditor: React.FC<SlideEditorProps> = ({
  loadDoc,
  loadNonce,
  onDocChange,
  onMasterModeChange,
  savedMasters,
  onLoadSavedMaster,
  toolbarActions,
}) => {
  const { doc, setDoc, undo, redo, canUndo, canRedo, reset } = useSlideHistory(INITIAL_DOC)
  const [currentSlideId, setCurrentSlideId] = useState<string>(() => {
    return doc.surfaces.find((s) => !!s.masterId)?.id || doc.surfaces[0]?.id || ''
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [activeTool, setActiveTool] = useState('select')
  const [isPresentationMode, setIsPresentationMode] = useState(false)
  const [showGrid, setShowGrid] = useState(false)
  const [gridSize, setGridSize] = useState(15)
  const [snapStrength, setSnapStrength] = useState(5)

  const editorContainerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<KonvaCanvasEditorHandle>(null)
  const lastLoadNonceRef = useRef<number | undefined>(undefined)

  useEffect(() => {
    onDocChange?.(doc)
  }, [doc, onDocChange])

  useEffect(() => {
    if (!loadDoc) return
    if (loadNonce === undefined) return
    if (lastLoadNonceRef.current === loadNonce) return

    // Find target slide first
    const nextSlideId =
      loadDoc.surfaces.find((s) => !!s.masterId)?.id || loadDoc.surfaces[0]?.id || ''

    // Reset history/doc
    reset(loadDoc)

    // Reset state
    setSelectedIds([])
    setActiveTool('select')
    setIsPresentationMode(false)
    setShowGrid(false)
    setThumbnails({})

    setCurrentSlideId(nextSlideId)

    lastLoadNonceRef.current = loadNonce
  }, [loadDoc, loadNonce, reset])

  // Ensure currentSlideId is valid
  useEffect(() => {
    if (!doc.surfaces.find((s) => s.id === currentSlideId)) {
      if (doc.surfaces.length > 0) {
        // Default to first real slide, otherwise first master
        const fallbackId = doc.surfaces.find((s) => !!s.masterId)?.id || doc.surfaces[0].id
        setCurrentSlideId(fallbackId)
      }
    }
  }, [doc.surfaces, currentSlideId])

  const currentSlide = doc.surfaces.find((s) => s.id === currentSlideId)
  // Use utility function for master detection
  const isMasterEditMode = isMasterSurface(currentSlide)

  // Notify parent of master mode changes
  useEffect(() => {
    onMasterModeChange?.(isMasterEditMode)
  }, [isMasterEditMode, onMasterModeChange])

  // Resolve Master (for Slide View)
  const masterSurfaceForSlide = currentSlide?.masterId
    ? doc.surfaces.find((s) => s.id === currentSlide.masterId)
    : null

  // Get nodes
  const masterNodes = masterSurfaceForSlide
    ? doc.nodes.filter((n) => n.s === masterSurfaceForSlide.id)
    : []
  const currentSurfaceNodes = doc.nodes.filter((n) => n.s === currentSlideId)

  // Calculate Slide Number using utility
  const pageNumber = getSlidePageNumber(doc.surfaces, currentSlideId)

  // Process Master Nodes using utility
  const processedMasterNodes = processMasterNodesForDisplay(masterNodes, pageNumber)

  // Merge for display using utility
  const displayNodes = mergeDisplayNodes(
    isMasterEditMode,
    processedMasterNodes,
    currentSurfaceNodes
  )

  // Use hook for master mode toggle
  const { handleToggleMasterEdit } = useMasterModeToggle({
    currentSlideId,
    currentSlide,
    doc,
    isMasterEditMode,
    setCurrentSlideId,
  })

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
      const dataURL = stage.toDataURL({
        pixelRatio: Number.isFinite(pixelRatio) ? pixelRatio : 0.2,
      })
      setThumbnails((prev) => ({
        ...prev,
        [currentSlideId]: dataURL,
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
  const handleCanvasChange = useCallback(
    (
      updates:
        | (Partial<UnifiedNode> & { id?: string })
        | (Partial<UnifiedNode> & { id?: string })[],
      options?: { saveToHistory?: boolean; force?: boolean }
    ) => {
      setDoc((prev) => {
        const changesArray = Array.isArray(updates) ? updates : [updates]
        const updateMap = new Map(changesArray.map((u) => [u.id!, u]))

        const nextNodes = prev.nodes.map((n) => {
          if (n.id && updateMap.has(n.id)) {
            return { ...n, ...updateMap.get(n.id) } as UnifiedNode
          }
          return n
        })
        return { ...prev, nodes: nextNodes }
      }, options)
      // Note: we rely on handleStageInteractionEnd and the effect on doc.nodes for thumbnails now
      // to avoid heavy work during drag (onChange)
    },
    [setDoc]
  )

  const { handleAddSlide, handleSelectTemplate } = useSlideOperations({
    setDoc,
    currentSlideId,
    doc,
    setCurrentSlideId,
    isMasterEditMode,
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
        savedMasters={savedMasters}
        onLoadSavedMaster={onLoadSavedMaster}
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
        <div
          className="flex-1 relative overflow-hidden bg-gray-100 dark:bg-gray-900"
          ref={editorContainerRef}
        >
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
                    isMasterEditMode
                      ? currentSlide?.bg || '#ffffff'
                      : // If editing slide, use slide bg. If slide bg missing, use master bg.
                        currentSlide?.bg || masterSurfaceForSlide?.bg || '#ffffff'
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
                  setDoc((prev) => ({
                    ...prev,
                    nodes: prev.nodes.filter((n) => !selectedIds.includes(n.id)),
                  }))
                }
              }}
              onCreateElements={(newNodes) => {
                // Paste creates new nodes on the current surface
                const nodesWithSurface = newNodes.map((n) => ({
                  ...n,
                  s: currentSlideId,
                }))
                setDoc((prev) => ({
                  ...prev,
                  nodes: [...prev.nodes, ...nodesWithSurface],
                }))
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
    </div>
  )
}
