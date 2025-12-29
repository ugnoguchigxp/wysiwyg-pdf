import type { Operation } from '@/features/konva-editor/types'
import type { Doc, UnifiedNode } from '@/types/canvas'

export type AIOperation =
  | { kind: 'create-element'; element: UnifiedNode }
  | { kind: 'update-element'; id: string; next: Partial<Omit<UnifiedNode, 't'>> }
  | { kind: 'delete-element'; id: string }
  | { kind: 'reorder-elements'; nextOrder: string[] }

export function enrichAIOperation(doc: Doc, aiOp: AIOperation): Operation {
  switch (aiOp.kind) {
    case 'create-element':
      return aiOp

    case 'update-element': {
      const node = doc.nodes.find((n) => n.id === aiOp.id)
      if (!node) {
        console.warn(`[enrichAIOperation] Node not found: ${aiOp.id}`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return { ...aiOp, prev: {} as any, next: aiOp.next as any }
      }
      // Runtime check to ensure 't' is not being modified, even if type casted
      if ('t' in aiOp.next) {
        console.warn(`[enrichAIOperation] prohibited type change attempted on ${aiOp.id}`)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        delete (aiOp.next as any).t
      }
      const prev: Partial<UnifiedNode> = {}
      for (const key of Object.keys(aiOp.next)) {
        if (key in node) {
          ; (prev as unknown as Record<string, unknown>)[key] = (
            node as unknown as Record<string, unknown>
          )[key]
        }
      }
      return { ...aiOp, prev }
    }

    case 'delete-element': {
      const prevElement = doc.nodes.find((n) => n.id === aiOp.id)
      if (!prevElement) {
        console.warn(`[enrichAIOperation] Node not found: ${aiOp.id}`)
        return { ...aiOp, prevElement: {} as UnifiedNode }
      }
      return { ...aiOp, prevElement }
    }

    case 'reorder-elements': {
      const prevOrder = doc.nodes.map((n) => n.id)
      return { ...aiOp, prevOrder }
    }
  }
}

function applyOperation(doc: Doc, op: Operation): Doc {
  switch (op.kind) {
    case 'create-element':
      return {
        ...doc,
        nodes: [...doc.nodes, op.element],
      }

    case 'update-element': {
      return {
        ...doc,
        nodes: doc.nodes.map((n) =>
          n.id === op.id
            ? ({ ...n, ...(op.next as Partial<UnifiedNode>), id: op.id } as UnifiedNode)
            : n
        ),
      }
    }

    case 'delete-element':
      return {
        ...doc,
        nodes: doc.nodes.filter((n) => n.id !== op.id),
      }

    case 'reorder-elements': {
      const byId = new Map(doc.nodes.map((n) => [n.id, n] as const))
      const nextNodes: UnifiedNode[] = []
      for (const id of op.nextOrder) {
        const n = byId.get(id)
        if (n) nextNodes.push(n)
      }
      for (const n of doc.nodes) {
        if (!op.nextOrder.includes(n.id)) nextNodes.push(n)
      }
      return {
        ...doc,
        nodes: nextNodes,
      }
    }

    default:
      return doc
  }
}

export function applyAIOperations(
  doc: Doc,
  aiOperations: AIOperation[]
): { doc: Doc; operations: Operation[] } {
  let currentDoc = doc
  const operations: Operation[] = []

  for (const aiOp of aiOperations) {
    const op = enrichAIOperation(currentDoc, aiOp)
    currentDoc = applyOperation(currentDoc, op)
    operations.push(op)
  }

  return { doc: currentDoc, operations }
}

export function validateAIOperation(op: unknown): op is AIOperation {
  if (typeof op !== 'object' || op === null) return false
  const o = op as Record<string, unknown>

  switch (o.kind) {
    case 'create-element':
      return typeof o.element === 'object' && o.element !== null
    case 'update-element':
      if (o.next && typeof o.next === 'object' && 't' in o.next) {
        console.warn('AIOperation: update-element cannot change node type (t)')
        return false
      }
      return typeof o.id === 'string' && typeof o.next === 'object'
    case 'delete-element':
      return typeof o.id === 'string'
    case 'reorder-elements':
      return Array.isArray(o.nextOrder)
    default:
      return false
  }
}
