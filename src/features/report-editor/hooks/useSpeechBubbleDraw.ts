import type Konva from 'konva'
import { useCallback, useState } from 'react'
import type { Doc, SpeechBubbleNode, Surface, UnifiedNode } from '@/types/canvas'
import { generateUUID } from '@/utils/browser'
import { ptToMm } from '@/utils/units'

interface UseSpeechBubbleDrawProps {
  templateDoc: Doc
  onTemplateChange: (doc: Doc) => void
  currentSurface: Surface
  onElementSelect: (element: UnifiedNode | null) => void
}

export const useSpeechBubbleDraw = ({
  templateDoc,
  onTemplateChange,
  currentSurface,
  onElementSelect,
}: UseSpeechBubbleDrawProps) => {
  const [points, setPoints] = useState<number[]>([])
  const [isHoveringFirstPoint, setIsHoveringFirstPoint] = useState(false)

  const commitBubble = useCallback(() => {
    if (points.length < 6) {
      // Need at least 3 points (6 coords) for a polygon
      setPoints([])
      return null
    }

    // Calculate bounding box for the speech bubble node
    const xs = points.filter((_, i) => i % 2 === 0)
    const ys = points.filter((_, i) => i % 2 !== 0)
    const minX = Math.min(...xs)
    const minY = Math.min(...ys)
    const maxX = Math.max(...xs)
    const maxY = Math.max(...ys)

    const w = maxX - minX
    const h = maxY - minY

    // Normalize points relative to (minX, minY)
    const normalizedPoints = points.map((p, i) => (i % 2 === 0 ? p - minX : p - minY))

    const element: SpeechBubbleNode = {
      id: `speech-${generateUUID()}`,
      t: 'speech-bubble',
      s: currentSurface.id,
      x: minX,
      y: minY,
      w: w || 10,
      h: h || 10,
      shapeType: 'custom',
      pathPoints: normalizedPoints,
      originalText: '',
      translations: {},
      fontSize: ptToMm(12),
      backgroundColor: '#ffffff',
      borderColor: '#000000',
      borderWidth: 0.5,
      padding: 5,
      align: 'c',
      vAlign: 'm',
      r: 0,
      locked: false,
      hidden: false,
    }

    const nextDoc = {
      ...templateDoc,
      nodes: [...templateDoc.nodes, element],
    }
    onTemplateChange(nextDoc)

    setPoints([])
    onElementSelect(element)

    return nextDoc
  }, [points, currentSurface.id, templateDoc, onTemplateChange, onElementSelect])

  const handleMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = e.target.getStage()
      const point = stage?.getPointerPosition()
      if (!point) return

      const transform = stage?.getAbsoluteTransform().copy()
      transform?.invert()
      const pos = transform?.point(point)
      if (!pos) return

      // Check if clicking near the first point to close
      if (points.length >= 6) {
        const dx = pos.x - points[0]
        const dy = pos.y - points[1]
        const dist = Math.sqrt(dx * dx + dy * dy)
        const threshold = 10 / (stage?.scaleX() || 1) // 10px threshold

        if (dist < threshold) {
          commitBubble()
          return
        }
      }

      setPoints((prev) => [...prev, pos.x, pos.y])
    },
    [points, commitBubble]
  )

  const reset = useCallback(() => {
    setPoints([])
  }, [])

  return {
    points,
    handleMouseDown,
    commitBubble,
    reset,
    isHoveringFirstPoint,
    setIsHoveringFirstPoint,
  }
}
