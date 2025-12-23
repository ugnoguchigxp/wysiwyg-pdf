import { mmToPx, ptToMm, pxToMm } from '@/utils/units'

const dpi = 96

export interface FontSettings {
  family?: string
  size?: number // in mm (typically from model)
  weight?: number | string
  padding?: number // in mm
}

export const measureText = (
  text: string,
  font: { family: string; size: number; weight?: number | string }
) => {
  if (typeof document === 'undefined') return { width: 0, height: 0 }

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return { width: 0, height: 0 }

  const weight = font.weight || 'normal'
  ctx.font = `${weight} ${font.size}px ${font.family}`
  const metrics = ctx.measureText(text)

  // Height approximation
  const height = font.size * 1.2

  return {
    width: metrics.width,
    height,
  }
}

export const calculateTextDimensions = (text: string, fontSettings: FontSettings) => {
  const fontSizeMm = fontSettings.size || ptToMm(12)
  const font = {
    family: fontSettings.family || 'Meiryo',
    size: mmToPx(fontSizeMm, { dpi }), // convert mm to px for canvas measurement
    weight: fontSettings.weight || 400,
  }

  // Measure each line and find the maximum width
  const lines = text.split('\n')
  let maxWidth = 0
  for (const line of lines) {
    const { width } = measureText(line || ' ', font)
    if (width > maxWidth) maxWidth = width
  }

  // Calculate height based on number of lines
  const lineHeight = font.size * 1.2
  const calculatedHeight = lines.length * lineHeight

  // Add padding (convert mm to px)
  const paddingMm = fontSettings.padding || 0
  const paddingPx = mmToPx(paddingMm, { dpi })

  // Use padding for both sides (left/right, top/bottom)
  const newWidthPx = maxWidth + (paddingPx * 2)
  const newHeightPx = calculatedHeight + (paddingPx * 2)

  return {
    w: pxToMm(newWidthPx, { dpi }),
    h: pxToMm(newHeightPx, { dpi }),
  }
}
