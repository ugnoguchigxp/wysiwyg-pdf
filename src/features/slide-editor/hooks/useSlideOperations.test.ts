import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSlideOperations } from '@/features/slide-editor/hooks/useSlideOperations'
import type { Doc } from '@/types/canvas'

// Mock dependencies if needed, or use real ones since they are constants
vi.mock('@/features/slide-editor/constants/layouts', () => ({
    SLIDE_LAYOUTS: [
        { id: 'blank', label: 'Blank', generateNodes: () => [] },
        { id: 'title', label: 'Title', generateNodes: (id: string, w: number, h: number) => [
            { id: `n-${id}`, t: 'text', s: id, x: 20, y: 50, w: 200, h: 30, text: 'Title' }
        ] }
    ]
}))
vi.mock('@/features/slide-editor/constants/templates', () => ({
    SLIDE_TEMPLATES: [
        { id: 't1', name: 'T1', master: { bg: '#333', nodes: [], textColor: '#fff' } },
        { id: 't2', name: 'T2', master: { bg: '#fff', nodes: [], textColor: '#000' } }
    ]
}))

describe('useSlideOperations', () => {
    it('should handleAddSlide correctly', () => {
        const mockSetDoc = vi.fn((update) => {
            if (typeof update === 'function') {
                update({ surfaces: [], nodes: [] })
            }
        })
        const mockSetCurrentSlideId = vi.fn()

        const doc: Doc = {
            v: 1, id: 'test', title: 'test', unit: 'mm',
            surfaces: [
                { id: 'master-title', type: 'slide', w: 100, h: 100, bg: '#fff' }
            ],
            nodes: []
        }

        const { result } = renderHook(() => useSlideOperations({
            setDoc: mockSetDoc,
            currentSlideId: 'master-title',
            doc,
            setCurrentSlideId: mockSetCurrentSlideId,
            isMasterEditMode: false
        }))

        expect(result.current.handleAddSlide).toBeDefined()

        result.current.handleAddSlide('title')
        expect(mockSetDoc).toHaveBeenCalled()
        expect(mockSetCurrentSlideId).toHaveBeenCalled()
    })

    it('should handleAddSlide in master edit mode', () => {
        const mockSetDoc = vi.fn()
        const mockSetCurrentSlideId = vi.fn()

        const doc: Doc = {
            v: 1, id: 'test', title: 'test', unit: 'mm',
            surfaces: [
                { id: 's1', type: 'slide', w: 100, h: 100, bg: '#fff' }
            ],
            nodes: []
        }

        const { result } = renderHook(() => useSlideOperations({
            setDoc: mockSetDoc,
            currentSlideId: 's1',
            doc,
            setCurrentSlideId: mockSetCurrentSlideId,
            isMasterEditMode: true
        }))

        result.current.handleAddSlide('title')
        expect(mockSetDoc).toHaveBeenCalled()
    })

    it('should handleSelectTemplate correctly', () => {
        const mockSetDoc = vi.fn()
        const mockSetCurrentSlideId = vi.fn()

        const doc: Doc = {
            v: 1, id: 'test', title: 'test', unit: 'mm',
            surfaces: [
                { id: 'master1', type: 'slide', w: 100, h: 100, bg: '#fff' },
                { id: 's1', type: 'slide', w: 100, h: 100, bg: '#fff', masterId: 'master1' }
            ],
            nodes: [
                { id: 'n1', t: 'text', s: 'master1', x: 10, y: 10, w: 50, h: 20, text: 'Hello', isPlaceholder: true }
            ]
        }

        const { result } = renderHook(() => useSlideOperations({
            setDoc: mockSetDoc,
            currentSlideId: 's1',
            doc,
            setCurrentSlideId: mockSetCurrentSlideId,
            isMasterEditMode: false
        }))

        result.current.handleSelectTemplate('t1')
        expect(mockSetDoc).toHaveBeenCalled()
    })

    it('should not handleSelectTemplate for non-existent template', () => {
        const mockSetDoc = vi.fn()
        const mockSetCurrentSlideId = vi.fn()

        const doc: Doc = {
            v: 1, id: 'test', title: 'test', unit: 'mm',
            surfaces: [
                { id: 'master1', type: 'slide', w: 100, h: 100, bg: '#fff' }
            ],
            nodes: []
        }

        const { result } = renderHook(() => useSlideOperations({
            setDoc: mockSetDoc,
            currentSlideId: 'master1',
            doc,
            setCurrentSlideId: mockSetCurrentSlideId,
            isMasterEditMode: false
        }))

        result.current.handleSelectTemplate('nonexistent')
        expect(mockSetDoc).not.toHaveBeenCalled()
    })

    it('should copy placeholder nodes when adding slide', () => {
        const mockSetDoc = vi.fn()
        const mockSetCurrentSlideId = vi.fn()

        const doc: Doc = {
            v: 1, id: 'test', title: 'test', unit: 'mm',
            surfaces: [
                { id: 'master-title', type: 'slide', w: 100, h: 100, bg: '#fff' },
                { id: 's1', type: 'slide', w: 100, h: 100, bg: '#fff', masterId: 'master-title' }
            ],
            nodes: [
                { id: 'n1', t: 'text', s: 'master-title', x: 10, y: 10, w: 50, h: 20, text: 'Placeholder', isPlaceholder: true }
            ]
        }

        const { result } = renderHook(() => useSlideOperations({
            setDoc: mockSetDoc,
            currentSlideId: 's1',
            doc,
            setCurrentSlideId: mockSetCurrentSlideId,
            isMasterEditMode: false
        }))

        result.current.handleAddSlide('title')
        expect(mockSetDoc).toHaveBeenCalled()
    })
})
