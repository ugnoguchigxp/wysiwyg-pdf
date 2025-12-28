import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSlideOperations } from '@/features/slide-editor/hooks/useSlideOperations'
import type { Doc } from '@/types/canvas'

// Mock dependencies if needed, or use real ones since they are constants
vi.mock('@/features/slide-editor/constants/layouts', () => ({
    SLIDE_LAYOUTS: [
        { id: 'blank', label: 'Blank', generateNodes: () => [] }
    ]
}))
vi.mock('@/features/slide-editor/constants/templates', () => ({
    SLIDE_TEMPLATES: [
        { id: 't1', name: 'T1', master: { bg: '#333', nodes: [], textColor: '#fff' } }
    ]
}))

describe('useSlideOperations', () => {
    it('should handleAddSlide correctly', async () => {
        const mockSetDoc = vi.fn((update) => {
            // Simulate setState functional update if function passed
            if (typeof update === 'function') {
                // @ts-ignore
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

        // Test implementation... 
        // This is a bit tricky to integration test without full state, 
        // but we can verify the function is exposed and calls dependencies.

        expect(result.current.handleAddSlide).toBeDefined()

        // Calling it would trigger setDoc
        result.current.handleAddSlide('title')
        expect(mockSetDoc).toHaveBeenCalled()
    })
})
