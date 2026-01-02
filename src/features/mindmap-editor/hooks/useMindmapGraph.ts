import { useMemo } from 'react'
import type { Doc } from '@/types/canvas'
import type { MindmapGraph } from '../types'
import { buildMindmapGraph } from '../utils/treeUtils'

export const useMindmapGraph = (doc: Doc): MindmapGraph => {
  const nodes = doc.nodes

  const graph = useMemo(() => {
    return buildMindmapGraph(nodes)
  }, [nodes])

  return graph
}
