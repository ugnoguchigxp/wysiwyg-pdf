import React from 'react'
import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const imageProps: any[] = []

vi.mock('react-konva', () => ({
  Image: (props: any) => {
    imageProps.push(props)
    return <div data-testid="Image" />
  },
}))

vi.mock('use-image', () => ({
  default: (src: string) => [{ src }],
}))

import { ImageElement } from '@/features/konva-editor/renderers/bed-elements/ImageElement'

describe('ImageElement', () => {
  beforeEach(() => {
    imageProps.length = 0
  })

  it('renders image with selection styling', () => {
    const element = {
      id: 'image-1',
      t: 'image',
      x: 1,
      y: 2,
      w: 100,
      h: 80,
      r: 0,
      opacity: 0.8,
      src: 'data:image/png;base64,abc',
      locked: false,
    } as any

    render(
      <ImageElement
        element={element}
        isSelected={true}
        onSelect={() => {}}
        onChange={() => {}}
      />
    )

    expect(imageProps[0].image).toEqual({ src: element.src })
    expect(imageProps[0].stroke).toBe('#3b82f6')
    expect(imageProps[0].strokeWidth).toBe(2)
  })

  it('updates position on drag end', () => {
    const onChange = vi.fn()
    const element = {
      id: 'image-2',
      t: 'image',
      x: 0,
      y: 0,
      w: 40,
      h: 50,
      r: 0,
      opacity: 1,
      src: 'data:image/png;base64,def',
      locked: false,
    } as any

    render(
      <ImageElement
        element={element}
        isSelected={false}
        onSelect={() => {}}
        onChange={onChange}
      />
    )

    imageProps[0].onDragEnd({
      target: {
        x: () => 9,
        y: () => 11,
      },
    } as any)

    expect(onChange).toHaveBeenCalledWith({ x: 9, y: 11 })
  })
})
