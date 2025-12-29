import type { Doc, UnifiedNode } from '@/types/canvas'

export function getMergedNodes(doc: Doc, surfaceId: string): UnifiedNode[] {
  const surface = doc.surfaces.find((s) => s.id === surfaceId)
  if (!surface) return []

  if (!surface.masterId) {
    return doc.nodes.filter((n) => n.s === surfaceId)
  }

  const masterNodes = doc.nodes.filter((n) => n.s === surface.masterId)
  const childNodes = doc.nodes.filter((n) => n.s === surfaceId)

  const result: UnifiedNode[] = []
  const overriddenNames = new Set(childNodes.map((n) => n.name).filter(Boolean))

  for (const masterNode of masterNodes) {
    if (masterNode.isPlaceholder && masterNode.name && overriddenNames.has(masterNode.name)) {
      continue
    }
    result.push(masterNode)
  }

  result.push(...childNodes)

  return result
}
