import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { SettingsDrawer } from '@/features/konva-editor/components/SettingsDrawer'

vi.mock('@/i18n/I18nContext', () => ({
  useI18n: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}))

vi.mock('@/components/ui/EditableSelect', () => ({
  EditableSelect: ({ value, onChange, options }: any) => (
    <select
      data-testid="editable-select"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt: number) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  ),
}))

describe('features/konva-editor/components/SettingsDrawer', () => {
  it('renders settings drawer when isOpen is true', () => {
    render(
      <SettingsDrawer
        isOpen
        onClose={vi.fn()}
        showGrid={true}
        onShowGridChange={vi.fn()}
        gridSize={10}
        onGridSizeChange={vi.fn()}
        snapStrength={5}
        onSnapStrengthChange={vi.fn()}
      />
    )

    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <SettingsDrawer
        isOpen={false}
        onClose={vi.fn()}
        showGrid={true}
        onShowGridChange={vi.fn()}
        gridSize={10}
        onGridSizeChange={vi.fn()}
        snapStrength={5}
        onSnapStrengthChange={vi.fn()}
      />
    )

    expect(container.firstChild).toHaveClass('translate-x-full')
  })

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn()

    render(
      <SettingsDrawer
        isOpen
        onClose={onClose}
        showGrid={true}
        onShowGridChange={vi.fn()}
        gridSize={10}
        onGridSizeChange={vi.fn()}
        snapStrength={5}
        onSnapStrengthChange={vi.fn()}
      />
    )

    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onShowGridChange when checkbox is toggled', () => {
    const onShowGridChange = vi.fn()

    render(
      <SettingsDrawer
        isOpen
        onClose={vi.fn()}
        showGrid={true}
        onShowGridChange={onShowGridChange}
        gridSize={10}
        onGridSizeChange={vi.fn()}
        snapStrength={5}
        onSnapStrengthChange={vi.fn()}
      />
    )

    const checkbox = screen.getAllByRole('checkbox')[0]
    fireEvent.click(checkbox)

    expect(onShowGridChange).toHaveBeenCalledWith(false)
  })

  it('renders grid size selector when showGrid is true', () => {
    render(
      <SettingsDrawer
        isOpen
        onClose={vi.fn()}
        showGrid={true}
        onShowGridChange={vi.fn()}
        gridSize={10}
        onGridSizeChange={vi.fn()}
        snapStrength={5}
        onSnapStrengthChange={vi.fn()}
      />
    )

    expect(screen.getByTestId('editable-select')).toBeInTheDocument()
  })

  it('does not render grid size selector when showGrid is false', () => {
    render(
      <SettingsDrawer
        isOpen
        onClose={vi.fn()}
        showGrid={false}
        onShowGridChange={vi.fn()}
        gridSize={10}
        onGridSizeChange={vi.fn()}
        snapStrength={5}
        onSnapStrengthChange={vi.fn()}
      />
    )

    expect(screen.queryByTestId('editable-select')).not.toBeInTheDocument()
  })

  it('calls onSnapStrengthChange when snap checkbox is toggled on', () => {
    const onSnapStrengthChange = vi.fn()

    render(
      <SettingsDrawer
        isOpen
        onClose={vi.fn()}
        showGrid={true}
        onShowGridChange={vi.fn()}
        gridSize={10}
        onGridSizeChange={vi.fn()}
        snapStrength={0}
        onSnapStrengthChange={onSnapStrengthChange}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    const snapCheckbox = checkboxes[checkboxes.length - 1]
    fireEvent.click(snapCheckbox)

    expect(onSnapStrengthChange).toHaveBeenCalledWith(10)
  })

  it('calls onSnapStrengthChange when snap checkbox is toggled off', () => {
    const onSnapStrengthChange = vi.fn()

    render(
      <SettingsDrawer
        isOpen
        onClose={vi.fn()}
        showGrid={true}
        onShowGridChange={vi.fn()}
        gridSize={10}
        onGridSizeChange={vi.fn()}
        snapStrength={5}
        onSnapStrengthChange={onSnapStrengthChange}
      />
    )

    const checkboxes = screen.getAllByRole('checkbox')
    const snapCheckbox = checkboxes[checkboxes.length - 1]
    fireEvent.click(snapCheckbox)

    expect(onSnapStrengthChange).toHaveBeenCalledWith(0)
  })
})
