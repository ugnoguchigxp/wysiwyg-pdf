import type { TextNode, UnifiedNode } from '@/types/canvas'
import { mmToPx, ptToMm, pxToMm } from '@/utils/units'
import { calculateTextDimensions, measureText } from './textUtils'

const TEXT_LAYOUT_KEYS = ['text', 'font', 'fontSize', 'fontWeight', 'padding'] as const

export function calculateVerticalTextHeight(
  text: string,
  fontSize: number,
  padding: number
): number {
  const lines = (text || '').split('\n')
  const maxLineLength = Math.max(...lines.map((line) => Array.from(line).length), 1)
  const contentHeight = maxLineLength * fontSize
  return contentHeight + padding * 2
}

export function calculateInitialTextBoxSize(
  text: string,
  font: { family: string; sizeMm: number; weight?: number | string },
  options: { dpi?: number } = {}
): { w: number; h: number } {
  const dpi = options.dpi ?? 96
  const sizePx = mmToPx(font.sizeMm, { dpi })
  const { width, height } = measureText(text || ' ', {
    family: font.family,
    size: sizePx,
    weight: font.weight,
  })
  return {
    w: pxToMm(width + 10, { dpi }),
    h: pxToMm(height + 4, { dpi }),
  }
}

export function applyTextLayoutUpdates(
  currentNode: TextNode,
  updates: Partial<UnifiedNode>
): Partial<UnifiedNode> {
  const hasLayoutChange = TEXT_LAYOUT_KEYS.some((key) => key in updates)
  const nextNode = { ...currentNode, ...updates } as TextNode
  const isVertical = 'vertical' in updates ? updates.vertical : nextNode.vertical

  if (!hasLayoutChange) {
    if ('vertical' in updates && updates.vertical === false) {
      const dims = calculateTextDimensions(nextNode.text ?? '', {
        family: nextNode.font,
        size: nextNode.fontSize,
        weight: nextNode.fontWeight,
        padding: nextNode.padding,
        isVertical: false,
      })
      return { ...updates, ...dims }
    }
    if ('vertical' in updates && updates.vertical === true) {
      const fontSize = nextNode.fontSize ?? ptToMm(12)
      const padding = nextNode.padding ?? 10
      const newH = calculateVerticalTextHeight(nextNode.text ?? '', fontSize, padding)
      return { ...updates, h: newH }
    }
    return updates
  }

  if (isVertical) {
    const fontSize = nextNode.fontSize ?? ptToMm(12)
    const padding = nextNode.padding ?? 10
    const newH = calculateVerticalTextHeight(nextNode.text ?? '', fontSize, padding)

    const finalUpdates: Partial<UnifiedNode> = { ...updates, h: newH }
    if ('w' in finalUpdates) {
      delete finalUpdates.w
    }
    return finalUpdates
  }

  const dims = calculateTextDimensions(nextNode.text ?? '', {
    family: nextNode.font,
    size: nextNode.fontSize,
    weight: nextNode.fontWeight,
    padding: nextNode.padding,
    isVertical: false,
  })

  return { ...updates, ...dims }
}
