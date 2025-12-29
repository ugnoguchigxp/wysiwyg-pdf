import type { Doc, UnifiedNode } from '@/types/canvas'

const prefixMap: Record<UnifiedNode['t'], string> = {
  text: 'txt',
  shape: 'shp',
  line: 'ln',
  image: 'img',
  group: 'grp',
  table: 'tbl',
  signature: 'sig',
  widget: 'wgt',
}

export function generateNodeId(doc: Doc, nodeType: UnifiedNode['t']): string {
  const prefix = prefixMap[nodeType]
  const existingIds = new Set(doc.nodes.map((n) => n.id))

  let counter = 1
  let candidateId = `${prefix}-${counter}`

  while (existingIds.has(candidateId)) {
    counter++
    candidateId = `${prefix}-${counter}`
  }

  return candidateId
}

export function generateSurfaceId(doc: Doc, surfaceType: 'page' | 'canvas' | 'slide'): string {
  const prefix = surfaceType === 'slide' ? 'slide' : surfaceType === 'page' ? 'page' : 'canvas'
  const existingIds = new Set(doc.surfaces.map((s) => s.id))

  let counter = 1
  let candidateId = `${prefix}-${counter}`

  while (existingIds.has(candidateId)) {
    counter++
    candidateId = `${prefix}-${counter}`
  }

  return candidateId
}
