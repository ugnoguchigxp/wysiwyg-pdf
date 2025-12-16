import { render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { ElementRenderer } from '@/features/bed-layout-dashboard/components/ElementRenderer'

// Mock Konva components
vi.mock('react-konva', () => ({
    Transformer: () => <div data-testid="Transformer" />,
    Group: ({ children, ...props }: any) => <div data-testid="Group" data-props={JSON.stringify(props)}>{children}</div>,
    Rect: (props: any) => <div data-testid="Rect" data-props={JSON.stringify(props)} />,
    Circle: (props: any) => <div data-testid="Circle" ref={(node) => { if (node) (node as any).__props = props }} />,
    Ellipse: (props: any) => <div data-testid="Ellipse" data-props={JSON.stringify(props)} />,
    Text: (props: any) => <div data-testid="Text" data-props={JSON.stringify(props)} />,
    Image: (props: any) => <div data-testid="Image" data-props={JSON.stringify(props)} />,
    Line: (props: any) => <div data-testid="Line" data-props={JSON.stringify(props)} />,
}))

// Mock useImage hook if strictly necessary, but ImageElement usually handles it.
// If ImageElement uses useImage from use-image, we might need to mock it.
// Let's assume basic rendering for now.

describe('features/bed-layout-dashboard/ElementRenderer', () => {
    const commonProps = {
        isSelected: false,
        onSelect: vi.fn(),
        onChange: vi.fn(),
        readOnly: false,
    }

    it('renders text element', () => {
        render(
            <ElementRenderer
                element={{ id: 't1', t: 'text', s: 'surface', x: 0, y: 0, text: 'Hello', fontSize: 12, fill: 'red' } as any}
                {...commonProps}
            />
        )
        expect(screen.getByTestId('Text')).toBeInTheDocument()
        // It actually imports TextElement, which renders Text.
    })

    it('renders shape element (rect)', () => {
        render(
            <ElementRenderer
                element={{ id: 's1', t: 'shape', s: 'surface', shape: 'rect', x: 0, y: 0, w: 10, h: 10, fill: 'blue' } as any}
                {...commonProps}
            />
        )
        // ShapeElement -> Rect
        expect(screen.getByTestId('Rect')).toBeInTheDocument()
    })

    it('renders image element', () => {
        render(
            <ElementRenderer
                element={{ id: 'i1', t: 'image', s: 'surface', x: 0, y: 0, w: 10, h: 10, src: 'url' } as any}
                {...commonProps}
            />
        )
        // ImageElement -> Image
        expect(screen.getByTestId('Image')).toBeInTheDocument()
    })

    it('renders bed widget', () => {
        render(
            <ElementRenderer
                element={{ id: 'b1', t: 'widget', s: 'surface', widget: 'bed', x: 0, y: 0, w: 100, h: 200, props: { name: 'Bed 1' } } as any}
                {...commonProps}
            />
        )
        // BedElement -> Group + Rect + Text
        expect(screen.getAllByTestId('Rect').length).toBeGreaterThan(0)
        expect(screen.getAllByTestId('Text').length).toBeGreaterThan(0)
    })

    it('renders line element', () => {
        render(
            <ElementRenderer
                element={{ id: 'l1', t: 'line', s: 'surface', pts: [0, 0, 10, 10], stroke: 'black' } as any}
                {...commonProps}
            />
        )
        // LineElement -> Group + Line (body) + Circles (handles if selected/editable?)
        expect(screen.getByTestId('Line')).toBeInTheDocument()
    })
})
