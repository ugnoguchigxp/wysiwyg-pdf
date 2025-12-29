import { AI_LIMITS } from '@/constants/ai-limits'
import type { Doc } from '@/types/canvas'

export interface AIValidationResult {
  valid: boolean
  warnings: string[]
  errors: string[]
}

export function validateForAI(doc: Doc): AIValidationResult {
  const warnings: string[] = []
  const errors: string[] = []

  if (doc.surfaces.length > AI_LIMITS.maxSurfaces) {
    errors.push(`Surface count ${doc.surfaces.length} exceeds limit ${AI_LIMITS.maxSurfaces}`)
  }

  if (doc.nodes.length > AI_LIMITS.maxTotalNodes) {
    errors.push(`Total node count ${doc.nodes.length} exceeds limit ${AI_LIMITS.maxTotalNodes}`)
  }

  const nodesBySurface = new Map<string, number>()
  for (const node of doc.nodes) {
    nodesBySurface.set(node.s, (nodesBySurface.get(node.s) ?? 0) + 1)
  }
  for (const [surfaceId, count] of nodesBySurface) {
    if (count > AI_LIMITS.maxNodesPerSurface) {
      warnings.push(
        `Surface "${surfaceId}" has ${count} nodes (limit: ${AI_LIMITS.maxNodesPerSurface})`
      )
    }
  }

  for (const node of doc.nodes) {
    if (node.t === 'text' && node.text.length > AI_LIMITS.maxTextLength) {
      warnings.push(
        `TextNode "${node.id}" text length ${node.text.length} exceeds ${AI_LIMITS.maxTextLength}`
      )
    }
  }

  // Image size check (for base64-encoded images)
  for (const node of doc.nodes) {
    if (node.t === 'image' && node.src && node.src.startsWith('data:')) {
      // Rough estimate: base64 is ~4/3 of original size, and the data URL has a prefix
      const base64Part = node.src.split(',')[1]
      if (base64Part) {
        const estimatedBytes = Math.ceil((base64Part.length * 3) / 4)
        if (estimatedBytes > AI_LIMITS.maxImageSizeBytes) {
          warnings.push(
            `ImageNode "${node.id}" estimated size ${Math.round(estimatedBytes / 1024)}KB exceeds ${Math.round(AI_LIMITS.maxImageSizeBytes / 1024)}KB limit`
          )
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    warnings,
    errors,
  }
}
