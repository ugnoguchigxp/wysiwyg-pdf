import type Konva from 'konva'
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { Rect as KonvaRect, Layer, Stage, Line as KonvaLine } from 'react-konva'
import { CanvasElementRenderer } from '@/components/canvas/CanvasElementRenderer'
import { CellEditOverlay } from '@/components/canvas/CellEditOverlay'
import { GridLayer } from '@/components/canvas/GridLayer'
import { useKeyboardShortcuts } from '@/components/canvas/hooks/useKeyboardShortcuts'
import { ObjectContextMenu } from '@/components/canvas/ObjectContextMenu'
import { TextEditOverlay } from '@/components/canvas/TextEditOverlay'
import type { Doc, TableNode, TextNode, UnifiedNode } from '@/types/canvas' // Direct import
import { generateUUID, safeLocalStorage } from '@/utils/browser'
import { mmToPx, ptToMm } from '@/utils/units'
import { simplifyPoints } from '@/utils/geometry'
import { calculatePasteNodes } from './utils/clipboardUtils'
// Table operations imports removed (unused)
// Signature utils moved to useSignature
// import { reorderNodes } from '@/utils/reorderUtils' // Moved to hook
import { TableContextMenu } from './components/ContextMenu/TableContextMenu'
import { useNodeOperations } from './hooks/useNodeOperations'
import { useReportContextMenu } from './hooks/useReportContextMenu'
import { useSignature } from './hooks/useSignature'

// const log = createContextLogger('ReportKonvaEditor') // Removed unused

const dpi = 96

import { PageBackground } from './components/PageBackground'

export interface ReportKonvaEditorHandle {
  downloadImage: () => void
  flushSignature: () => Doc | null
}

interface ReportKonvaEditorProps {
  templateDoc: Doc
  zoom: number
  selectedElementId?: string
  onElementSelect: (element: UnifiedNode | null) => void
  onTemplateChange: (doc: Doc, options?: { saveToHistory?: boolean; force?: boolean }) => void
  currentPageId?: string
  onUndo?: () => void
  onRedo?: () => void
  orientation?: 'portrait' | 'landscape'
  onSelectedCellChange?: (cell: { elementId: string; row: number; col: number } | null) => void
  activeTool?: string
  drawingSettings?: {
    stroke: string
    strokeWidth: number
    simplification?: number
  }
  showGrid?: boolean
  // snapStrength?: number // Removed unused
  gridSize?: number
}

import { getCellAt, getColWidth, getColX, getRowHeight, getRowY } from './utils/tableUtils'

// PageBackground moved to components/PageBackground

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
      onSelectedCellChange,
      activeTool,
      drawingSettings = {
        stroke: '#000000',
        strokeWidth: 0.2,
        simplification: 0,
      },
      showGrid = false,
      // snapStrength = 0, // Removed unused
      gridSize = 50,
    },
    ref
  ) => {
    const stageRef = useRef<Konva.Stage>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [editingElementId, setEditingElementId] = useState<string | null>(null)
    const [pasteCount, setPasteCount] = useState(1)

    const [selectedCell, setSelectedCell] = useState<{
      elementId: string
      row: number
      col: number
    } | null>(null)

    const [editingCell, setEditingCell] = useState<{
      elementId: string
      row: number
      col: number
    } | null>(null)

    // Sync selectedCell to parent
    useEffect(() => {
      onSelectedCellChange?.(selectedCell)
    }, [selectedCell, onSelectedCellChange])

    // Current Surface (Page)
    const currentSurface =
      templateDoc.surfaces.find((s) => s.id === currentPageId) || templateDoc.surfaces[0]

    // Filter nodes for current surface
    const nodes = templateDoc.nodes.filter((n) => n.s === currentSurface.id)

    const selectedNode = useMemo(() => {
      if (!selectedElementId) return null
      return templateDoc.nodes.find((n) => n.id === selectedElementId) || null
    }, [selectedElementId, templateDoc.nodes])

    const selectedTable = selectedNode?.t === 'table' ? (selectedNode as TableNode) : null

    const editingElement = useMemo(() => {
      if (!editingElementId) return null
      const node = templateDoc.nodes.find((n) => n.id === editingElementId)
      if (!node || node.t !== 'text') return null
      return node as TextNode
    }, [editingElementId, templateDoc.nodes])

    const selectedCellBox = useMemo(() => {
      if (!selectedTable || !selectedCell || selectedCell.elementId !== selectedTable.id)
        return null

      const cell = selectedTable.table.cells.find(
        (c) => c.r === selectedCell.row && c.c === selectedCell.col
      )
      const rs = cell?.rs || 1
      const cs = cell?.cs || 1

      const x = (selectedTable.x || 0) + getColX(selectedTable.table.cols, selectedCell.col)
      const y = (selectedTable.y || 0) + getRowY(selectedTable.table.rows, selectedCell.row)
      const w = getColWidth(selectedTable.table.cols, selectedCell.col, cs)
      const h = getRowHeight(selectedTable.table.rows, selectedCell.row, rs)

      return { x, y, w, h }
    }, [selectedCell, selectedTable])

    // Page Size
    // const isLandscape = orientation === 'landscape' // unused
    const width = currentSurface.w
    const height = currentSurface.h

    const displayScale = zoom * mmToPx(1, { dpi })

    const handleElementSelect = (element: UnifiedNode | null) => {
      onElementSelect(element)
    }

    // === Use Extracted Hooks ===
    const { handleElementChange, handleTextUpdate, handleTextEditFinish } = useNodeOperations({
      templateDoc,
      onTemplateChange,
      selectedElementId: selectedElementId,
      editingElementId,
      setEditingElementId,
    })

    const {
      currentStrokes,
      currentPoints,
      commitSignature,
      handleSignatureMouseDown,
      handleSignatureMouseMove,
      handleSignatureMouseUp,
    } = useSignature({
      templateDoc,
      onTemplateChange,
      currentSurface,
      onElementSelect,
      drawingSettings,
    })

    const {
      contextMenu,
      setContextMenu,
      handleContextMenu,
      handleReorder,
      handleContextMenuAction,
    } = useReportContextMenu({
      templateDoc,
      onTemplateChange,
      stageRef,
      activeTool,
      setSelectedCell,
      setEditingCell,
      onElementSelect,
      selectedElementId,
    })

    useEffect(() => {
      if (activeTool !== 'signature' && currentStrokes.length > 0) {
        commitSignature()
      }
    }, [activeTool, commitSignature, currentStrokes.length])

    const handleStageMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (activeTool === 'signature') {
        handleSignatureMouseDown(e)
        return
      }

      const stage = e.target.getStage()
      const interestedInBackground = e.target === stage || e.target.name() === '_background'

      if (interestedInBackground) {
        handleElementSelect(null)
        setSelectedCell(null)
        setEditingCell(null)
      }
    }

    const handleStageMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      handleSignatureMouseMove(e)
    }

    const handleStageMouseUp = () => {
      handleSignatureMouseUp()
    }

    const handleCellUpdate = (val: string) => {
      if (!editingCell || !selectedTable) return

      const newCells = [...selectedTable.table.cells]
      const idx = newCells.findIndex((c) => c.r === editingCell.row && c.c === editingCell.col)

      if (idx >= 0) {
        newCells[idx] = { ...newCells[idx], v: val, richText: undefined }
      } else {
        // New cell data (inherit defaults or just v)
        newCells.push({
          r: editingCell.row,
          c: editingCell.col,
          v: val,
        })
      }

      const newTable = {
        ...selectedTable,
        table: {
          ...selectedTable.table,
          cells: newCells,
        },
      }

      handleElementChange(newTable)
    }

    const handleCellEditFinish = () => {
      setEditingCell(null)
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
        const el = nodes.find((n) => n.id === selectedElementId)
        if (el && el.t !== 'line') {
          handleElementChange({
            id: selectedElementId,
            x: (el.x || 0) + dx,
            y: (el.y || 0) + dy,
          })
        }
      }
    }

    const handleCopy = () => {
      if (!selectedElementId) return
      const selected = nodes.find((n) => n.id === selectedElementId)
      if (selected) {
        const clipboardData = [selected]
        safeLocalStorage.setItem('__konva_clipboard', JSON.stringify(clipboardData))
        setPasteCount(1)
      }
    }

    const handlePaste = () => {
      try {
        const json = safeLocalStorage.getItem('__konva_clipboard')
        if (!json) return
        const clipboardElements = JSON.parse(json) as UnifiedNode[]

        if (!Array.isArray(clipboardElements) || clipboardElements.length === 0) return

        const newNodes = calculatePasteNodes(
          clipboardElements,
          currentSurface.id,
          currentSurface.w,
          pasteCount
        )

        onTemplateChange({
          ...templateDoc,
          nodes: [...templateDoc.nodes, ...newNodes],
        })

        if (newNodes.length > 0) {
          onElementSelect(newNodes[newNodes.length - 1])
        }

        setPasteCount((c) => c + 1)
      } catch (e) {
        console.error('Failed to paste elements', e)
      }
    }

    useKeyboardShortcuts({
      onUndo,
      onRedo,
      onDelete: handleDelete,
      onCopy: handleCopy,
      onPaste: handlePaste,
      onSelectAll: handleSelectAll,
      onMoveUp: (step) => handleMove(0, -step),
      onMoveDown: (step) => handleMove(0, step),
      onMoveLeft: (step) => handleMove(-step, 0),
      onMoveRight: (step) => handleMove(step, 0),
    })

    useImperativeHandle(ref, () => ({
      downloadImage: () => {
        if (!stageRef.current) return
        const stage = stageRef.current

        const gridLayer = stage.findOne('.grid-layer')
        const wasGridVisible = gridLayer?.visible()
        const tableHeaders = stage.find('.table-header-ui')

        const transformers = (stage.find('Transformer') as unknown as Konva.Node[]).filter(
          (n): n is Konva.Transformer => n.getClassName?.() === 'Transformer'
        )
        const transformerVisibility = transformers.map((tr) => tr.visible())

        try {
          gridLayer?.hide()
          tableHeaders.forEach((n) => {
            n.hide()
          })
          transformers.forEach((tr) => {
            tr.hide()
          })

          const dataURL = stage.toDataURL({ pixelRatio: 2 })

          const link = document.createElement('a')
          link.download = `report-${Date.now()}.png`
          link.href = dataURL
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        } finally {
          if (gridLayer && wasGridVisible) {
            gridLayer.show()
          }
          tableHeaders.forEach((n) => {
            n.show()
          })
          transformers.forEach((tr, idx) => {
            const prev = transformerVisibility[idx]
            if (prev) tr.show()
          })
        }
      },
      flushSignature: () => {
        const result = commitSignature()
        return result
      },
    }))

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      if (!stageRef.current) return

      try {
        const jsonData = e.dataTransfer.getData('application/json')
        if (!jsonData) return
        const payload = JSON.parse(jsonData)
        if (payload.type !== 'binding') return

        const { text, fieldId } = payload.data

        stageRef.current.setPointersPositions(e)
        const stagePos = stageRef.current.getPointerPosition()
        if (!stagePos) return
        const logicX = stagePos.x / displayScale
        const logicY = stagePos.y / displayScale

        const newNode: TextNode = {
          id: `text-${generateUUID()}`,
          t: 'text',
          s: currentSurface.id,
          x: logicX,
          y: logicY,
          w: 100,
          h: 10,
          text: `{${text}}`,
          bind: fieldId,
          fontSize: ptToMm(10),
          fill: '#000000',
          align: 'l', // Fixed align type
          vertical: false,
        }

        onTemplateChange({
          ...templateDoc,
          nodes: [...templateDoc.nodes, newNode],
        })
        onElementSelect(newNode)
      } catch (e) {
        console.error('Failed to parse drop data', e)
      }
    }

    return (
      <div
        ref={containerRef}
        className="w-full h-full bg-editor-canvas overflow-auto flex scrollbar-thin p-8"
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'copy'
        }}
      >
        <div className="relative bg-white shadow-lg border border-gray-200 dark:border-gray-700">
          <Stage
            width={width * displayScale}
            height={height * displayScale}
            scaleX={displayScale}
            scaleY={displayScale}
            ref={stageRef}
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            onTouchStart={handleStageMouseDown}
            onTouchMove={(e) => handleStageMouseMove(e)}
            onTouchEnd={() => handleStageMouseUp()}
            style={{ touchAction: 'none' }}
          >
            <Layer>
              <PageBackground width={width} height={height} surface={currentSurface} />
              <GridLayer
                width={width}
                height={height}
                gridSize={gridSize}
                scale={displayScale}
                visible={showGrid}
              />
            </Layer>
            <Layer>
              {nodes.map((element) => (
                <CanvasElementRenderer
                  key={element.id}
                  element={element}
                  isSelected={selectedElementId === element.id}
                  onSelect={() => {
                    handleElementSelect(element)
                    if (contextMenu && contextMenu.elementId !== element.id) {
                      setContextMenu(null)
                    }
                  }}
                  onCellClick={(elementId, r, c) => {
                    // Handle cell selection directly from TableRenderer event
                    if (element.t === 'table' && element.id === elementId) {
                      setSelectedCell({ elementId, row: r, col: c })
                      // Also ensure the table itself is selected
                      handleElementSelect(element)
                    }
                  }}
                  onCellDblClick={(elementId, r, c) => {
                    // Handle cell editing directly from TableRenderer event
                    if (element.t === 'table' && element.id === elementId) {
                      setEditingCell({ elementId, row: r, col: c })
                      setSelectedCell({ elementId, row: r, col: c })
                      handleElementSelect(element)
                    }
                  }}
                  onChange={handleElementChange}
                  onDblClick={() => {
                    if (element.t === 'text') {
                      setEditingElementId(element.id)
                    } else if (element.t === 'table') {
                      const cell = getCellAt(
                        element,
                        stageRef.current?.getPointerPosition() || null,
                        displayScale
                      )
                      if (cell) {
                        setEditingCell({ elementId: element.id, ...cell })
                        setSelectedCell({ elementId: element.id, ...cell }) // Also select it
                      }
                    }
                  }}
                  isEditing={editingElementId === element.id}
                  stageScale={displayScale}
                  allElements={nodes}
                  onContextMenu={(e) => handleContextMenu(e, element)}
                />
              ))}

              {selectedCellBox && (
                <KonvaRect
                  x={selectedCellBox.x}
                  y={selectedCellBox.y}
                  width={selectedCellBox.w}
                  height={selectedCellBox.h}
                  stroke="#3b82f6"
                  strokeWidth={2 / displayScale}
                  listening={false}
                />
              )}

              {/* Transient drawing strokes */}
              {activeTool === 'signature' && (
                <>
                  {currentStrokes.map((stroke, i) => {
                    const points =
                      drawingSettings.simplification && drawingSettings.simplification > 0
                        ? simplifyPoints(stroke, drawingSettings.simplification)
                        : stroke
                    return (
                      <KonvaLine
                        key={`committed-${i}`}
                        points={points}
                        stroke={drawingSettings.stroke}
                        strokeWidth={drawingSettings.strokeWidth}
                        tension={0.5}
                        lineCap="round"
                        lineJoin="round"
                        listening={false}
                      />
                    )
                  })}
                  {currentPoints.length > 0 && (
                    <KonvaLine
                      points={
                        drawingSettings.simplification && drawingSettings.simplification > 0
                          ? simplifyPoints(currentPoints, drawingSettings.simplification)
                          : currentPoints
                      }
                      stroke={drawingSettings.stroke}
                      strokeWidth={drawingSettings.strokeWidth}
                      tension={0.5}
                      lineCap="round"
                      lineJoin="round"
                      listening={false}
                    />
                  )}
                </>
              )}
            </Layer>
          </Stage>

          {editingElement && (
            <TextEditOverlay
              element={editingElement}
              scale={displayScale}
              stageNode={stageRef.current}
              onUpdate={handleTextUpdate}
              onFinish={handleTextEditFinish}
            />
          )}

          {editingCell && selectedTable && (
            <CellEditOverlay
              tableNode={selectedTable}
              cell={editingCell}
              stageNode={stageRef.current}
              scale={displayScale}
              onUpdate={handleCellUpdate}
              onFinish={handleCellEditFinish}
            />
          )}

          {contextMenu && contextMenu.type === 'table' && (
            <TableContextMenu
              visible={contextMenu.visible}
              x={contextMenu.x}
              y={contextMenu.y}
              onAction={handleContextMenuAction}
              onClose={() => setContextMenu(null)}
            />
          )}

          {contextMenu && contextMenu.type === 'object' && (
            <ObjectContextMenu
              visible={contextMenu.visible}
              x={contextMenu.x}
              y={contextMenu.y}
              onAction={handleReorder}
              onClose={() => setContextMenu(null)}
            />
          )}
        </div>
      </div>
    )
  }
)

ReportKonvaEditor.displayName = 'ReportKonvaEditor'
