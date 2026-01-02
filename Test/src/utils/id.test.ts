import { describe, expect, it } from 'vitest'
import { generateNodeId, generateSurfaceId } from '@/utils/id'
import type { Doc } from '@/types/canvas'

const mockDoc: Doc = {
    id: 'doc1',
    nodes: [
        { id: 'txt-1', t: 'text' },
        { id: 'shp-1', t: 'shape' },
    ],
    surfaces: [
        { id: 'page-1', t: 'page', nodes: [] },
    ],
} as any // cast for partial mock

describe('id', () => {
    describe('generateNodeId', () => {
        it('generates next id when collision exists', () => {
            const id = generateNodeId(mockDoc, 'text')
            expect(id).toBe('txt-2')
        })

        it('generates first id when no collision', () => {
            const id = generateNodeId(mockDoc, 'image')
            expect(id).toBe('img-1')
        })
    })

    describe('generateSurfaceId', () => {
        it('generates next id for page', () => {
            const id = generateSurfaceId(mockDoc, 'page')
            expect(id).toBe('page-2')
        })

        it('generates first id for slide', () => {
            const id = generateSurfaceId(mockDoc, 'slide')
            expect(id).toBe('slide-1')
        })
    })
})
