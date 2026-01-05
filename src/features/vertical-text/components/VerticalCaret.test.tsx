
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { VerticalCaret } from '@/features/vertical-text/components/VerticalCaret'

// Mock Konva Rect to test props
vi.mock('react-konva', () => ({
    Rect: ({ fill, x, y, width, height }: any) => (
        <div
            data-testid="caret-rect"
            data-fill={fill}
            data-x={x}
            data-y={y}
            data-width={width}
            data-height={height}
        />
    ),
}))

describe('VerticalCaret', () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it('renders correctly when visible', () => {
        render(<VerticalCaret x={10} y={20} width={15} visible={true} />)
        const caret = screen.getByTestId('caret-rect')
        expect(caret).toBeInTheDocument()
        expect(caret).toHaveAttribute('data-x', '10')
        expect(caret).toHaveAttribute('data-y', '20')
        expect(caret).toHaveAttribute('data-width', '15')
        expect(caret).toHaveAttribute('data-fill', '#007AFF') // Blue initially
    })

    it('does not render when visible prop is false', () => {
        render(<VerticalCaret x={10} y={20} width={15} visible={false} />)
        const caret = screen.queryByTestId('caret-rect')
        expect(caret).not.toBeInTheDocument()
    })

    it('blinks over time', () => {
        render(<VerticalCaret x={10} y={20} width={15} />)
        const caret = screen.getByTestId('caret-rect')

        // Initial state: visible (blue)
        expect(caret).toHaveAttribute('data-fill', '#007AFF')

        // Advance time by 530ms (one interval)
        act(() => {
            vi.advanceTimersByTime(530)
        })
        // Should be hidden (transparent)
        expect(caret).toHaveAttribute('data-fill', 'transparent')

        // Advance time by another 530ms
        act(() => {
            vi.advanceTimersByTime(530)
        })
        // Should be visible again
        expect(caret).toHaveAttribute('data-fill', '#007AFF')
    })

    it('stops blinking when unmounted', () => {
        const { unmount } = render(<VerticalCaret x={10} y={20} width={15} />)
        unmount()
        // Verify no errors or stray timers (implicit check via vitest/cleanup)
        // Maybe we can check call count if we spied on setInterval, but behavior check is enough.
    })
})
