import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCanvasOperations } from '@/features/konva-editor/hooks/useCanvasOperations'
import { ptToMm } from '@/utils/units'

// Mock dependencies
vi.mock('@/utils/id', () => ({
    generateNodeId: () => 'mock-id'
}))

// Mock text layout util since it's used inside
vi.mock('@/features/konva-editor/utils/textLayout', () => ({
    calculateInitialTextBoxSize: () => ({ w: 100, h: 20 })
}))

describe('features/konva-editor/hooks/useCanvasOperations', () => {
    const mockTemplateDoc = {
        id: 'doc1',
        surfaces: [{ id: 'page-1', w: 210, h: 297 }],
        nodes: []
    } as any

    const mockOnTemplateChange = vi.fn()
    const mockOnSelectElement = vi.fn()
    const mockOnToolSelect = vi.fn()
    const mockResolveText = vi.fn((key, def) => def || key)

    const defaultProps = {
        templateDoc: mockTemplateDoc,
        onTemplateChange: mockOnTemplateChange,
        onSelectElement: mockOnSelectElement,
        onToolSelect: mockOnToolSelect,
        resolveText: mockResolveText,
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('addText', () => {
        it('adds a text node with default properties', () => {
            const { result } = renderHook(() => useCanvasOperations(defaultProps))

            result.current.addText()

            expect(mockOnTemplateChange).toHaveBeenCalledTimes(1)
            const newDoc = mockOnTemplateChange.mock.calls[0][0]
            expect(newDoc.nodes).toHaveLength(1)
            const newNode = newDoc.nodes[0]

            expect(newNode).toMatchObject({
                id: 'mock-id',
                t: 'text',
                text: 'Text',
                fontSize: ptToMm(24),
                w: 100,
                h: 20
            })
            expect(mockOnSelectElement).toHaveBeenCalledWith('mock-id')
            expect(mockOnToolSelect).toHaveBeenCalledWith('select')
        })
    })

    describe('addShape', () => {
        it('adds a rect shape by default (or unspecified logic)', () => {
            // Logic says if unknown, defaults w=30, h=30
            const { result } = renderHook(() => useCanvasOperations(defaultProps))
            result.current.addShape('rect')

            const newDoc = mockOnTemplateChange.mock.calls[0][0]
            const newNode = newDoc.nodes[0]
            expect(newNode).toMatchObject({
                t: 'shape',
                shape: 'rect',
                w: 30,
                h: 30
            })
        })

        it('adds a trapezoid with specific dimensions', () => {
            const { result } = renderHook(() => useCanvasOperations(defaultProps))
            result.current.addShape('trapezoid')

            const newDoc = mockOnTemplateChange.mock.calls[0][0]
            const newNode = newDoc.nodes[0]
            expect(newNode).toMatchObject({
                shape: 'trapezoid',
                w: 40,
                h: 24
            })
        })
    })

    describe('addLine', () => {
        it('adds a line node', () => {
            const { result } = renderHook(() => useCanvasOperations(defaultProps))
            result.current.addLine()

            const newDoc = mockOnTemplateChange.mock.calls[0][0]
            const newNode = newDoc.nodes[0]
            expect(newNode).toMatchObject({
                t: 'line',
                routing: 'orthogonal'
            })
            expect(newNode.pts).toHaveLength(4) // x, y, x2, y2
        })
    })

    describe('addImage', () => {
        it('adds an image placeholder', () => {
            const { result } = renderHook(() => useCanvasOperations(defaultProps))
            result.current.addImage()

            const newDoc = mockOnTemplateChange.mock.calls[0][0]
            const newNode = newDoc.nodes[0]
            expect(newNode).toMatchObject({
                t: 'image',
                src: '',
                w: 40,
                h: 30
            })
        })
    })

    describe('addTable', () => {
        it('adds a table with default 3x3 structure', () => {
            const { result } = renderHook(() => useCanvasOperations(defaultProps))
            result.current.addTable()

            const newDoc = mockOnTemplateChange.mock.calls[0][0]
            const newNode = newDoc.nodes[0]
            expect(newNode.t).toBe('table')
            expect(newNode.table.rows).toHaveLength(3)
            expect(newNode.table.cols).toHaveLength(3)
            // 3x3 = 9 cells
            expect(newNode.table.cells).toHaveLength(9)
        })
    })
})
