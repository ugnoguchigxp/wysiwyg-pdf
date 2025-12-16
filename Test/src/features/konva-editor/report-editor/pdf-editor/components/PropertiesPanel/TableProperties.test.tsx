import { fireEvent, render, screen } from '@testing-library/react'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TableProperties } from '@/features/report-editor/components/PropertyPanel/TableProperties'

// Mock dependencies
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, _def: string) => key,
    }),
}))

vi.mock('@/components/ui/Tooltip', () => ({
    Tooltip: ({ children }: any) => <div>{children}</div>,
    TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
    TooltipProvider: ({ children }: any) => <div>{children}</div>,
    TooltipTrigger: ({ children, asChild }: any) => asChild ? React.Children.only(children) : <button>{children}</button>,
}))

vi.mock('@/components/ui/EditableSelect', () => ({
    EditableSelect: ({ value, onChange, options, 'data-testid': testId }: any) => (
        <select
            data-testid={testId || 'editable-select'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        >
            {options.map((opt: any) => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </select>
    ),
}))

vi.mock('@/features/report-editor/components/PropertyPanel/BindingSelector', () => ({
    BindingSelector: () => <div data-testid="BindingSelector" />,
}))

describe('TableProperties', () => {
    const mockTable = {
        id: 't1',
        t: 'table',
        table: {
            rows: [20, 20],
            cols: [50, 50],
            cells: [
                { r: 0, c: 0, v: 'A1', font: 'Arial', fontSize: 12 },
                { r: 0, c: 1, v: 'B1' },
            ],
        },
        bind: 'field1',
    } as any

    it('renders global styles when no cell is selected', () => {
        render(
            <TableProperties
                element={mockTable}
                onUpdate={() => { }}
                selectedCell={null}
            />
        )

        expect(screen.getByText(/properties_table_style/)).toBeInTheDocument()
    })

    it('renders cell styles when a cell is selected', () => {
        render(
            <TableProperties
                element={mockTable}
                onUpdate={() => { }}
                selectedCell={{ row: 0, col: 0 }}
            />
        )

        expect(screen.getByText('properties_table_cell_style')).toBeInTheDocument()
        expect(screen.getByText(/properties_table_selected_cell/)).toBeInTheDocument()
    })

    it('updates font properties for selected cell', () => {
        const onUpdate = vi.fn()
        render(
            <TableProperties
                element={mockTable}
                onUpdate={onUpdate}
                selectedCell={{ row: 0, col: 0 }}
            />
        )

        // Change Font
        const selects = screen.getAllByTestId('editable-select')
        // Assumes order: Font, Size, BorderWidth (based on layout)
        // Layout: Font, Size, Color (Input)
        // Font is first.
        fireEvent.change(selects[0], { target: { value: 'Times New Roman' } })

        expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
            table: expect.objectContaining({
                cells: expect.arrayContaining([
                    expect.objectContaining({ r: 0, c: 0, font: 'Times New Roman' })
                ])
            })
        }))
    })

    it('updates alignment global styles (all cells)', () => {
        const onUpdate = vi.fn()
        render(
            <TableProperties
                element={mockTable}
                onUpdate={onUpdate}
                selectedCell={null}
            />
        )

        // Click Center Align
        // Buttons have icons, we can find by tooltips or position
        // Tooltips are mocked but content is rendered?
        // TooltipTrigger renders children. child is button.
        // TooltipContent is rendered? 
        // Wait, Tooltip implementation in mock: <div>{children}</div>
        // So both trigger and content are in DOM?

        // Use aria-label or just button index.
        // Alignment buttons are in a flex container.
        // Left, Center, Right.
        // Vertical: Top, Middle, Bottom.

        // Let's assume buttons are identifiable by icons (which are Lucide components, maybe rendered as svg?)
        // Easier: add data-testid in component? No, I can't edit component easily right now (or I shouldn't if I just want coverage).
        // I can query by tooltip text "center"?
        // Expected translation key "center".

        // In mock: `t` returns key.
        // So "center" text should be present.
        // <TooltipContent><p>{resolveText('center', 'Center')}</p></TooltipContent>
        // So text "center" is in DOM.
        // BUT Tooltip usually hides content until hover.
        // My mock `Tooltip: ({ children }) => <div>{children}</div>` renders EVERYTHING visible.
        // So "center" text is visible.
        // But clicking the text "center" won't trigger the button onClick.
        // The button is the sibling in Tooltip/Trigger.
        // Wait, `Tooltip` wraps `Trigger` + `Content`.
        // My mock: `<div><Trigger/><Content/></div>`.

        // Strategy: Find the button that is a sibling of the content containing "center".
        // Or simpler: getAllByRole('button').
        // Order: Left, Center, Right, Top, Middle, Bottom.

        const buttons = screen.getAllByRole('button')
        // 0: Left, 1: Center, 2: Right
        // 3: Top, 4: Middle, 5: Bottom

        fireEvent.click(buttons[1]) // Center

        expect(onUpdate).toHaveBeenCalled()
        const callArgs = onUpdate.mock.calls[0][0]
        // Check if new cells have align 'c'
        // Logic updates ALL cells not covered.
        // Original cells: R0C0, R0C1.
        // Should update both.
        const newCells = callArgs.table.cells
        const c1 = newCells.find((c: any) => c.r === 0 && c.c === 0)
        expect(c1.align).toBe('c')
    })
})
