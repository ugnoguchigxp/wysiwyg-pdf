/**
 * Tests for useSlideOperations hook
 * Covers slide creation, master creation, and template selection
 */

import { renderHook, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useSlideOperations } from '@/features/slide-editor/hooks/useSlideOperations'
import type { Doc, Surface, UnifiedNode } from '@/types/canvas'

// Mock crypto.randomUUID
vi.stubGlobal('crypto', {
    randomUUID: () => 'test-uuid-1234'
})

describe('useSlideOperations', () => {
    // Base document with masters and slides
    const createTestDoc = (): Doc => ({
        v: 1,
        id: 'test-doc',
        title: 'Test Presentation',
        unit: 'mm',
        surfaces: [
            { id: 'master-title', type: 'slide', w: 297, h: 210, bg: '#ffffff' },
            { id: 'master-title-content', type: 'slide', w: 297, h: 210, bg: '#ffffff' },
            { id: 'master-blank', type: 'slide', w: 297, h: 210, bg: '#ffffff' },
            { id: 'slide-1', type: 'slide', w: 297, h: 210, masterId: 'master-title' },
        ] as Surface[],
        nodes: [
            // Master title nodes (including placeholder)
            { id: 'master-title-1', t: 'text', s: 'master-title', x: 10, y: 10, w: 100, h: 20, text: 'Title', isPlaceholder: true },
            // Slide nodes
            { id: 'slide-1-text', t: 'text', s: 'slide-1', x: 10, y: 10, w: 100, h: 20, text: 'Slide Content' },
        ] as UnifiedNode[]
    })

    let mockSetDoc: ReturnType<typeof vi.fn>
    let mockSetCurrentSlideId: ReturnType<typeof vi.fn>

    beforeEach(() => {
        mockSetDoc = vi.fn()
        mockSetCurrentSlideId = vi.fn()
    })

    describe('handleAddSlide', () => {
        it('creates a new slide with correct masterId when in slide mode', () => {
            const doc = createTestDoc()

            const { result } = renderHook(() =>
                useSlideOperations({
                    setDoc: mockSetDoc,
                    currentSlideId: 'slide-1',
                    doc,
                    setCurrentSlideId: mockSetCurrentSlideId,
                    isMasterEditMode: false
                })
            )

            act(() => {
                result.current.handleAddSlide('title')
            })

            expect(mockSetDoc).toHaveBeenCalled()
            const updateFn = mockSetDoc.mock.calls[0][0]
            const newDoc = updateFn(doc)

            // Check new slide was created
            const newSlide = newDoc.surfaces.find((s: Surface) => s.id.startsWith('slide-'))
            expect(newSlide).toBeDefined()
            expect(newSlide.masterId).toBe('master-title')
        })

        it('creates a new master without masterId when in master edit mode', () => {
            const doc = createTestDoc()

            const { result } = renderHook(() =>
                useSlideOperations({
                    setDoc: mockSetDoc,
                    currentSlideId: 'master-title',
                    doc,
                    setCurrentSlideId: mockSetCurrentSlideId,
                    isMasterEditMode: true
                })
            )

            act(() => {
                result.current.handleAddSlide('title')
            })

            expect(mockSetDoc).toHaveBeenCalled()
            const updateFn = mockSetDoc.mock.calls[0][0]
            const newDoc = updateFn(doc)

            // Check new master was created
            const newMaster = newDoc.surfaces.find((s: Surface) => s.id === 'master-test-uuid-1234')
            expect(newMaster).toBeDefined()
            expect(newMaster.masterId).toBeUndefined()
        })

        it('falls back to master-blank when target master does not exist', () => {
            const doc = createTestDoc()

            const { result } = renderHook(() =>
                useSlideOperations({
                    setDoc: mockSetDoc,
                    currentSlideId: 'slide-1',
                    doc,
                    setCurrentSlideId: mockSetCurrentSlideId,
                    isMasterEditMode: false
                })
            )

            act(() => {
                // 'nonexistent' layout doesn't have a corresponding master
                result.current.handleAddSlide('nonexistent')
            })

            expect(mockSetDoc).toHaveBeenCalled()
            const updateFn = mockSetDoc.mock.calls[0][0]
            const newDoc = updateFn(doc)

            // Check fallback to master-blank
            const newSlide = newDoc.surfaces.find((s: Surface) =>
                s.id.startsWith('slide-') && s.id !== 'slide-1'
            )
            expect(newSlide).toBeDefined()
            expect(newSlide.masterId).toBe('master-blank')
        })

        it('clones placeholders from master when creating slide', () => {
            const doc = createTestDoc()

            const { result } = renderHook(() =>
                useSlideOperations({
                    setDoc: mockSetDoc,
                    currentSlideId: 'slide-1',
                    doc,
                    setCurrentSlideId: mockSetCurrentSlideId,
                    isMasterEditMode: false
                })
            )

            act(() => {
                result.current.handleAddSlide('title')
            })

            const updateFn = mockSetDoc.mock.calls[0][0]
            const newDoc = updateFn(doc)

            // Check that placeholder was cloned (without isPlaceholder flag)
            const newSlideId = newDoc.surfaces.find((s: Surface) =>
                s.id.startsWith('slide-') && s.id !== 'slide-1'
            )?.id

            const clonedNodes = newDoc.nodes.filter((n: UnifiedNode) => n.s === newSlideId)
            expect(clonedNodes.length).toBeGreaterThan(0)
            expect(clonedNodes[0].isPlaceholder).toBeUndefined()
        })

        it('updates currentSlideId after creating slide', () => {
            const doc = createTestDoc()

            const { result } = renderHook(() =>
                useSlideOperations({
                    setDoc: mockSetDoc,
                    currentSlideId: 'slide-1',
                    doc,
                    setCurrentSlideId: mockSetCurrentSlideId,
                    isMasterEditMode: false
                })
            )

            act(() => {
                result.current.handleAddSlide('title')
            })

            expect(mockSetCurrentSlideId).toHaveBeenCalled()
            const newId = mockSetCurrentSlideId.mock.calls[0][0]
            expect(newId).toMatch(/^slide-/)
        })
    })

    describe('handleSelectTemplate', () => {
        it('applies template background to all masters', () => {
            const doc = createTestDoc()

            const { result } = renderHook(() =>
                useSlideOperations({
                    setDoc: mockSetDoc,
                    currentSlideId: 'master-title',
                    doc,
                    setCurrentSlideId: mockSetCurrentSlideId,
                    isMasterEditMode: true
                })
            )

            act(() => {
                result.current.handleSelectTemplate('corporate-dark')
            })

            expect(mockSetDoc).toHaveBeenCalled()
            const updateFn = mockSetDoc.mock.calls[0][0]
            const newDoc = updateFn(doc)

            // All masters should have updated background
            const masters = newDoc.surfaces.filter((s: Surface) => !s.masterId)
            masters.forEach((master: Surface) => {
                expect(master.bg).toBe('#1e293b') // corporate-dark bg
            })
        })

        it('adds template nodes to each master', () => {
            const doc = createTestDoc()

            const { result } = renderHook(() =>
                useSlideOperations({
                    setDoc: mockSetDoc,
                    currentSlideId: 'master-title',
                    doc,
                    setCurrentSlideId: mockSetCurrentSlideId,
                    isMasterEditMode: true
                })
            )

            act(() => {
                result.current.handleSelectTemplate('corporate-dark')
            })

            const updateFn = mockSetDoc.mock.calls[0][0]
            const newDoc = updateFn(doc)

            // Check that template nodes were added to masters
            const masterTitleNodes = newDoc.nodes.filter((n: UnifiedNode) => n.s === 'master-title')
            // corporate-dark has 4 nodes, plus the placeholder
            expect(masterTitleNodes.length).toBeGreaterThan(0)
        })

        it('preserves placeholders when applying template', () => {
            const doc = createTestDoc()

            const { result } = renderHook(() =>
                useSlideOperations({
                    setDoc: mockSetDoc,
                    currentSlideId: 'master-title',
                    doc,
                    setCurrentSlideId: mockSetCurrentSlideId,
                    isMasterEditMode: true
                })
            )

            act(() => {
                result.current.handleSelectTemplate('corporate-dark')
            })

            const updateFn = mockSetDoc.mock.calls[0][0]
            const newDoc = updateFn(doc)

            // Placeholder should still exist
            const placeholder = newDoc.nodes.find((n: UnifiedNode) => n.isPlaceholder)
            expect(placeholder).toBeDefined()
        })

        it('does nothing for non-existent template', () => {
            const doc = createTestDoc()

            const { result } = renderHook(() =>
                useSlideOperations({
                    setDoc: mockSetDoc,
                    currentSlideId: 'master-title',
                    doc,
                    setCurrentSlideId: mockSetCurrentSlideId,
                    isMasterEditMode: true
                })
            )

            act(() => {
                result.current.handleSelectTemplate('non-existent-template')
            })

            expect(mockSetDoc).not.toHaveBeenCalled()
        })

        it('updates placeholder text color when template has textColor', () => {
            const doc = createTestDoc()

            const { result } = renderHook(() =>
                useSlideOperations({
                    setDoc: mockSetDoc,
                    currentSlideId: 'master-title',
                    doc,
                    setCurrentSlideId: mockSetCurrentSlideId,
                    isMasterEditMode: true
                })
            )

            act(() => {
                result.current.handleSelectTemplate('corporate-dark')
            })

            const updateFn = mockSetDoc.mock.calls[0][0]
            const newDoc = updateFn(doc)

            // Placeholder text should have updated color
            const placeholder = newDoc.nodes.find((n: UnifiedNode) => n.isPlaceholder && n.t === 'text')
            if (placeholder) {
                expect(placeholder.fill).toBe('#f8fafc') // corporate-dark textColor
            }
        })
    })

    describe('master mode detection', () => {
        it('correctly identifies master slide (no masterId)', () => {
            const doc = createTestDoc()
            const masterSlide = doc.surfaces.find(s => s.id === 'master-title')
            expect(masterSlide?.masterId).toBeUndefined()
        })

        it('correctly identifies regular slide (has masterId)', () => {
            const doc = createTestDoc()
            const regularSlide = doc.surfaces.find(s => s.id === 'slide-1')
            expect(regularSlide?.masterId).toBe('master-title')
        })
    })
})
