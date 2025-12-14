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
