import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

// Mock react-konva components as divs for JSDOM testing
vi.mock('react-konva', () => ({
    Group: ({ children, ...props }: any) => (
        <div data-testid="Group" data-props={JSON.stringify(props)}>
            {children}
        </div>
    ),
    Rect: (props: any) => <div data-testid="Rect" data-props={JSON.stringify(props)} />,
    Text: (props: any) => <div data-testid="Text" data-props={JSON.stringify(props)} />,
}))

import { BedElement } from '@/features/konva-editor/renderers/bed-elements/BedElement'

describe('BedElement', () => {
    it('renders a bed with name', () => {
        // BedElement expects a node with t:'widget', widget:'bed'
        // Node structure: { id, t, widget, name, data: { orientation? } }
        const node = {
            id: 'bed1',
            t: 'widget',
            widget: 'bed',
            s: 'layout',
            x: 10,
            y: 10,
            w: 100,
            h: 50,
            name: 'Bed-01',
            data: { orientation: 'horizontal' },
        } as any

        render(
            <BedElement
                element={node}
                isSelected={false}
                onSelect={() => { }}
                onChange={() => { }}
            />
        )

        // Should render Groups wrapping content
        expect(screen.getAllByTestId('Group').length).toBeGreaterThan(0)
        // Should render a Rect (body of bed)
        expect(screen.getAllByTestId('Rect').length).toBeGreaterThan(0)
        // Should render Text (name)
        const textElements = screen.getAllByTestId('Text')
        expect(textElements.length).toBeGreaterThan(0)

        // Check if any text element has the correct text prop
        const nameText = textElements.find(el => {
            const props = JSON.parse(el.getAttribute('data-props') || '{}')
            return props.text === 'Bed-01'
        })
        expect(nameText).toBeTruthy()

        const textProps = JSON.parse(nameText!.getAttribute('data-props') || '{}')
        expect(textProps.text).toBe('Bed-01')
    })

    it('handles vertical orientation', () => {
        const node = {
            id: 'bed2',
            t: 'widget',
            widget: 'bed',
            s: 'layout',
            x: 0,
            y: 0,
            w: 50,
            h: 100,
            name: 'V-Bed',
            data: { orientation: 'vertical' },
        } as any

        render(
            <BedElement
                element={node}
                isSelected={true} // Test selected state if it affects rendering
                onSelect={() => { }}
                onChange={() => { }}
            />
        )
        // Basic rendering check
        expect(screen.getAllByTestId('Group').length).toBeGreaterThan(0)
    })
})

