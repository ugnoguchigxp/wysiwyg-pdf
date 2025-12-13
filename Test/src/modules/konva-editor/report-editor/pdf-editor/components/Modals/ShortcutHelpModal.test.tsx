import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ShortcutHelpModal } from '../../../../../../../../src/modules/konva-editor/report-editor/pdf-editor/components/Modals/ShortcutHelpModal'

describe('ShortcutHelpModal', () => {
  it('renders shortcuts and closes', () => {
    const onOpenChange = vi.fn()
    render(<ShortcutHelpModal open onOpenChange={onOpenChange} />)

    const closeButtons = screen.getAllByRole('button', { name: 'close' })
    fireEvent.click(closeButtons[closeButtons.length - 1])
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
