import type { Doc, TextNode, LineNode, UnifiedNode } from '@/types/canvas'
import type { MindmapGraph } from '../types'
import { generateNodeId, generateSurfaceId } from '@/utils/id'

interface ParsedNode {
  text: string
  depth: number
  children: ParsedNode[]
}

/**
 * マインドマップをMermaid構文にエクスポート
 * graph.nodeMapを使用してO(1)でノード取得
 */
export const exportToMermaid = (_doc: Doc, graph: MindmapGraph): string => {
  const lines: string[] = ['mindmap']

  if (!graph.rootId) return ''

  const rootNode = graph.nodeMap.get(graph.rootId)
  if (!rootNode || rootNode.t !== 'text') return ''

  const rootText = (rootNode as TextNode).text
  const sanitizedRootText = /[\(\)\[\]\{\}\n]/.test(rootText)
    ? `"${rootText.replace(/"/g, "'")}"`
    : rootText
  lines.push(`  root((${sanitizedRootText}))`)

  const buildTree = (nodeId: string, depth: number) => {
    const children = graph.childrenMap.get(nodeId) || []
    children.forEach((childId) => {
      const child = graph.nodeMap.get(childId)
      if (child && child.t === 'text') {
        const indent = '  '.repeat(depth + 1)
        const text = (child as TextNode).text
        // Sanitize: Wrap in quotes if it contains special chars or newlines
        const sanitizedText = /[\(\)\[\]\{\}\n]/.test(text) ? `"${text.replace(/"/g, "'")}"` : text
        lines.push(`${indent}${sanitizedText}`)
        buildTree(childId, depth + 1)
      }
    })
  }

  buildTree(graph.rootId, 1)

  return lines.join('\n')
}

export const importFromMermaid = (syntax: string, surfaceId: string = 's1'): Doc => {
  const lines = syntax.split('\n').filter((line) => line.trim() !== '')

  if (lines.length === 0) {
    throw new Error('No content to import')
  }

  if (lines[0].trim() !== 'mindmap') {
    throw new Error('Invalid Mermaid syntax: must start with "mindmap"')
  }

  const rootMatch = lines[1]?.match(/root\(\((.*?)\)\)/)
  if (!rootMatch) {
    throw new Error('Invalid Mermaid syntax: root node not found')
  }
  const rootText = rootMatch[1]

  const tree = parseTree(lines.slice(2))

  return buildDoc(rootText, tree, surfaceId)
}

const parseTree = (lines: string[]): ParsedNode[] => {
  const nodes: ParsedNode[] = []
  const stack: { depth: number; node: ParsedNode }[] = []

  lines.forEach((line) => {
    const depth = (line.match(/^ */)?.[0].length || 0) / 2
    const text = line.trim()

    const node: ParsedNode = { text, depth, children: [] }

    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop()
    }

    if (stack.length > 0) {
      stack[stack.length - 1].node.children.push(node)
    } else {
      nodes.push(node)
    }

    stack.push({ depth, node })
  })

  return nodes
}

const buildDoc = (rootText: string, tree: ParsedNode[], surfaceId: string): Doc => {
  const nodes: (TextNode | LineNode)[] = []

  // Create a temporary doc to track IDs
  const tempDoc: Doc = {
    v: 1,
    id: 'temp',
    title: 'temp',
    unit: 'mm',
    surfaces: [{ id: surfaceId, type: 'canvas', w: 4000, h: 4000, bg: '#f8fafc' }],
    nodes: [],
  }

  const rootId = generateNodeId(tempDoc, 'text')
  tempDoc.nodes.push({ id: rootId, t: 'text' } as UnifiedNode)

  const rootNode: TextNode = {
    id: rootId,
    t: 'text',
    s: surfaceId,
    x: 300,
    y: 200,
    w: 50,
    h: 12,
    text: rootText,
    align: 'c',
    vAlign: 'm',
    backgroundColor: '#dbeafe',
    borderColor: '#3b82f6',
    borderWidth: 1,
    padding: 3,
    fontSize: 5.64,
    fontWeight: 700,
    fill: '#1e3a8a',
    cornerRadius: 1,
    hasFrame: true,
    locked: true,
    tags: ['root'],
  }

  nodes.push(rootNode)

  /**
   * ノードを再帰的に構築
   * isRight: 右側に配置するかどうか（レイアウトエンジンで使用）
   */
  const buildNodes = (
    parentId: string,
    children: ParsedNode[],
    isRight: boolean
  ) => {
    children.forEach((child) => {
      const childId = generateNodeId(tempDoc, 'text')
      tempDoc.nodes.push({ id: childId, t: 'text' } as UnifiedNode)
      const linkId = generateNodeId(tempDoc, 'line')
      tempDoc.nodes.push({ id: linkId, t: 'line' } as UnifiedNode)

      // layoutDir を data に設定（レイアウトエンジンが参照）
      const layoutDir = isRight ? 'right' : 'left'

      const childNode: TextNode = {
        id: childId,
        t: 'text',
        s: surfaceId,
        // 初期座標はルート付近に配置（レイアウトエンジンで再計算される）
        x: 300,
        y: 200,
        w: 40,
        h: 10,
        text: child.text,
        align: 'c',
        vAlign: 'm',
        backgroundColor: '#ffffff',
        borderColor: '#64748b',
        borderWidth: 0.5,
        padding: 2,
        fontSize: 4.23,
        fontWeight: 400,
        fill: '#000000',
        cornerRadius: 1,
        hasFrame: true,
        locked: true,
        data: { layoutDir },
      }

      const link: LineNode = {
        id: linkId,
        t: 'line',
        s: surfaceId,
        pts: [0, 0, 0, 0],
        stroke: '#94a3b8',
        strokeW: 1,
        routing: 'orthogonal',
        startConn: { nodeId: parentId, anchor: 'auto' },
        endConn: { nodeId: childId, anchor: 'auto' },
        locked: true,
      }

      nodes.push(childNode, link)

      // 子ノードは親と同じ方向に配置
      if (child.children.length > 0) {
        buildNodes(childId, child.children, isRight)
      }
    })
  }

  // ルートの直接の子は右→左→右→左...のパターンで配置
  // 1番目: 右, 2番目: 左, 3番目: 右, 4番目: 左...
  tree.forEach((child, index) => {
    const isRight = index % 2 === 0 // 0, 2, 4... は右側
    buildNodes(rootId, [child], isRight)
  })

  // Generate a unique doc ID
  const docId = `mindmap-${generateSurfaceId(tempDoc, 'canvas').replace('canvas-', '')}`

  return {
    v: 1,
    id: docId,
    title: 'Imported Mindmap',
    unit: 'mm',
    surfaces: [{ id: surfaceId, type: 'canvas', w: 4000, h: 4000, bg: '#f8fafc' }],
    nodes,
  }
}
