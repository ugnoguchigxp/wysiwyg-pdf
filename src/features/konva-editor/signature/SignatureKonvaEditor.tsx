import type Konva from 'konva'
import type React from 'react'
import { useRef, useState } from 'react'
import { Layer, Line, Stage } from 'react-konva'
import { useI18n } from '@/i18n/I18nContext'
import { simplifyPoints } from '@/utils/geometry'
import { PEN_CURSOR_URL } from '../cursors'

interface SignatureKonvaEditorProps {
  width?: number
  height?: number
  simplification?: number
  onSave?: (dataUrl: string) => void
  onCancel?: () => void
}

interface SignatureLine {
  points: number[]
  color: string
  strokeWidth: number
}

export const SignatureKonvaEditor: React.FC<SignatureKonvaEditorProps> = ({
  width = 600,
  height = 300,
  simplification = 0,
  onSave,
  onCancel,
}) => {
  const { t } = useI18n()
  const [lines, setLines] = useState<SignatureLine[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const stageRef = useRef<Konva.Stage>(null)

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    setIsDrawing(true)
    const pos = e.target.getStage()?.getPointerPosition()
    if (!pos) return

    setLines([...lines, { points: [pos.x, pos.y], color: '#000000', strokeWidth: 3 }])
  }

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    // no drawing - skipping
    if (!isDrawing) {
      return
    }
    const stage = e.target.getStage()
    const point = stage?.getPointerPosition()
    if (!point) return

    // replace last
    const lastLine = { ...lines[lines.length - 1] }
    // add point
    lastLine.points = lastLine.points.concat([point.x, point.y])

    // replace last
    const newLines = lines.slice()
    newLines.splice(lines.length - 1, 1, lastLine)
    setLines(newLines)
  }

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const handleSave = () => {
    if (stageRef.current) {
      // We might want to trim or handle background, but for now simple export
      const dataURL = stageRef.current.toDataURL()

      // Apply optimization logic (DRY principle with ReportKonvaEditor)
      const optimizedLines = lines.map((line) => {
        let points = line.points
        if (simplification && simplification > 0) {
          points = simplifyPoints(line.points, simplification)
        }
        const rounded = points.map((val) => Math.round(val * 100) / 100)

        return {
          ...line,
          points: rounded,
        }
      })

      // Log Object for debugging as requested by user
      console.log('Signature Lines Object (Optimized):', optimizedLines)

      onSave?.(dataURL)
    }
  }

  const handleClear = () => {
    setLines([])
  }

  const handleDownload = () => {
    if (stageRef.current) {
      const dataURL = stageRef.current.toDataURL()
      const link = document.createElement('a')
      link.download = 'signature.png'
      link.href = dataURL
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-white shadow-sm">
      <div
        className="border-2 border-gray-400 bg-white rounded overflow-hidden"
        style={{
          cursor: PEN_CURSOR_URL,
        }}
      >
        <Stage
          width={width}
          height={height}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          ref={stageRef}
        >
          <Layer>
            {lines.map((line, i) => {
              let points = line.points
              // Apply simplification if simplification > 0
              // Skip simplification for the LAST line IF we are currently drawing (isDrawing=true)
              // to avoid jitter while drawing.
              const isLastLine = i === lines.length - 1
              const shouldSimplify = simplification && simplification > 0 && points.length > 4 && (!isLastLine || !isDrawing)

              if (shouldSimplify) {
                points = simplifyPoints(points, simplification!)
              }
              return (
                <Line
                  key={i}
                  points={points}
                  stroke={line.color}
                  strokeWidth={line.strokeWidth}
                  tension={0.5}
                  lineCap="round"
                  lineJoin="round"
                  globalCompositeOperation={'source-over'}
                />
              )
            })}
          </Layer>
        </Stage>
      </div>

      <div className="flex w-full justify-between items-center px-2">
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
          >
            {t('clear', 'Clear')}
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            {t('cancel', 'Cancel')}
          </button>
          <button
            onClick={handleDownload}
            className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            {t('download', 'Download')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            {t('save', 'Save')}
          </button>
        </div>
      </div>
    </div>
  )
}
