import { describe, it, expect } from 'vitest'
import {
    INITIAL_DOC,
    generateMasterNodes
} from '@/features/slide-editor/utils/slideFactories'

describe('slideFactories', () => {
    it('should generate master nodes with correct defaults', () => {
        const nodes = generateMasterNodes('master-1', 100, 100)
        expect(nodes).toHaveLength(1)
        expect(nodes[0].t).toBe('text')
        // @ts-ignore
        expect(nodes[0].dynamicContent).toBe('slide-number')
    })

    it('should create valid initial document', () => {
        expect(INITIAL_DOC.surfaces.length).toBeGreaterThan(0)
        expect(INITIAL_DOC.nodes.length).toBeGreaterThan(0)
        const masterSurfaces = INITIAL_DOC.surfaces.filter(s => s.masterId === undefined)
        expect(masterSurfaces.length).toBeGreaterThan(0)
    })
})
