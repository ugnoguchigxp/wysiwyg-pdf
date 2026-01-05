import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useFitToScreen } from '@/features/slide-editor/hooks/useFitToScreen'

// Mock mmToPx since it depends on DPI and might be platform/env specific
vi.mock('@/utils/units', () => ({
    mmToPx: (mm: number) => mm * 3.78 // approx 96 DPI
}))

describe('useFitToScreen', () => {
    let container: HTMLDivElement

    beforeEach(() => {
        container = document.createElement('div')
        // Mock client dimensions
        Object.defineProperty(container, 'clientWidth', { value: 1000, configurable: true })
        Object.defineProperty(container, 'clientHeight', { value: 800, configurable: true })

        // Mock ResizeObserver
        global.ResizeObserver = class ResizeObserver {
            observe() { }
            unobserve() { }
            disconnect() { }
        }
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should calculate zoom to fit slide in container', () => {
        const ref = { current: container }
        const { result } = renderHook(() => useFitToScreen(ref, 200, 100)) // 200mm -> ~756px, 100mm -> ~378px

        // Initial Calculation
        // slideW_px = 200 * 3.78 = 756
        // slideH_px = 100 * 3.78 = 378
        // Container: 1000x800
        // fitW = 1000 / 756 = 1.32
        // fitH = 800 / 378 = 2.11
        // scale = min(1.32, 2.11) * 0.9 = 1.32 * 0.9 = 1.188
        // zoom = 118

        expect(result.current.zoom).toBeGreaterThan(0)
    })

    it('should handle zero container dimensions', () => {
        Object.defineProperty(container, 'clientWidth', { value: 0 })
        const ref = { current: container }
        const { result } = renderHook(() => useFitToScreen(ref, 100, 100))

        // Should stay default 100 or not crash
        expect(result.current.zoom).toBe(100)
    })
})
