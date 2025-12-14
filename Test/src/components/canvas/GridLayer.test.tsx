import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { GridLayer } from '@/components/canvas/GridLayer'

vi.mock('react-konva', () => ({
    Layer: ({ children }: any) => <div data-testid="Layer">{children}</div>,
    Line: (props: any) => <div data-testid="Line" data-props={JSON.stringify(props)} />,
}))

describe('components/canvas/GridLayer', () => {
    it('returns null if not visible', () => {
        const { container } = render(
            <GridLayer width={100} height={100} scale={1} visible={false} />
        )
        expect(container).toBeEmptyDOMElement()
    })

    it('renders grid lines when visible', () => {
        render(
            <GridLayer width={100} height={100} scale={1} gridSize={50} visible={true} />
        )

        expect(screen.getByTestId('Layer')).toBeInTheDocument()
        const lines = screen.getAllByTestId('Line')
        // Width 100, Grid 50.
        // X: 0, 50, 100 (3 lines)
        // Y: 0, 50, 100 (3 lines)
        // Total 6 lines.
        expect(lines.length).toBe(6)
    })
})
