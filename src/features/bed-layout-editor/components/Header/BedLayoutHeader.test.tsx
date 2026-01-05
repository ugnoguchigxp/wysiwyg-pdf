import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/i18n/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}))

vi.mock('@/features/report-editor/components/Header/EditorHeader', () => ({
  EditorHeader: ({ orientationOptions }: any) => (
    <div data-testid="EditorHeader">
      {orientationOptions.map((opt: any) => (
        <div key={opt.value} data-value={opt.value}>
          {opt.label}
        </div>
      ))}
    </div>
  ),
}))

import { BedLayoutHeader } from '@/features/bed-layout-editor/components/Header/BedLayoutHeader'

describe('features/bed-layout-editor/components/Header/BedLayoutHeader', () => {
  it('renders orientation options', () => {
    render(
      <BedLayoutHeader
        templateName="Test"
        onTemplateNameChange={vi.fn()}
        orientation="portrait"
        onOrientationChange={vi.fn()}
        onDownloadImage={vi.fn()}
        onDownloadPdf={vi.fn()}
        onSave={vi.fn()}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        canUndo={false}
        canRedo={false}
      />
    )

    const header = screen.getByTestId('EditorHeader')
    expect(header).toBeInTheDocument()
    expect(header.children.length).toBe(3)

    expect(screen.getByText('Portrait')).toBeInTheDocument()
    expect(screen.getByText('Landscape')).toBeInTheDocument()
    expect(screen.getByText('Square')).toBeInTheDocument()
  })

  it('uses i18n overrides when provided', () => {
    render(
      <BedLayoutHeader
        templateName="Test"
        onTemplateNameChange={vi.fn()}
        orientation="portrait"
        onOrientationChange={vi.fn()}
        onDownloadImage={vi.fn()}
        onDownloadPdf={vi.fn()}
        onSave={vi.fn()}
        onUndo={vi.fn()}
        onRedo={vi.fn()}
        canUndo={false}
        canRedo={false}
        i18nOverrides={{
          orientations_portrait: '縦',
          orientations_landscape: '横',
          orientations_square: '正方形',
        }}
      />
    )

    expect(screen.getByText('縦')).toBeInTheDocument()
    expect(screen.getByText('横')).toBeInTheDocument()
    expect(screen.getByText('正方形')).toBeInTheDocument()
  })
})
