import { PEN_CURSOR_URL } from '../cursors'
import type Konva from 'konva'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Image as KonvaImage, Rect as KonvaRect, Layer, Stage } from 'react-konva'
import { CanvasElementRenderer } from '../../../components/canvas/CanvasElementRenderer'
import { useKeyboardShortcuts } from '../../../components/canvas/hooks/useKeyboardShortcuts'
// import { TextEditOverlay } from '../../../components/canvas/TextEditOverlay' // Comment out if not immediately available or needs update
import type { TextNode, UnifiedNode, Doc, Surface, SignatureNode } from '../../../types/canvas' // Direct import
import { createContextLogger } from '../../../utils/logger'
import { findImageWithExtension } from './pdf-editor/components/WysiwygCanvas/canvasImageUtils'
import { simplifyPoints } from '../../../utils/geometry'

const log = createContextLogger('ReportKonvaEditor')

export interface ReportKonvaEditorHandle {
  downloadImage: () => void
  flushSignature: () => Doc | null
}

interface ReportKonvaEditorProps {
  templateDoc: Doc
  zoom: number
  selectedElementId?: string
  onElementSelect: (element: UnifiedNode | null) => void
  onTemplateChange: (doc: Doc) => void
  currentPageId?: string
  onUndo?: () => void
  onRedo?: () => void
  orientation?: 'portrait' | 'landscape'
  onSelectedCellChange?: (cell: { elementId: string; row: number; col: number } | null) => void
  activeTool?: string
  drawingSettings?: { stroke: string; strokeWidth: number; tolerance?: number }
}

const PageBackground = ({
  width,
  height,
  surface,
}: {
  width: number
  height: number
  surface: Surface
}) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  const bg = surface.bg
  const isColor = bg ? (bg.startsWith('#') || bg.startsWith('rgb')) : true

  useEffect(() => {
    if (!bg || isColor) {
      setImage(null)
      return
    }

    if (!bg.startsWith('http') && !bg.startsWith('data:')) {
      findImageWithExtension(bg).then(res => {
        if (res) setImage(res.img)
      })
    } else {
      const img = new window.Image()
      img.src = bg
      img.onload = () => setImage(img)
    }
  }, [bg, isColor])

  return (
    <>
      <KonvaRect
        name="_background"
        x={0}
        y={0}
        width={width}
        height={height}
        fill={isColor ? (bg || '#ffffff') : '#ffffff'}
        shadowColor="black"
        shadowBlur={10}
        shadowOpacity={0.1}
      />
      {image && (
        <KonvaImage
          name="_background"
          x={0}
          y={0}
          width={width}
          height={height}
          image={image}
          listening={false}
        />
      )}
    </>
  )
}

export const ReportKonvaEditor = forwardRef<ReportKonvaEditorHandle, ReportKonvaEditorProps>(
  (
    {
      templateDoc,
      zoom,
      selectedElementId,
      onElementSelect,
      onTemplateChange,
      currentPageId,
      onUndo,
      onRedo,
      // orientation = 'portrait', // unused
      // onSelectedCellChange, // Unused
      activeTool,
      drawingSettings = { stroke: '#000000', strokeWidth: 2, tolerance: 2.0 },
    },
    ref
  ) => {
    const stageRef = useRef<Konva.Stage>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [editingElementId, setEditingElementId] = useState<string | null>(null)

    // Unused state commented out
    // const [editingCell, setEditingCell] = useState<any>(null)
    // const [selectedCell] = useState<any>(null) // setSelectedCell unused

    // Signature Drawing State
    const [isDrawing, setIsDrawing] = useState(false)
    const [currentStrokes, setCurrentStrokes] = useState<number[][]>([])
    const [currentPoints, setCurrentPoints] = useState<number[]>([])

    // const [contextMenu, setContextMenu] = useState<any>(null)

    // Current Surface (Page)
    const currentSurface = templateDoc.surfaces.find((s) => s.id === currentPageId) || templateDoc.surfaces[0]

    // Filter nodes for current surface
    const nodes = templateDoc.nodes.filter((n) => n.s === currentSurface.id)

    // Page Size
    // const isLandscape = orientation === 'landscape' // unused
    const width = currentSurface.w
    const height = currentSurface.h

    const displayScale = zoom

    const handleElementSelect = (element: UnifiedNode | null) => {
      onElementSelect(element)
    }

    const handleElementChange = (updates: Partial<UnifiedNode> & { id?: string }) => {
      const targetId = updates.id || selectedElementId
      if (!targetId) return

      const nextNodes = templateDoc.nodes.map((el) => {
        if (el.id === targetId) {
          return { ...el, ...updates, id: targetId } as UnifiedNode
        }
        return el
      })
      onTemplateChange({ ...templateDoc, nodes: nextNodes })
    }

    const handleContextMenu = (e: Konva.KonvaEventObject<PointerEvent>, element: UnifiedNode) => {
      e.evt.preventDefault()
      if (element.t === 'table') {
        const stage = e.target.getStage()
        const ptr = stage?.getPointerPosition()
        if (ptr) {
          // setContextMenu logic...
        }
      }
    }

    // Signature Box Calculation
    const getStrokesBox = useCallback((strokes: number[][]) => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      strokes.forEach(stroke => {
        for (let i = 0; i < stroke.length; i += 2) {
          const x = stroke[i]
          const y = stroke[i + 1]
          if (x < minX) minX = x
          if (y < minY) minY = y
          if (x > maxX) maxX = x
          if (y > maxY) maxY = y
        }
      })
      if (minX === Infinity) return { x: 0, y: 0, w: 100, h: 50 }
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY }
    }, [])

    const commitSignature = useCallback((): Doc | null => {
      if (currentStrokes.length === 0) return null

      const simplifiedStrokes = currentStrokes.map(stroke => {
        const simplified = simplifyPoints(stroke, drawingSettings.tolerance ?? 2.5)
        if (simplified.length === 2) return [...simplified, ...simplified]
        return simplified
      })

      const box = getStrokesBox(simplifiedStrokes)

      const normalizedStrokes = simplifiedStrokes.map(stroke => {
        const newStroke: number[] = []
        for (let i = 0; i < stroke.length; i += 2) {
          let x = stroke[i] - box.x
          let y = stroke[i + 1] - box.y
          x = Math.round(x * 1000) / 1000
          y = Math.round(y * 1000) / 1000
          newStroke.push(x, y)
        }
        return newStroke
      })

      const element: SignatureNode = {
        id: `sig-${crypto.randomUUID()}`,
        t: 'signature',
        s: currentSurface.id,
        name: 'Signature',
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
        strokes: normalizedStrokes,
        stroke: drawingSettings.stroke,
        strokeW: drawingSettings.strokeWidth,
        r: 0,
        locked: false,
        hidden: false
      }

      const nextDoc = {
        ...templateDoc,
        nodes: [...templateDoc.nodes, element],
      }
      onTemplateChange(nextDoc)

      setCurrentStrokes([])
      setCurrentPoints([])
      setIsDrawing(false)
      onElementSelect(element)

      return nextDoc
    }, [currentStrokes, currentSurface.id, templateDoc, getStrokesBox, onTemplateChange, onElementSelect, drawingSettings.stroke, drawingSettings.strokeWidth, drawingSettings.tolerance])

    useEffect(() => {
      if (activeTool !== 'signature' && currentStrokes.length > 0) {
        commitSignature()
      }
    }, [activeTool, commitSignature, currentStrokes.length])

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Signature Drawing
      if (activeTool === 'signature') {
        setIsDrawing(true)
        const stage = e.target.getStage()
        const point = stage?.getPointerPosition()
        if (point) {
          const transform = stage?.getAbsoluteTransform().copy()
          transform?.invert()
          const pos = transform?.point(point)
          if (pos) {
            setCurrentPoints([pos.x, pos.y])
          }
        }
        return
      }

      // Deselect
      if (e.target === e.target.getStage() || e.target.name() === '_background') {
        handleElementSelect(null)
      }
    }

    const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Signature Drawing
      if (activeTool === 'signature' && isDrawing) {
        const stage = e.target.getStage()
        const point = stage?.getPointerPosition()
        if (point) {
          const transform = stage?.getAbsoluteTransform().copy()
          transform?.invert()
          const pos = transform?.point(point)
          if (pos) {
            setCurrentPoints(prev => [...prev, pos.x, pos.y])
          }
        }
      }
    }

    const handleStageMouseUp = () => {
      if (activeTool === 'signature' && isDrawing) {
        setIsDrawing(false)
        if (currentPoints.length > 0) {
          setCurrentStrokes(prev => [...prev, currentPoints])
          setCurrentPoints([])
        }
      }
    }

    const handleDelete = () => {
      if (selectedElementId) {
        const nextNodes = templateDoc.nodes.filter((el) => el.id !== selectedElementId)
        onTemplateChange({ ...templateDoc, nodes: nextNodes })
        onElementSelect(null)
      }
    }

    const handleSelectAll = () => {
      if (nodes.length > 0) onElementSelect(nodes[0])
    }

    const handleMove = (dx: number, dy: number) => {
      if (selectedElementId) {
        const el = nodes.find(n => n.id === selectedElementId)
        if (el && el.t !== 'line') {
          handleElementChange({ id: selectedElementId, x: (el.x || 0) + dx, y: (el.y || 0) + dy })
        }
      }
    }

    useKeyboardShortcuts({
      onUndo,
      onRedo,
      onDelete: handleDelete,
      onSelectAll: handleSelectAll,
      onMoveUp: (step) => handleMove(0, -step),
      onMoveDown: (step) => handleMove(0, step),
      onMoveLeft: (step) => handleMove(-step, 0),
      onMoveRight: (step) => handleMove(step, 0),
    })

    useImperativeHandle(ref, () => ({
      downloadImage: () => {
        if (!stageRef.current) return
        const dataURL = stageRef.current.toDataURL({ pixelRatio: 2 })
        const link = document.createElement('a')
        link.download = `report-${Date.now()}.png`
        link.href = dataURL
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      },
      flushSignature: () => {
        const result = commitSignature()
        return result
      }
    }))

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      if (!stageRef.current) return

      try {
        const jsonData = e.dataTransfer.getData('application/json')
        if (!jsonData) return
        const payload = JSON.parse(jsonData)
        if (payload.type !== 'binding') return

        const { fieldId, text } = payload.data

        stageRef.current.setPointersPositions(e)
        const stagePos = stageRef.current.getPointerPosition()
        if (!stagePos) return
        const logicX = stagePos.x / displayScale
        const logicY = stagePos.y / displayScale

        const newElement: TextNode = {
          id: `field-${crypto.randomUUID()}`,
          t: 'text',
          s: currentSurface.id,
          name: fieldId,
          text: text,
          font: 'Helvetica',
          fontSize: 12,
          fill: '#0000ff',
          align: 'l',
          x: logicX,
          y: logicY,
          w: 150,
          h: 20,
          bind: fieldId,
        }

        const nextDoc = {
          ...templateDoc,
          nodes: [...templateDoc.nodes, newElement],
        }
        onTemplateChange(nextDoc)
        onElementSelect(newElement)
      } catch (err) {
        log.error('Failed to handle drop', err)
      }
    }

    return (
      <div
        className="relative w-full h-full bg-gray-100 overflow-auto flex justify-start items-start p-2 scrollbar-thin cursor-default"
        ref={containerRef}
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
        onDrop={handleDrop}
      >
        <div className="relative shadow-lg border-2 border-gray-500 w-fit h-fit">
          <Stage
            width={width * displayScale}
            height={height * displayScale}
            scaleX={displayScale}
            scaleY={displayScale}
            ref={stageRef}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            style={{
              cursor: activeTool === 'signature' ? PEN_CURSOR_URL : 'default'
            }}
          >
            <Layer name="background-layer" listening={false}>
              <PageBackground width={width} height={height} surface={currentSurface} />
            </Layer>
            <Layer name="content-layer" listening={activeTool !== 'signature'}>
              {nodes.map((element) => (
                <CanvasElementRenderer
                  key={element.id}
                  element={element}
                  isSelected={element.id === selectedElementId}
                  onSelect={() => handleElementSelect(element)}
                  onChange={handleElementChange}
                  onDblClick={() => {
                    if (activeTool !== 'signature' && element.t === 'text') setEditingElementId(element.id)
                  }}
                  onContextMenu={(e) => handleContextMenu(e, element)}
                  isEditing={element.id === editingElementId}
                />
              ))}
              {(currentStrokes.length > 0 || currentPoints.length > 0) && (
                <CanvasElementRenderer
                  key="active-signature"
                  element={{
                    id: 'active-signature',
                    t: 'signature',
                    s: currentSurface.id,
                    name: 'Signature',
                    x: 0, y: 0, w: 0, h: 0,
                    strokes: [...currentStrokes, ...(currentPoints.length > 0 ? [currentPoints] : [])].map(s => s.length === 2 ? [...s, ...s] : s),
                    stroke: drawingSettings.stroke,
                    strokeW: drawingSettings.strokeWidth,
                  } as SignatureNode}
                  isSelected={false}
                  onSelect={() => { }}
                  onChange={() => { }}
                />
              )}
            </Layer>
          </Stage>
        </div>
      </div>
    )
  }
)
