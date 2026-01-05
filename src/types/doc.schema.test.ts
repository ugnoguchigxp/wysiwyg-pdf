import { describe, it, expect } from 'vitest'
import { validateDoc, validateNode, validateTableCells } from '@/types/doc.schema'
import type { Doc, TextNode, TableData } from '@/types/canvas'

function createMinimalDoc(): Doc {
    return {
        v: 1,
        id: 'test-doc',
        title: 'Test Document',
        unit: 'mm',
        surfaces: [{ id: 'page-1', type: 'page', w: 210, h: 297 }],
        nodes: [],
    }
}

describe('validateDoc', () => {
    it('should validate a minimal valid doc', () => {
        const doc = createMinimalDoc()
        const result = validateDoc(doc)

        expect(result.success).toBe(true)
    })

    it('should fail for missing required fields', () => {
        const invalidDoc = { id: 'test' }
        const result = validateDoc(invalidDoc)

        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.errors.length).toBeGreaterThan(0)
        }
    })

    it('should fail for invalid version', () => {
        const doc = { ...createMinimalDoc(), v: 2 }
        const result = validateDoc(doc)

        expect(result.success).toBe(false)
    })

    it('should fail for empty surfaces', () => {
        const doc = { ...createMinimalDoc(), surfaces: [] }
        const result = validateDoc(doc)

        expect(result.success).toBe(false)
    })
})

describe('validateNode', () => {
    it('should validate a valid text node', () => {
        const textNode: TextNode = {
            t: 'text',
            id: 'txt-1',
            s: 'page-1',
            x: 10,
            y: 20,
            w: 100,
            h: 30,
            text: 'Hello World',
        }
        const result = validateNode(textNode)

        expect(result.success).toBe(true)
    })

    it('should fail for invalid node type', () => {
        const invalidNode = {
            t: 'invalid-type',
            id: 'node-1',
            s: 'page-1',
        }
        const result = validateNode(invalidNode)

        expect(result.success).toBe(false)
    })

    it('should fail for missing required fields', () => {
        const incompleteNode = {
            t: 'text',
            id: 'txt-1',
            // missing s, x, y, w, h, text
        }
        const result = validateNode(incompleteNode)

        expect(result.success).toBe(false)
    })

    it('should fail for negative dimensions', () => {
        const nodeWithNegativeSize = {
            t: 'text',
            id: 'txt-1',
            s: 'page-1',
            x: 0,
            y: 0,
            w: -100,
            h: 20,
            text: 'test',
        }
        const result = validateNode(nodeWithNegativeSize)

        expect(result.success).toBe(false)
    })
})

describe('validateTableCells', () => {
    it('should return no errors for valid table', () => {
        const table: TableData = {
            rows: [20, 20, 20],
            cols: [50, 50, 50],
            cells: [
                { r: 0, c: 0, v: 'A1' },
                { r: 0, c: 1, v: 'B1' },
                { r: 1, c: 0, v: 'A2' },
            ],
        }
        const errors = validateTableCells(table)

        expect(errors).toHaveLength(0)
    })

    it('should detect row span overflow', () => {
        const table: TableData = {
            rows: [20, 20],
            cols: [50, 50],
            cells: [{ r: 1, c: 0, rs: 3, v: 'Overflow' }], // rs=3 but only 2 rows
        }
        const errors = validateTableCells(table)

        expect(errors.some((e) => e.includes('rs='))).toBe(true)
    })

    it('should detect column span overflow', () => {
        const table: TableData = {
            rows: [20, 20],
            cols: [50, 50],
            cells: [{ r: 0, c: 1, cs: 3, v: 'Overflow' }], // cs=3 but only 2 cols
        }
        const errors = validateTableCells(table)

        expect(errors.some((e) => e.includes('cs='))).toBe(true)
    })

    it('should detect cell collision', () => {
        const table: TableData = {
            rows: [20, 20],
            cols: [50, 50],
            cells: [
                { r: 0, c: 0, rs: 2, cs: 2, v: 'Large' },
                { r: 1, c: 1, v: 'Collision' }, // Overlaps with (0,0) span
            ],
        }
        const errors = validateTableCells(table)

        expect(errors.some((e) => e.includes('collision'))).toBe(true)
    })
})
