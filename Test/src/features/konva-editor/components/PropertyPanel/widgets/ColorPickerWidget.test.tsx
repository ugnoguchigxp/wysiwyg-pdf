
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ColorPickerWidget } from '@/features/konva-editor/components/PropertyPanel/widgets/ColorPickerWidget'
import type { ColorPickerWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { UnifiedNode } from '@/types/canvas'

// Mock dependencies
vi.mock('@/features/konva-editor/components/PropertyPanel/ColorInput', () => ({
    ColorInput: ({ value, onChange }: { value: string; onChange: (val: string) => void }) => (
        <input
            data-testid="color-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    ),
}))

vi.mock('@/features/konva-editor/components/PropertyPanel/shared', () => ({
    WidgetLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('ColorPickerWidget', () => {
    const mockOnChange = vi.fn()
    const mockResolveText = vi.fn((key, fallback) => fallback || key)

    const defaultConfig: ColorPickerWidgetConfig = {
        type: 'color',
        props: {
            fieldKey: 'fill',
        },
    }

    const defaultNode = {
        id: 'node1',
        fill: '#ff0000',
    } as unknown as UnifiedNode

    it('renders correctly with given value', () => {
        render(
            <ColorPickerWidget
                config={defaultConfig}
                node={defaultNode}
                onChange={mockOnChange}
                resolveText={mockResolveText}
                commonProps={{} as any}
            />
        )

        expect(screen.getByText('Color')).toBeInTheDocument()
        const input = screen.getByTestId('color-input') as HTMLInputElement
        expect(input.value).toBe('#ff0000')
    })

    it('renders correct label based on labelKey', () => {
        const config: ColorPickerWidgetConfig = {
            ...defaultConfig,
            labelKey: 'properties_border_color',
        }

        render(
            <ColorPickerWidget
                config={config}
                node={defaultNode}
                onChange={mockOnChange}
                resolveText={mockResolveText}
                commonProps={{} as any}
            />
        )

        expect(screen.getByText('BorderColor')).toBeInTheDocument()
    })

    it('calls onChange when color is updated', () => {
        render(
            <ColorPickerWidget
                config={defaultConfig}
                node={defaultNode}
                onChange={mockOnChange}
                resolveText={mockResolveText}
                commonProps={{} as any}
            />
        )

        const input = screen.getByTestId('color-input')
        fireEvent.change(input, { target: { value: '#0000ff' } })

        expect(mockOnChange).toHaveBeenCalledWith(
            expect.objectContaining({
                fill: '#0000ff',
            }),
            undefined
        )
    })

    it('initializes borderWidth to 0.1 if borderColor is set and width is 0/undefined', () => {
        const borderConfig: ColorPickerWidgetConfig = {
            type: 'color',
            props: {
                fieldKey: 'borderColor',
            },
        }

        const nodeNoBorder = {
            id: 'node2',
            borderColor: '#000000',
            // borderWidth undefined
        } as unknown as UnifiedNode

        render(
            <ColorPickerWidget
                config={borderConfig}
                node={nodeNoBorder}
                onChange={mockOnChange}
                resolveText={mockResolveText}
                commonProps={{} as any}
            />
        )

        const input = screen.getByTestId('color-input')
        fireEvent.change(input, { target: { value: '#00ff00' } })

        expect(mockOnChange).toHaveBeenCalledWith(
            expect.objectContaining({
                borderColor: '#00ff00',
                borderWidth: 0.1,
            }),
            undefined
        )
    })

    it('does NOT change borderWidth if it already has a value', () => {
        const borderConfig: ColorPickerWidgetConfig = {
            type: 'color',
            props: {
                fieldKey: 'borderColor',
            },
        }

        const nodeWithBorder = {
            id: 'node2',
            borderColor: '#000000',
            borderWidth: 2,
        } as unknown as UnifiedNode

        render(
            <ColorPickerWidget
                config={borderConfig}
                node={nodeWithBorder}
                onChange={mockOnChange}
                resolveText={mockResolveText}
                commonProps={{} as any}
            />
        )

        const input = screen.getByTestId('color-input')
        fireEvent.change(input, { target: { value: '#00ff00' } })

        expect(mockOnChange).toHaveBeenCalledWith(
            expect.objectContaining({
                borderColor: '#00ff00',
            }),
            undefined
        )
        expect(mockOnChange).not.toHaveBeenCalledWith(
            expect.objectContaining({
                borderWidth: 0.1
            }),
            undefined
        )
    })
})
