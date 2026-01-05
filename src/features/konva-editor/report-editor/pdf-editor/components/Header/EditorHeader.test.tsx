import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { EditorHeader } from '@/features/report-editor/components/Header/EditorHeader'

describe('EditorHeader', () => {
  it('renders and wires actions', () => {
    const onTemplateNameChange = vi.fn()
    const onOrientationChange = vi.fn()
    const onUndo = vi.fn()
    const onRedo = vi.fn()
    const onDownloadImage = vi.fn()
    const onDownloadPdf = vi.fn()
    const onSave = vi.fn()
    const onBack = vi.fn()
    const onShowShortcuts = vi.fn()

    render(
      <EditorHeader
        templateName="T"
        onTemplateNameChange={onTemplateNameChange}
        orientation="portrait"
        onOrientationChange={onOrientationChange}
        canUndo
        canRedo={false}
        onUndo={onUndo}
        onRedo={onRedo}
        onDownloadImage={onDownloadImage}
        onDownloadPdf={onDownloadPdf}
        onSave={onSave}
        onBack={onBack}
        onShowShortcuts={onShowShortcuts}
        i18nOverrides={{ back: 'BACK' }}
      >
        <div>Child</div>
      </EditorHeader>
    )

    fireEvent.click(screen.getByText('BACK'))
    expect(onBack).toHaveBeenCalledTimes(1)

    const input = screen.getByRole('textbox') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'X' } })
    expect(onTemplateNameChange).toHaveBeenCalledWith('X')

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'landscape' } })
    expect(onOrientationChange).toHaveBeenCalledWith('landscape')

    // undo/redo buttons are regular buttons without names; use title
    fireEvent.click(screen.getByTitle('toolbar_undo'))
    expect(onUndo).toHaveBeenCalledTimes(1)

    // redo is disabled (canRedo=false)
    expect(screen.getByTitle('toolbar_redo')).toBeDisabled()

    fireEvent.click(screen.getByText('header_image'))
    expect(onDownloadImage).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('header_pdf'))
    expect(onDownloadPdf).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('save'))
    expect(onSave).toHaveBeenCalledTimes(1)

    fireEvent.click(screen.getByText('?'))
    expect(onShowShortcuts).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Child')).toBeInTheDocument()
  })
})
