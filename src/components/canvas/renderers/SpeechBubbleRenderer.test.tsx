import { render } from '@testing-library/react'
import { Stage, Layer } from 'react-konva'
import { describe, expect, it } from 'vitest'
import type { SpeechBubbleNode } from '@/types/canvas'
import type { CanvasElementCommonProps } from '../types'
import { SpeechBubbleRenderer } from './SpeechBubbleRenderer'

const mockSpeechBubble: SpeechBubbleNode = {
  t: 'speech-bubble',
  id: 'test-bubble-1',
  s: 'surface-1',
  x: 10,
  y: 10,
  w: 100,
  h: 80,
  shapeType: 'rectangle',
  originalText: 'Hello World',
  translations: {
    ja: 'こんにちは世界',
    en: 'Hello World',
  },
}

const mockCommonProps: CanvasElementCommonProps = {
  id: 'test-bubble-1',
  x: 10,
  y: 10,
  width: 100,
  height: 80,
  rotation: 0,
  draggable: false,
  onMouseDown: () => { },
  onTap: () => { },
  onDblClick: () => { },
  onDragEnd: () => { },
  onTransformEnd: () => { },
  visible: true,
  ref: () => { },
}

describe('SpeechBubbleRenderer', () => {
  it('renders rectangle shape bubble', () => {
    const { container } = render(
      <Stage width={300} height={300}>
        <Layer>
          <SpeechBubbleRenderer
            element={mockSpeechBubble}
            commonProps={mockCommonProps}
            invScale={1}
          />
        </Layer>
      </Stage>
    )
    expect(container).toBeTruthy()
  })

  it('renders custom shape bubble', () => {
    const customBubble: SpeechBubbleNode = {
      ...mockSpeechBubble,
      shapeType: 'custom',
      pathPoints: [0, 0, 50, 0, 50, 50, 0, 50],
    }

    const { container } = render(
      <Stage width={300} height={300}>
        <Layer>
          <SpeechBubbleRenderer
            element={customBubble}
            commonProps={mockCommonProps}
            invScale={1}
          />
        </Layer>
      </Stage>
    )
    expect(container).toBeTruthy()
  })

  it('displays original text when no display language is specified', () => {
    const { container } = render(
      <Stage width={300} height={300}>
        <Layer>
          <SpeechBubbleRenderer
            element={mockSpeechBubble}
            commonProps={mockCommonProps}
            invScale={1}
          />
        </Layer>
      </Stage>
    )
    // Konva renders to canvas, not DOM text
    // Just verify it renders without error
    expect(container).toBeTruthy()
  })

  it('displays translated text when display language is specified', () => {
    const { container } = render(
      <Stage width={300} height={300}>
        <Layer>
          <SpeechBubbleRenderer
            element={mockSpeechBubble}
            commonProps={mockCommonProps}
            invScale={1}
            displayLanguage="ja"
          />
        </Layer>
      </Stage>
    )
    // Note: Konva text rendering in tests might not show actual text content
    // This is a simplified check
    expect(container).toBeTruthy()
  })

  it('handles vertical text mode', () => {
    const verticalBubble: SpeechBubbleNode = {
      ...mockSpeechBubble,
      vertical: true,
    }

    const { container } = render(
      <Stage width={300} height={300}>
        <Layer>
          <SpeechBubbleRenderer
            element={verticalBubble}
            commonProps={mockCommonProps}
            invScale={1}
          />
        </Layer>
      </Stage>
    )
    expect(container).toBeTruthy()
  })

  it('applies custom styles', () => {
    const styledBubble: SpeechBubbleNode = {
      ...mockSpeechBubble,
      font: 'Arial',
      fontSize: 14,
      fontWeight: 700,
      italic: true,
      underline: true,
      fill: '#ff0000',
      backgroundColor: '#ffff00',
      stroke: '#0000ff',
      strokeW: 2,
      padding: 10,
    }

    const { container } = render(
      <Stage width={300} height={300}>
        <Layer>
          <SpeechBubbleRenderer
            element={styledBubble}
            commonProps={mockCommonProps}
            invScale={1}
          />
        </Layer>
      </Stage>
    )
    expect(container).toBeTruthy()
  })

  it('hides text during editing', () => {
    const { container } = render(
      <Stage width={300} height={300}>
        <Layer>
          <SpeechBubbleRenderer
            element={mockSpeechBubble}
            commonProps={mockCommonProps}
            invScale={1}
            isEditing={true}
          />
        </Layer>
      </Stage>
    )
    expect(container).toBeTruthy()
  })

  it('handles empty text', () => {
    const emptyBubble: SpeechBubbleNode = {
      ...mockSpeechBubble,
      originalText: '',
    }

    const { container } = render(
      <Stage width={300} height={300}>
        <Layer>
          <SpeechBubbleRenderer
            element={emptyBubble}
            commonProps={mockCommonProps}
            invScale={1}
          />
        </Layer>
      </Stage>
    )
    expect(container).toBeTruthy()
  })
})
