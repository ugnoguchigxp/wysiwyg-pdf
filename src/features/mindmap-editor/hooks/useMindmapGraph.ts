import { useMemo } from 'react'
import { Doc } from '@/types/canvas'
import { MindmapGraph } from '../types'
import { buildMindmapGraph } from '../utils/treeUtils'

export const useMindmapGraph = (doc: Doc): MindmapGraph => {
    const nodes = doc.nodes

    const graph = useMemo(() => {
        return buildMindmapGraph(nodes)
    }, [nodes])

    return graph
}
