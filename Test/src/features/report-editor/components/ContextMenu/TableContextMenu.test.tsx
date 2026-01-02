import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TableContextMenu } from '@/features/report-editor/components/ContextMenu/TableContextMenu'

// Mock I18n
vi.mock('@/i18n/I18nContext', () => ({
    useI18n: () => ({
        t: (key: string, _default: string) => key,
    }),
}))

describe('features/report-editor/components/ContextMenu/TableContextMenu', () => {
    const defaultProps = {
        visible: true,
        x: 100,
        y: 100,
        onClose: vi.fn(),
        onAction: vi.fn(),
    }

    it('does not render when visible is false', () => {
        render(<TableContextMenu {...defaultProps} visible={false} />)
        const menu = screen.queryByRole('menu')
        expect(menu).toBeNull()
    })

    it('renders all menu items when visible', () => {
        render(<TableContextMenu {...defaultProps} />)

        expect(screen.getByText('table_ctx_merge_right')).toBeTruthy()
        expect(screen.getByText('table_ctx_merge_down')).toBeTruthy()
        expect(screen.getByText('table_ctx_unmerge')).toBeTruthy()
        expect(screen.getByText('table_ctx_insert_row_above')).toBeTruthy()
        expect(screen.getByText('table_ctx_insert_row_below')).toBeTruthy()
        expect(screen.getByText('table_ctx_delete_row')).toBeTruthy()
        expect(screen.getByText('table_ctx_insert_col_left')).toBeTruthy()
        expect(screen.getByText('table_ctx_insert_col_right')).toBeTruthy()
        expect(screen.getByText('table_ctx_delete_col')).toBeTruthy()
    })

    it('calls onAction with correct argument when clicked', () => {
        const onAction = vi.fn()
        render(<TableContextMenu {...defaultProps} onAction={onAction} />)

        fireEvent.click(screen.getByText('table_ctx_merge_right'))
        expect(onAction).toHaveBeenCalledWith('mergeRight')

        fireEvent.click(screen.getByText('table_ctx_delete_row'))
        expect(onAction).toHaveBeenCalledWith('deleteRow')

        fireEvent.click(screen.getByText('table_ctx_insert_col_left'))
        expect(onAction).toHaveBeenCalledWith('insertColLeft')
    })

    it('calls onClose when clicking outside', () => {
        const onClose = vi.fn()
        render(
            <div>
                <div data-testid="outside">Outside</div>
                <TableContextMenu {...defaultProps} onClose={onClose} />
            </div>
        )

        fireEvent.mouseDown(screen.getByTestId('outside'))
        expect(onClose).toHaveBeenCalled()
    })

    it('does not call onClose when clicking inside', () => {
        const onClose = vi.fn()
        render(<TableContextMenu {...defaultProps} onClose={onClose} />)

        fireEvent.mouseDown(screen.getByText('table_ctx_merge_right'))
        expect(onClose).not.toHaveBeenCalled()
    })
})
