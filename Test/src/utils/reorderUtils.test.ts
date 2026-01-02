import { describe, expect, it } from 'vitest'
import { reorderNodes } from '@/utils/reorderUtils'
import type { UnifiedNode } from '@/types/canvas'

const createNodes = (ids: string[]): UnifiedNode[] => {
    return ids.map(id => ({ id } as UnifiedNode))
}

describe('reorderUtils', () => {
    describe('reorderNodes', () => {
        it('returns original array if target not found', () => {
            const nodes = createNodes(['1', '2', '3'])
            const result = reorderNodes(nodes, '4', 'bringToFront')
            expect(result).toBe(nodes) // Should return same reference
        })

        it('bringToFront: moves item to end', () => {
            const nodes = createNodes(['1', '2', '3'])
            const result = reorderNodes(nodes, '1', 'bringToFront')
            expect(result.map(n => n.id)).toEqual(['2', '3', '1'])
        })

        it('sendToBack: moves item to start', () => {
            const nodes = createNodes(['1', '2', '3'])
            const result = reorderNodes(nodes, '3', 'sendToBack')
            expect(result.map(n => n.id)).toEqual(['3', '1', '2'])
        })

        it('bringForward: moves item one step up', () => {
            const nodes = createNodes(['1', '2', '3'])
            const result = reorderNodes(nodes, '1', 'bringForward')
            expect(result.map(n => n.id)).toEqual(['2', '1', '3'])
        })

        it('bringForward: does nothing if already at end', () => {
            const nodes = createNodes(['1', '2', '3'])
            const result = reorderNodes(nodes, '3', 'bringForward')
            expect(result.map(n => n.id)).toEqual(['1', '2', '3'])
        })

        it('sendBackward: moves item one step down', () => {
            const nodes = createNodes(['1', '2', '3'])
            const result = reorderNodes(nodes, '3', 'sendBackward')
            expect(result.map(n => n.id)).toEqual(['1', '3', '2'])
        })

        it('sendBackward: does nothing if already at start', () => {
            const nodes = createNodes(['1', '2', '3'])
            const result = reorderNodes(nodes, '1', 'sendBackward')
            expect(result.map(n => n.id)).toEqual(['1', '2', '3'])
        })
    })
})
