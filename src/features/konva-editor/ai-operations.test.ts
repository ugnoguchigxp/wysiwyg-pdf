import { describe, it, expect, vi } from 'vitest'
import {
    enrichAIOperation,
    applyAIOperations,
    validateAIOperation,
    type AIOperation,
} from '@/features/konva-editor/ai-operations'
import type { Doc, TextNode } from '@/types/canvas'

function createTestDoc(): Doc {
    return {
        v: 1,
        id: 'test-doc',
        title: 'Test',
        unit: 'mm',
        surfaces: [{ id: 'page-1', type: 'page', w: 210, h: 297 }],
        nodes: [
            {
                t: 'text',
                id: 'txt-1',
                s: 'page-1',
                x: 10,
                y: 20,
                w: 100,
                h: 30,
                text: 'Hello',
            } as TextNode,
        ],
    }
}

describe('validateAIOperation', () => {
    it('should validate create-element operation', () => {
        const op: AIOperation = {
            kind: 'create-element',
            element: {
                t: 'text',
                id: 'txt-2',
                s: 'page-1',
                x: 0,
                y: 0,
                w: 50,
                h: 20,
                text: 'New',
            } as TextNode,
        }
        expect(validateAIOperation(op)).toBe(true)
    })

    it('should validate update-element operation', () => {
        const op: AIOperation = {
            kind: 'update-element',
            id: 'txt-1',
            next: { x: 50 },
        }
        expect(validateAIOperation(op)).toBe(true)
    })

    it('should reject update-element with type change', () => {
        const op = {
            kind: 'update-element',
            id: 'txt-1',
            next: { t: 'shape' }, // Type change is prohibited
        }
        expect(validateAIOperation(op)).toBe(false)
    })

    it('should validate delete-element operation', () => {
        const op: AIOperation = {
            kind: 'delete-element',
            id: 'txt-1',
        }
        expect(validateAIOperation(op)).toBe(true)
    })

    it('should validate reorder-elements operation', () => {
        const op: AIOperation = {
            kind: 'reorder-elements',
            nextOrder: ['txt-2', 'txt-1'],
        }
        expect(validateAIOperation(op)).toBe(true)
    })

    it('should reject invalid operation kind', () => {
        const op = { kind: 'invalid-kind' }
        expect(validateAIOperation(op)).toBe(false)
    })
})

describe('enrichAIOperation', () => {
    it('should enrich update-element with prev values', () => {
        const doc = createTestDoc()
        const aiOp: AIOperation = {
            kind: 'update-element',
            id: 'txt-1',
            next: { x: 50, y: 100 },
        }
        const op = enrichAIOperation(doc, aiOp)

        expect(op.kind).toBe('update-element')
        if (op.kind === 'update-element') {
            expect(op.prev).toEqual({ x: 10, y: 20 })
        }
    })

    it('should enrich delete-element with prevElement', () => {
        const doc = createTestDoc()
        const aiOp: AIOperation = {
            kind: 'delete-element',
            id: 'txt-1',
        }
        const op = enrichAIOperation(doc, aiOp)

        expect(op.kind).toBe('delete-element')
        if (op.kind === 'delete-element') {
            expect(op.prevElement.id).toBe('txt-1')
        }
    })

    it('should enrich reorder-elements with prevOrder', () => {
        const doc = createTestDoc()
        const aiOp: AIOperation = {
            kind: 'reorder-elements',
            nextOrder: ['txt-1'],
        }
        const op = enrichAIOperation(doc, aiOp)

        expect(op.kind).toBe('reorder-elements')
        if (op.kind === 'reorder-elements') {
            expect(op.prevOrder).toEqual(['txt-1'])
        }
    })
})

describe('applyAIOperations', () => {
    it('should apply create-element operation', () => {
        const doc = createTestDoc()
        const newNode: TextNode = {
            t: 'text',
            id: 'txt-2',
            s: 'page-1',
            x: 0,
            y: 0,
            w: 50,
            h: 20,
            text: 'New',
        }
        const ops: AIOperation[] = [{ kind: 'create-element', element: newNode }]

        const result = applyAIOperations(doc, ops)

        expect(result.doc.nodes.length).toBe(2)
        expect(result.doc.nodes.find((n) => n.id === 'txt-2')).toBeDefined()
        expect(result.operations.length).toBe(1)
    })

    it('should apply update-element operation', () => {
        const doc = createTestDoc()
        const ops: AIOperation[] = [{ kind: 'update-element', id: 'txt-1', next: { x: 999 } }]

        const result = applyAIOperations(doc, ops)

        const updated = result.doc.nodes.find((n) => n.id === 'txt-1') as TextNode
        expect(updated.x).toBe(999)
    })

    it('should apply delete-element operation', () => {
        const doc = createTestDoc()
        const ops: AIOperation[] = [{ kind: 'delete-element', id: 'txt-1' }]

        const result = applyAIOperations(doc, ops)

        expect(result.doc.nodes.length).toBe(0)
    })

    it('should apply multiple operations in sequence', () => {
        const doc = createTestDoc()
        const ops: AIOperation[] = [
            { kind: 'update-element', id: 'txt-1', next: { x: 100 } },
            {
                kind: 'create-element',
                element: {
                    t: 'text',
                    id: 'txt-2',
                    s: 'page-1',
                    x: 0,
                    y: 0,
                    w: 50,
                    h: 20,
                    text: 'Second',
                } as TextNode,
            },
        ]

        const result = applyAIOperations(doc, ops)

        expect(result.doc.nodes.length).toBe(2)
        expect((result.doc.nodes.find((n) => n.id === 'txt-1') as TextNode).x).toBe(100)
        expect(result.operations.length).toBe(2)
    })
})
