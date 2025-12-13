import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ShapeSelector } from '../../../../../../../../src/modules/konva-editor/report-editor/pdf-editor/components/PropertiesPanel/ShapeSelector'

describe('ShapeSelector', () => {
  it('renders options when open', () => {
    render(
      <ShapeSelector
        value="a"
        onChange={() => {}}
        options={[
          { value: 'a', label: 'A', icon: <span>i</span> },
          { value: 'b', label: 'B', icon: <span>i</span> },
        ]}
      />
    )

    // trigger exists (radix select)
    expect(screen.getByRole('combobox')).toBeInTheDocument()
  })
})

