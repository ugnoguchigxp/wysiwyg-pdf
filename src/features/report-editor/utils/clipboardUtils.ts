import type { UnifiedNode } from '@/types/canvas'
import { generateUUID } from '@/utils/browser'

/**
 * Calculates the position and IDs for nodes being pasted.
 * @param clipboardElements Elements currently in the clipboard.
 * @param currentSurfaceId ID of the surface (page) where elements are being pasted.
 * @param surfaceWidth Width of the surface, used to calculate the offset.
 * @param pasteCount Number of times paste has been performed in this sequence.
 * @returns Array of new nodes with updated IDs, surface IDs, and positions.
 */
export function calculatePasteNodes(
  clipboardElements: UnifiedNode[],
  currentSurfaceId: string,
  surfaceWidth: number,
  pasteCount: number
): UnifiedNode[] {
  const step = surfaceWidth * 0.01
  const offset = step * pasteCount

  return clipboardElements.map((el) => {
    const newId = generateUUID()
    const newEl = { ...el, id: newId, s: currentSurfaceId }

    if (
      'x' in newEl &&
      'y' in newEl &&
      typeof newEl.x === 'number' &&
      typeof newEl.y === 'number'
    ) {
      newEl.x += offset
      newEl.y += offset
    }
    return newEl
  })
}
