import type Konva from 'konva'
import type React from 'react'
import { useRef } from 'react'
import { Circle, Group, Line } from 'react-konva'
import type { Anchor, LineNode, UnifiedNode } from '@/types/canvas'
import { LineMarker } from '../LineMarker'
import type { CanvasElementCommonProps } from '../types'
import { getAnchorPointAndDirection, getOrthogonalPath } from '../utils/connectionRouting'
import { isWHElement } from '../utils/elementUtils'

interface LineRendererProps {
  element: LineNode
  commonProps: CanvasElementCommonProps
  isSelected: boolean
  readOnly?: boolean
  allElements?: UnifiedNode[]
  showGrid?: boolean
  gridSize?: number
  snapStrength?: number
  invScale: number
  onChange: (
    newAttrs: (Partial<UnifiedNode> & { id?: string }) | (Partial<UnifiedNode> & { id?: string })[]
  ) => void
}

export const LineRenderer: React.FC<LineRendererProps> = ({
  element,
  commonProps,
  isSelected,
  readOnly,
  allElements,
  showGrid,
  gridSize = 15,
  snapStrength = 5,
  invScale,
  onChange,
}) => {
  const line = element
  const nodesForSnap = (allElements || []).filter((n) => n.id !== line.id)

  const isLineHandleDraggingRef = useRef(false)
  const lineVisualRef = useRef<Konva.Line | null>(null)
  const lineStartHandleRef = useRef<Konva.Circle | null>(null)
  const lineEndHandleRef = useRef<Konva.Circle | null>(null)
  const lineStartMarkerGroupRef = useRef<Konva.Group | null>(null)
  const lineEndMarkerGroupRef = useRef<Konva.Group | null>(null)
  const lineDraftPtsRef = useRef<number[] | null>(null)

  const anchorOverlayGroupRef = useRef<Konva.Group | null>(null)
  const anchorCircleMapRef = useRef<Map<string, Konva.Circle>>(new Map())
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const lastHighlightedAnchorKeyRef = useRef<string | null>(null)

  type Conn = { nodeId: string; anchor: Anchor } | undefined | null
  const startConnDraftRef = useRef<Conn>(undefined)
  const endConnDraftRef = useRef<Conn>(undefined)

  const anchors: Anchor[] = ['tl', 't', 'tr', 'l', 'r', 'bl', 'b', 'br']

  const getAnchorPoint = (n: UnifiedNode, anchor: Anchor): { x: number; y: number } | null => {
    if (n.t === 'line') return null
    if (n.x === undefined || n.y === undefined || n.w === undefined || n.h === undefined)
      return null
    const x = n.x
    const y = n.y
    const w = n.w
    const h = n.h
    switch (anchor) {
      case 'tl':
        return { x, y }
      case 't':
        return { x: x + w / 2, y }
      case 'tr':
        return { x: x + w, y }
      case 'l':
        return { x, y: y + h / 2 }
      case 'r':
        return { x: x + w, y: y + h / 2 }
      case 'bl':
        return { x, y: y + h }
      case 'b':
        return { x: x + w / 2, y: y + h }
      case 'br':
        return { x: x + w, y: y + h }
      default:
        return { x: x + w / 2, y: y + h / 2 }
    }
  }

  const resolveEndpoint = (
    conn: LineNode['startConn'] | LineNode['endConn'] | undefined
  ): { x: number; y: number } | null => {
    if (!conn) return null
    const target = nodesForSnap.find((n) => n.id === conn.nodeId)
    if (!target) return null
    return getAnchorPoint(target, conn.anchor)
  }

  const basePts = line.pts || [0, 0, 100, 0]
  const resolvedStart = resolveEndpoint(line.startConn)
  const resolvedEnd = resolveEndpoint(line.endConn)

  // Use resolved endpoints for rendering (connector follow)
  const pts = [...basePts]
  if (resolvedStart) {
    pts[0] = resolvedStart.x
    pts[1] = resolvedStart.y
  }
  if (resolvedEnd) {
    pts[pts.length - 2] = resolvedEnd.x
    pts[pts.length - 1] = resolvedEnd.y
  }

  const snapStep = showGrid && gridSize > 0 ? gridSize : snapStrength > 0 ? snapStrength : 0

  const snapToGrid = (pos: { x: number; y: number }) => {
    if (!snapStep) return pos
    return {
      x: Math.round(pos.x / snapStep) * snapStep,
      y: Math.round(pos.y / snapStep) * snapStep,
    }
  }

  const snapAngle = (
    moving: { x: number; y: number },
    fixed: { x: number; y: number },
    step: number
  ) => {
    const dx = moving.x - fixed.x
    const dy = moving.y - fixed.y
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const angle = Math.atan2(dy, dx)
    const dist = Math.sqrt(dx * dx + dy * dy)
    const snapAngle = Math.round(angle / step) * step
    return {
      x: fixed.x + Math.cos(snapAngle) * dist,
      y: fixed.y + Math.sin(snapAngle) * dist,
    }
  }

  const applyDraftToVisuals = (draftPts: number[]) => {
    const endIdx = Math.max(0, draftPts.length - 2)
    // Update line + endpoint handles
    lineVisualRef.current?.points(draftPts)
    lineStartHandleRef.current?.position({ x: draftPts[0], y: draftPts[1] })
    lineEndHandleRef.current?.position({
      x: draftPts[endIdx],
      y: draftPts[endIdx + 1],
    })

    // Update arrow markers (position + rotation)
    const dx = draftPts[endIdx] - draftPts[0]
    const dy = draftPts[endIdx + 1] - draftPts[1]
    const angleToEnd = Math.atan2(dy, dx)
    const angleToStart = angleToEnd + Math.PI

    if (lineStartMarkerGroupRef.current) {
      lineStartMarkerGroupRef.current.position({
        x: draftPts[0],
        y: draftPts[1],
      })
      lineStartMarkerGroupRef.current.rotation((angleToStart * 180) / Math.PI)
    }
    if (lineEndMarkerGroupRef.current) {
      lineEndMarkerGroupRef.current.position({
        x: draftPts[endIdx],
        y: draftPts[endIdx + 1],
      })
      lineEndMarkerGroupRef.current.rotation((angleToEnd * 180) / Math.PI)
    }

    lineVisualRef.current?.getLayer()?.batchDraw()
  }

  const startHandleDrag = (e: Konva.KonvaEventObject<DragEvent>) => {
    isLineHandleDraggingRef.current = true
    lineDraftPtsRef.current = [...pts]
    startConnDraftRef.current = line.startConn
    endConnDraftRef.current = line.endConn

    if (anchorOverlayGroupRef.current) {
      anchorOverlayGroupRef.current.visible(true)
    }
    const group = e.target.getParent()
    if (group) (group as Konva.Group).draggable(false)
    e.cancelBubble = true
  }

  const moveHandleDrag = (handleType: 'start' | 'end', e: Konva.KonvaEventObject<DragEvent>) => {
    const base = lineDraftPtsRef.current || [...pts]

    // Determine index based on handle type and CURRENT base length (which changes with routing)
    const pointIndex = handleType === 'start' ? 0 : base.length - 2

    let nextPos = { x: e.target.x(), y: e.target.y() }

    // Determine reference point (neighbor)
    let refPoint = { x: 0, y: 0 }
    if (pointIndex === 0) refPoint = { x: base[2], y: base[3] }
    else refPoint = { x: base[pointIndex - 2], y: base[pointIndex - 1] }

    const isOrthogonal = line.routing === 'orthogonal'
    const isShift = e.evt.shiftKey

    let newPts: number[] = [...base]

    // 1. Determine Next Handle Position
    if (isOrthogonal && !isShift) {
      // Free movement (snapped to grid)
      nextPos = snapToGrid(nextPos)
    } else if (isShift) {
      const step = Math.PI / 4
      nextPos = snapAngle(nextPos, refPoint, step)
    } else {
      nextPos = snapToGrid(nextPos)
    }

    // -------------------------------------------------------------------
    // 2. Connector Snapping (8-point anchors) - Determine 'best' snap target
    // -------------------------------------------------------------------
    const threshold = 12 * invScale
    const showMargin = 80 * invScale
    let best: {
      nodeId: string
      anchor: Anchor
      x: number
      y: number
      dist2: number
    } | null = null

    const activeFill = '#059669'
    const baseStroke = '#0f766e'

    // Reset overlays
    if (anchorOverlayGroupRef.current) {
      for (const circle of anchorCircleMapRef.current.values()) {
        circle.visible(false)
        circle.radius(5 * invScale)
        circle.fill('#ffffff')
        circle.stroke(baseStroke)
        circle.strokeWidth(2 * invScale)
        circle.opacity(0.95)
      }
      lastHighlightedAnchorKeyRef.current = null
    }

    // Check for snap candidates (endpoints only)
    if (pointIndex === 0 || pointIndex === base.length - 2) {
      for (const n of nodesForSnap) {
        if (n.t === 'line') continue
        // Bounding box check
        const nx = n.x ?? 0,
          ny = n.y ?? 0,
          nw = n.w ?? 0,
          nh = n.h ?? 0
        if (
          nextPos.x < nx - showMargin ||
          nextPos.x > nx + nw + showMargin ||
          nextPos.y < ny - showMargin ||
          nextPos.y > ny + nh + showMargin
        )
          continue

        const isSmall = nw < 15 || nh < 15

        for (const a of anchors) {
          // Skip corner anchors for small objects to prevent clutter
          if (isSmall && ['tl', 'tr', 'bl', 'br'].includes(a)) continue

          const p = getAnchorPoint(n, a)
          if (!p) continue

          // Show candidate anchors
          const key = `${n.id}:${a} `
          const circle = anchorCircleMapRef.current.get(key)
          if (circle) circle.visible(true)

          // Distance check
          const dx = p.x - nextPos.x
          const dy = p.y - nextPos.y
          const d2 = dx * dx + dy * dy
          if (d2 <= threshold * threshold && (!best || d2 < best.dist2)) {
            best = { nodeId: n.id, anchor: a, x: p.x, y: p.y, dist2: d2 }
          }
        }
      }
    }

    // Apply Snap
    if (best) {
      nextPos = { x: best.x, y: best.y }
      // Update draft connection info
      if (pointIndex === 0)
        startConnDraftRef.current = {
          nodeId: best.nodeId,
          anchor: best.anchor,
        }
      else if (pointIndex === base.length - 2)
        endConnDraftRef.current = { nodeId: best.nodeId, anchor: best.anchor }

      // Highlight snapped anchor
      const key = `${best.nodeId}:${best.anchor} `
      const circle = anchorCircleMapRef.current.get(key)
      if (circle) {
        circle.visible(true)
        circle.radius(9 * invScale)
        circle.fill(activeFill)
      }
    } else {
      // Detach if no snap - Explicitly set to null to ensure update clears it
      if (pointIndex === 0) startConnDraftRef.current = null
      else if (pointIndex === base.length - 2) endConnDraftRef.current = null
    }

    e.target.position(nextPos)

    // -------------------------------------------------------------------
    // 3. Draft Path Calculation
    // -------------------------------------------------------------------

    if (isOrthogonal && !isShift) {
      // Dynamic Routing: Re-calculate the whole path
      const isStart = pointIndex === 0
      // Endpoints
      const pStart = isStart ? nextPos : { x: base[0], y: base[1] }
      const pEnd = isStart ? { x: base[base.length - 2], y: base[base.length - 1] } : nextPos

      // Setup for getOrthogonalPath
      const getDir = (conn: LineNode['startConn']) => {
        if (!conn) return null
        const node = nodesForSnap.find((n) => n.id === conn.nodeId)
        if (!node) return null
        if (!isWHElement(node)) return null
        const geo = { x: node.x, y: node.y, w: node.w, h: node.h, r: node.r }
        const info = getAnchorPointAndDirection(geo, conn.anchor)
        return { x: info.nx, y: info.ny }
      }

      const startDirInfo = getDir(startConnDraftRef.current || undefined)
      const endDirInfo = getDir(endConnDraftRef.current || undefined)

      const computedPath = getOrthogonalPath(
        pStart,
        startDirInfo || { x: 0, y: 0 },
        pEnd,
        endDirInfo
      )

      if (computedPath.length > 0) newPts = computedPath
    } else {
      // Standard behavior (Manual / Straight)
      newPts[pointIndex] = nextPos.x
      newPts[pointIndex + 1] = nextPos.y
    }

    lineDraftPtsRef.current = newPts
    applyDraftToVisuals(newPts)
    e.cancelBubble = true
  }

  const endHandleDrag = (e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true
    const next = lineDraftPtsRef.current
    const group = e.target.getParent()
    if (group) (group as Konva.Group).draggable((readOnly ? false : !element.locked) && isSelected)

    if (anchorOverlayGroupRef.current) {
      anchorOverlayGroupRef.current.visible(false)
    }
    // Commit once
    if (next) {
      const updated: Partial<LineNode> = {
        id: element.id,
        pts: next,
      }
      // Only update connection properties if they were modified (not undefined)
      if (startConnDraftRef.current !== undefined) {
        updated.startConn = startConnDraftRef.current ?? undefined
      }
      if (endConnDraftRef.current !== undefined) {
        updated.endConn = endConnDraftRef.current ?? undefined
      }

      onChange(updated as unknown as Partial<UnifiedNode>)
    }
    // Release after this tick so any stray group dragend won't apply
    setTimeout(() => {
      isLineHandleDraggingRef.current = false
      lineDraftPtsRef.current = null
      // Reset connection drafts to undefined so next drag starts fresh
      startConnDraftRef.current = undefined
      endConnDraftRef.current = undefined
    }, 0)
  }

  return (
    <Group
      id={element.id}
      x={0}
      y={0}
      draggable={(readOnly ? false : !element.locked) && isSelected}
      onDragStart={commonProps.onDragStart}
      onDragEnd={(e) => {
        if (isLineHandleDraggingRef.current) {
          // If an endpoint handle drag accidentally triggered group drag events,
          // ignore them to avoid shifting the whole line.
          e.target.position({ x: 0, y: 0 })
          return
        }
        const node = e.target
        const dx = node.x()
        const dy = node.y()

        if (dx !== 0 || dy !== 0) {
          // If this line was connected, moving the whole line detaches it.
          const newPts = pts.map((p, i) => (i % 2 === 0 ? p + dx : p + dy))
          onChange({
            id: element.id,
            pts: newPts,
            startConn: undefined,
            endConn: undefined,
          } as unknown as Partial<UnifiedNode>)
        }

        // Reset group position to avoid mixing x/y offsets with absolute pts.
        node.position({ x: 0, y: 0 })
      }}
      onMouseDown={commonProps.onMouseDown}
      onTap={commonProps.onTap}
      onMouseEnter={commonProps.onMouseEnter}
      onMouseLeave={commonProps.onMouseLeave}
      dragBoundFunc={commonProps.dragBoundFunc}
      ref={commonProps.ref}
    >
      {isSelected && !readOnly && (
        <Group
          ref={(node) => {
            anchorOverlayGroupRef.current = node
          }}
          visible={false}
          listening={false}
        >
          {nodesForSnap.flatMap((n) =>
            anchors.map((a) => {
              const p = getAnchorPoint(n, a)
              if (!p) return null
              const key = `${n.id}:${a} `
              return (
                <Circle
                  key={`anchor - ${key} `}
                  x={p.x}
                  y={p.y}
                  radius={5 * invScale}
                  fill="#ffffff"
                  stroke="#0f766e"
                  strokeWidth={2 * invScale}
                  opacity={0.95}
                  shadowColor="#34d399"
                  shadowBlur={10 * invScale}
                  shadowOpacity={0.18}
                  shadowEnabled
                  visible={false}
                  ref={(node) => {
                    if (node) anchorCircleMapRef.current.set(key, node)
                    else anchorCircleMapRef.current.delete(key)
                  }}
                />
              )
            })
          )}
        </Group>
      )}
      <Line
        ref={(node) => {
          lineVisualRef.current = node
        }}
        name="line-body"
        points={pts}
        stroke={line.stroke || '#000000'}
        strokeWidth={line.strokeW ?? 0.2}
        dash={line.dash}
        lineCap="round"
        lineJoin="round"
        hitStrokeWidth={20 * invScale}
        draggable={false}
      />

      {/* Arrow markers (wrapped in Groups for direct manipulation during drag) */}
      {(() => {
        const endIdx = Math.max(0, pts.length - 2)
        const dx = pts[endIdx] - pts[0]
        const dy = pts[endIdx + 1] - pts[1]
        const angleToEnd = Math.atan2(dy, dx)
        const angleToStart = angleToEnd + Math.PI

        const startType = line.arrows?.[0] || 'none'
        const endType = line.arrows?.[1] || 'none'
        const color = line.stroke || '#000000'
        const size = Math.max(8 * invScale, (line.strokeW ?? 0.2) * 4)

        return (
          <>
            <Group
              ref={(node) => {
                lineStartMarkerGroupRef.current = node
              }}
              name="line-marker-start"
              x={pts[0]}
              y={pts[1]}
              rotation={(angleToStart * 180) / Math.PI}
              listening={false}
            >
              <LineMarker x={0} y={0} angle={0} type={startType} color={color} size={size} />
            </Group>
            <Group
              ref={(node) => {
                lineEndMarkerGroupRef.current = node
              }}
              name="line-marker-end"
              x={pts[endIdx]}
              y={pts[endIdx + 1]}
              rotation={(angleToEnd * 180) / Math.PI}
              listening={false}
            >
              <LineMarker x={0} y={0} angle={0} type={endType} color={color} size={size} />
            </Group>
          </>
        )
      })()}
      {/* Endpoint drag handles (only when selected) */}
      {isSelected &&
        !readOnly &&
        !element.locked &&
        (() => {
          return (
            <>
              <Circle
                ref={(node) => {
                  lineStartHandleRef.current = node
                }}
                name="line-handle-start"
                x={pts[0]}
                y={pts[1]}
                radius={6 * invScale}
                fill="#ffffff"
                stroke="#3b82f6"
                strokeWidth={2 * invScale}
                draggable
                onDragStart={startHandleDrag}
                onDragMove={(e) => moveHandleDrag('start', e)}
                onDragEnd={endHandleDrag}
                onMouseDown={(e) => {
                  e.cancelBubble = true
                }}
              />
              <Circle
                ref={(node) => {
                  lineEndHandleRef.current = node
                }}
                name="line-handle-end"
                x={pts[pts.length - 2]}
                y={pts[pts.length - 1]}
                radius={6 * invScale}
                fill="#ffffff"
                stroke="#3b82f6"
                strokeWidth={2 * invScale}
                draggable
                onDragStart={startHandleDrag}
                onDragMove={(e) => moveHandleDrag('end', e)}
                onDragEnd={endHandleDrag}
                onMouseDown={(e) => {
                  e.cancelBubble = true
                }}
              />
            </>
          )
        })()}
    </Group>
  )
}
