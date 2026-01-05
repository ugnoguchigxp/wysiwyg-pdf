import type Konva from 'konva'
import { useCallback, useState } from 'react'
import type { Doc, SignatureNode, Surface, UnifiedNode } from '@/features/konva-editor/types'
import { generateUUID } from '@/utils/browser'
import { getStrokesBox, normalizeStrokes } from '../utils/signatureUtils'

interface UseSignatureProps {
  templateDoc: Doc
  onTemplateChange: (doc: Doc) => void
  currentSurface: Surface
  onElementSelect: (element: UnifiedNode | null) => void
  drawingSettings?: {
    stroke: string
    strokeWidth: number
    simplification?: number
  }
}

export const useSignature = ({
  templateDoc,
  onTemplateChange,
  currentSurface,
  onElementSelect,
  drawingSettings = { stroke: '#000000', strokeWidth: 0.2, simplification: 0 },
}: UseSignatureProps) => {
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentStrokes, setCurrentStrokes] = useState<number[][]>([])
  const [currentPoints, setCurrentPoints] = useState<number[]>([])
  const [currentPressure, setCurrentPressure] = useState<number[]>([])
  const [allPressureData, setAllPressureData] = useState<number[][]>([])

  const commitSignature = useCallback((): Doc | null => {
    if (currentStrokes.length === 0) return null

    // We no longer simplify during commit to allow dynamic simplification in the renderer
    const rawStrokes = currentStrokes
    const box = getStrokesBox(rawStrokes)
    const normalizedStrokes = normalizeStrokes(rawStrokes, box)

    const hasPressureData = allPressureData.some((pressure) => pressure.length > 0)
    const element: SignatureNode = {
      id: `sig-${generateUUID()}`,
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
      pressureData: hasPressureData ? allPressureData : undefined,
      usePressureSim: !hasPressureData,
      tolerance: drawingSettings.simplification,
      r: 0,
      locked: false,
      hidden: false,
    }

    const nextDoc = {
      ...templateDoc,
      nodes: [...templateDoc.nodes, element],
    }
    onTemplateChange(nextDoc)

    setCurrentStrokes([])
    setCurrentPoints([])
    setCurrentPressure([])
    setAllPressureData([])
    setIsDrawing(false)
    onElementSelect(element)

    return nextDoc
  }, [
    currentStrokes,
    currentSurface.id,
    templateDoc,
    onTemplateChange,
    onElementSelect,
    drawingSettings.stroke,
    drawingSettings.strokeWidth,
    drawingSettings.simplification,
    allPressureData,
  ])

  const handleSignatureMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      const stage = e.target.getStage()
      const interestedInBackground = e.target === stage || e.target.name() === '_background'

      if (interestedInBackground) {
        setIsDrawing(true)
        const nativeEvent = e.evt as PointerEvent | undefined
        const pressure =
          nativeEvent && 'pressure' in nativeEvent ? (nativeEvent as PointerEvent).pressure : undefined
        const isPressureDevice = typeof pressure === 'number' && pressure !== 0.5 && pressure !== 0
        const point = stage?.getPointerPosition()
        if (point) {
          const transform = stage?.getAbsoluteTransform().copy()
          transform?.invert()
          const pos = transform?.point(point)
          if (pos) {
            setCurrentPoints([pos.x, pos.y])
            if (isPressureDevice && typeof pressure === 'number') {
              setCurrentPressure([pressure])
            }
          }
        }
      }
    },
    []
  )

  const handleSignatureMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
      if (isDrawing) {
        const stage = e.target.getStage()
        const nativeEvent = e.evt as PointerEvent | undefined
        const pressure =
          nativeEvent && 'pressure' in nativeEvent
            ? (nativeEvent as PointerEvent).pressure
            : undefined
        const isPressureDevice = typeof pressure === 'number' && pressure !== 0.5 && pressure !== 0
        const point = stage?.getPointerPosition()
        if (point) {
          const transform = stage?.getAbsoluteTransform().copy()
          transform?.invert()
          const pos = transform?.point(point)
          if (pos) {
            setCurrentPoints((prev) => [...prev, pos.x, pos.y])
            if (isPressureDevice) {
              setCurrentPressure((prev) => [...prev, pressure])
            }
          }
        }
      }
    },
    [isDrawing]
  )

  const handleSignatureMouseUp = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false)
      if (currentPoints.length > 0) {
        setCurrentStrokes((prev) => [...prev, currentPoints])
        setCurrentPoints([])
        setAllPressureData((prev) => [...prev, currentPressure.length > 0 ? currentPressure : []])
        setCurrentPressure([])
      }
    }
  }, [currentPoints, currentPressure, isDrawing])

  return {
    isDrawing,
    currentStrokes, // Exposed if needed for rendering transient strokes? No, rendered in component using hook state?
    // Wait, ReportKonvaEditor renders `currentStrokes` line?
    // Let's check. ReportKonvaEditor renders specific lines for drawing?
    // I need to check if currentStrokes is rendered.
    commitSignature,
    handleSignatureMouseDown,
    handleSignatureMouseMove,
    handleSignatureMouseUp,

    // Expose state if needed for rendering
    currentPoints,
  }
}
