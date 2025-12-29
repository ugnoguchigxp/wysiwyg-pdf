import { describe, it, expect } from 'vitest'
import { getMergedNodes } from '@/utils/master'
import type { Doc, TextNode } from '@/types/canvas'

function createDocWithMaster(): Doc {
    return {
        v: 1,
        id: 'test-doc',
        title: 'Test',
        unit: 'mm',
        surfaces: [
            { id: 'master-default', type: 'slide', w: 297, h: 210 },
            { id: 'slide-1', type: 'slide', w: 297, h: 210, masterId: 'master-default' },
        ],
        nodes: [
            // Master nodes
            {
                t: 'text',
                id: 'master-title',
                s: 'master-default',
                x: 10,
                y: 10,
                w: 100,
                h: 20,
                text: 'Master Title',
                isPlaceholder: true,
                name: 'title',
            } as TextNode,
            {
                t: 'text',
                id: 'master-footer',
                s: 'master-default',
                x: 10,
                y: 180,
                w: 100,
                h: 20,
                text: 'Footer',
            } as TextNode,
            // Slide nodes (overriding placeholder)
            {
                t: 'text',
                id: 'slide-title',
                s: 'slide-1',
                x: 10,
                y: 10,
                w: 100,
                h: 20,
                text: 'Slide Title',
                name: 'title',
            } as TextNode,
        ],
    }
}

describe('getMergedNodes', () => {
    it('should return only surface nodes if no masterId', () => {
        const doc = createDocWithMaster()
        const nodes = getMergedNodes(doc, 'master-default')

        expect(nodes.length).toBe(2)
        expect(nodes.every((n) => n.s === 'master-default')).toBe(true)
    })

    it('should merge master nodes with slide nodes', () => {
        const doc = createDocWithMaster()
        const nodes = getMergedNodes(doc, 'slide-1')

        // Should include: master-footer (non-placeholder) + slide-title (override)
        // master-title is excluded because it's a placeholder with matching name
        expect(nodes.length).toBe(2)
    })

    it('should exclude overridden placeholders', () => {
        const doc = createDocWithMaster()
        const nodes = getMergedNodes(doc, 'slide-1')

        const masterTitle = nodes.find((n) => n.id === 'master-title')
        expect(masterTitle).toBeUndefined()
    })

    it('should include non-placeholder master nodes', () => {
        const doc = createDocWithMaster()
        const nodes = getMergedNodes(doc, 'slide-1')

        const footer = nodes.find((n) => n.id === 'master-footer')
        expect(footer).toBeDefined()
    })

    it('should include all slide nodes', () => {
        const doc = createDocWithMaster()
        const nodes = getMergedNodes(doc, 'slide-1')

        const slideTitle = nodes.find((n) => n.id === 'slide-title')
        expect(slideTitle).toBeDefined()
    })

    it('should return empty array for non-existent surface', () => {
        const doc = createDocWithMaster()
        const nodes = getMergedNodes(doc, 'non-existent')

        expect(nodes).toEqual([])
    })
})
