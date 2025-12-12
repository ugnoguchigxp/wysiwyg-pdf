export const measureText = (
  text: string,
  font: { family: string; size: number; weight: number; italic?: boolean }
) => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return { width: 0, height: 0 }

  ctx.font = `${font.italic ? 'italic ' : ''}${font.weight} ${font.size}px ${font.family}`
  const lines = text.split('\n')
  let maxWidth = 0
  lines.forEach((line) => {
    const width = ctx.measureText(line).width
    maxWidth = Math.max(maxWidth, width)
  })
  const lineHeight = font.size * 1.5
  const height = lines.length * lineHeight
  return { width: maxWidth, height }
}
