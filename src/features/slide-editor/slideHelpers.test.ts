/**
 * Tests for slideHelpers utility functions
 * Comprehensive tests for slide/master logic
 */

import { describe, expect, it } from 'vitest'
import {
    isMasterSurface,
    getFirstSlideId,
    getFirstMasterId,
    processMasterNodesForDisplay,
    mergeDisplayNodes,
    getSlidePageNumber,
    getTargetMasterIdForEdit,
    getTargetSlideIdForExit
} from '@/features/slide-editor/utils/slideHelpers'
import type { Surface, UnifiedNode, TextNode } from '@/types/canvas'

describe('slideHelpers', () => {
    // Test fixtures
    const createSurfaces = (): Surface[] => [
        { id: 'master-title', type: 'slide', w: 297, h: 210, bg: '#ffffff' },
        { id: 'master-content', type: 'slide', w: 297, h: 210, bg: '#ffffff' },
        { id: 'master-blank', type: 'slide', w: 297, h: 210, bg: '#ffffff' },
        { id: 'slide-1', type: 'slide', w: 297, h: 210, masterId: 'master-title' },
        { id: 'slide-2', type: 'slide', w: 297, h: 210, masterId: 'master-content' },
        { id: 'slide-3', type: 'slide', w: 297, h: 210, masterId: 'master-title' },
    ] as Surface[]

    describe('isMasterSurface', () => {
        it('returns true for master surfaces (no masterId)', () => {
            const surfaces = createSurfaces()
            expect(isMasterSurface(surfaces[0])).toBe(true) // master-title
            expect(isMasterSurface(surfaces[1])).toBe(true) // master-content
        })

        it('returns false for master-blank', () => {
            const surfaces = createSurfaces()
            expect(isMasterSurface(surfaces[2])).toBe(false) // master-blank
        })

        it('returns false for regular slides (has masterId)', () => {
            const surfaces = createSurfaces()
            expect(isMasterSurface(surfaces[3])).toBe(false) // slide-1
            expect(isMasterSurface(surfaces[4])).toBe(false) // slide-2
        })

        it('returns false for undefined', () => {
            expect(isMasterSurface(undefined)).toBe(false)
        })
    })

    describe('getFirstSlideId', () => {
        it('returns first slide with masterId', () => {
            const surfaces = createSurfaces()
            expect(getFirstSlideId(surfaces)).toBe('slide-1')
        })

        it('returns first surface if no slides exist', () => {
            const mastersOnly: Surface[] = [
                { id: 'master-1', type: 'slide', w: 297, h: 210 } as Surface,
            ]
            expect(getFirstSlideId(mastersOnly)).toBe('master-1')
        })

        it('returns empty string for empty array', () => {
            expect(getFirstSlideId([])).toBe('')
        })
    })

    describe('getFirstMasterId', () => {
        it('returns first master (excluding master-blank)', () => {
            const surfaces = createSurfaces()
            expect(getFirstMasterId(surfaces)).toBe('master-title')
        })

        it('returns undefined if no masters exist', () => {
            const slidesOnly: Surface[] = [
                { id: 'slide-1', type: 'slide', w: 297, h: 210, masterId: 'master-x' } as Surface,
            ]
            expect(getFirstMasterId(slidesOnly)).toBeUndefined()
        })

        it('skips master-blank', () => {
            const surfaces: Surface[] = [
                { id: 'master-blank', type: 'slide', w: 297, h: 210 } as Surface,
                { id: 'master-title', type: 'slide', w: 297, h: 210 } as Surface,
            ]
            expect(getFirstMasterId(surfaces)).toBe('master-title')
        })
    })

    describe('processMasterNodesForDisplay', () => {
        it('filters out placeholders', () => {
            const masterNodes: UnifiedNode[] = [
                { id: 'n1', t: 'text', s: 'm1', x: 0, y: 0, w: 100, h: 20, text: 'Title', isPlaceholder: true },
                { id: 'n2', t: 'text', s: 'm1', x: 0, y: 50, w: 100, h: 20, text: 'Content' },
            ] as UnifiedNode[]

            const result = processMasterNodesForDisplay(masterNodes, 1)
            expect(result).toHaveLength(1)
            expect(result[0].id).toBe('n2')
        })

        it('locks all nodes', () => {
            const masterNodes: UnifiedNode[] = [
                { id: 'n1', t: 'shape', s: 'm1', x: 0, y: 0, w: 100, h: 100, shape: 'rect' },
            ] as UnifiedNode[]

            const result = processMasterNodesForDisplay(masterNodes, 1)
            expect(result[0].locked).toBe(true)
        })

        it('replaces slide-number dynamic content', () => {
            const masterNodes: UnifiedNode[] = [
                { id: 'n1', t: 'text', s: 'm1', x: 0, y: 0, w: 50, h: 20, text: '#', dynamicContent: 'slide-number' },
            ] as UnifiedNode[]

            const result = processMasterNodesForDisplay(masterNodes, 5)
            expect((result[0] as TextNode).text).toBe('5')
        })

        it('does not modify non-dynamic text', () => {
            const masterNodes: UnifiedNode[] = [
                { id: 'n1', t: 'text', s: 'm1', x: 0, y: 0, w: 100, h: 20, text: 'Static Text' },
            ] as UnifiedNode[]

            const result = processMasterNodesForDisplay(masterNodes, 3)
            expect((result[0] as TextNode).text).toBe('Static Text')
        })
    })

    describe('mergeDisplayNodes', () => {
        const masterNodes: UnifiedNode[] = [
            { id: 'm1', t: 'shape', s: 'master', x: 0, y: 0, w: 100, h: 100, shape: 'rect', locked: true },
        ] as UnifiedNode[]
        const slideNodes: UnifiedNode[] = [
            { id: 's1', t: 'text', s: 'slide', x: 10, y: 10, w: 50, h: 20, text: 'Hello' },
        ] as UnifiedNode[]

        it('returns only current surface nodes in master edit mode', () => {
            const result = mergeDisplayNodes(true, masterNodes, slideNodes)
            expect(result).toEqual(slideNodes)
        })

        it('merges master and slide nodes in slide edit mode', () => {
            const result = mergeDisplayNodes(false, masterNodes, slideNodes)
            expect(result).toHaveLength(2)
            expect(result[0].id).toBe('m1')
            expect(result[1].id).toBe('s1')
        })
    })

    describe('getSlidePageNumber', () => {
        const surfaces = createSurfaces()

        it('returns 1 for first slide', () => {
            expect(getSlidePageNumber(surfaces, 'slide-1')).toBe(1)
        })

        it('returns correct index for subsequent slides', () => {
            expect(getSlidePageNumber(surfaces, 'slide-2')).toBe(2)
            expect(getSlidePageNumber(surfaces, 'slide-3')).toBe(3)
        })

        it('returns 1 for masters', () => {
            expect(getSlidePageNumber(surfaces, 'master-title')).toBe(1)
        })

        it('returns 1 for non-existent slide', () => {
            expect(getSlidePageNumber(surfaces, 'non-existent')).toBe(1)
        })
    })

    describe('getTargetMasterIdForEdit', () => {
        const surfaces = createSurfaces()

        it('returns masterId of current slide', () => {
            const currentSlide = surfaces.find(s => s.id === 'slide-1')
            expect(getTargetMasterIdForEdit(currentSlide, surfaces)).toBe('master-title')
        })

        it('falls back to first master if masterId is master-blank', () => {
            const currentSlide: Surface = { id: 'slide-x', type: 'slide', w: 297, h: 210, masterId: 'master-blank' } as Surface
            expect(getTargetMasterIdForEdit(currentSlide, surfaces)).toBe('master-title')
        })

        it('falls back to first master if no masterId', () => {
            const currentSlide: Surface = { id: 'master-x', type: 'slide', w: 297, h: 210 } as Surface
            expect(getTargetMasterIdForEdit(currentSlide, surfaces)).toBe('master-title')
        })

        it('returns undefined if no masters exist', () => {
            const slidesOnly: Surface[] = [
                { id: 'slide-1', type: 'slide', w: 297, h: 210, masterId: 'missing' } as Surface,
            ]
            const currentSlide = slidesOnly[0]
            expect(getTargetMasterIdForEdit(currentSlide, slidesOnly)).toBeUndefined()
        })
    })

    describe('getTargetSlideIdForExit', () => {
        const surfaces = createSurfaces()

        it('returns lastSlideId if provided', () => {
            expect(getTargetSlideIdForExit('slide-2', surfaces)).toBe('slide-2')
        })

        it('returns first slide if lastSlideId is null', () => {
            expect(getTargetSlideIdForExit(null, surfaces)).toBe('slide-1')
        })
    })
})
