import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TextRenderer } from '@/components/canvas/renderers/TextRenderer'

const recorded = {
  Group: [] as any[],
  Rect: [] as any[],
  Line: [] as any[],
  Path: [] as any[],
  Text: [] as any[],
  Circle: [] as any[],
}

const resetRecorded = () => {
  recorded.Group.length = 0
  recorded.Rect.length = 0
  recorded.Line.length = 0
  recorded.Path.length = 0
  recorded.Text.length = 0
  recorded.Circle.length = 0
}

const record = (key: keyof typeof recorded, props: any) => {
  recorded[key].push(props)
}

vi.mock('react-konva', () => ({
  Group: ({ children, ...props }: any) => {
    record('Group', props)
    return <div data-testid="Group">{children}</div>
  },
  Rect: (props: any) => {
    record('Rect', props)
    return <div data-testid="Rect" />
  },
  Line: (props: any) => {
    record('Line', props)
    return <div data-testid="Line" />
  },
  Path: (props: any) => {
    record('Path', props)
    return <div data-testid="Path" />
  },
  Text: (props: any) => {
    record('Text', props)
    return <div data-testid="Text" />
  },
  Circle: (props: any) => {
    record('Circle', props)
    return <div data-testid="Circle" />
  },
}))

describe('components/canvas/renderers/TextRenderer', () => {
  const baseCommonProps = { id: 't1', ref: () => { } } as any

  it('renders drop indicator line when dropping before', () => {
    resetRecorded()

    render(
      <TextRenderer
        element={{
          id: 't1',
          t: 'text',
          x: 0,
          y: 0,
          w: 100,
          h: 40,
          text: 'hello',
          hasFrame: true,
        } as any}
        commonProps={baseCommonProps}
        dragState={{
          isDragging: true,
          draggedNodeId: 'other',
          dragPosition: null,
          dropTargetId: 't1',
          dropPosition: 'before',
          canDrop: true,
        }}
        invScale={1}
      />
    )

    const lineProps = recorded.Line[0]
    expect(lineProps.points).toEqual([0, -4, 100, -4])
  })

  it('shows invalid drop indicator when cannot drop', () => {
    resetRecorded()

    render(
      <TextRenderer
        element={{
          id: 't2',
          t: 'text',
          x: 0,
          y: 0,
          w: 100,
          h: 40,
          text: 'hello',
          hasFrame: true,
          borderColor: '#333333',
          borderWidth: 2,
        } as any}
        commonProps={baseCommonProps}
        dragState={{
          isDragging: true,
          draggedNodeId: 'other',
          dragPosition: null,
          dropTargetId: 't2',
          dropPosition: 'child',
          canDrop: false,
        }}
        invScale={1}
      />
    )

    const rectProps = recorded.Rect[0]
    expect(rectProps.stroke).toBe('hsl(0, 70%, 50%)')
    expect(recorded.Path.length).toBe(1)
  })

  it('renders collapse toggle and triggers callback', () => {
    resetRecorded()
    const onToggleCollapse = vi.fn()
    const event = { cancelBubble: false, target: { getStage: vi.fn(() => null) } } as any

    render(
      <TextRenderer
        element={{
          id: 't3',
          t: 'text',
          x: 0,
          y: 0,
          w: 120,
          h: 40,
          text: 'node',
          hasFrame: true,
          data: { hasChildren: true, isCollapsed: true },
        } as any}
        commonProps={baseCommonProps}
        invScale={1}
        onToggleCollapse={onToggleCollapse}
      />
    )

    const buttonGroup = recorded.Group.find((props) => props.x === 120 && props.y === 0)
    expect(buttonGroup).toBeTruthy()

    buttonGroup.onMouseDown(event)
    expect(onToggleCollapse).toHaveBeenCalledWith('t3')
    expect(event.cancelBubble).toBe(true)
  })

  it('hides text when editing without frame', () => {
    resetRecorded()

    render(
      <TextRenderer
        element={{
          id: 't4',
          t: 'text',
          x: 0,
          y: 0,
          w: 100,
          h: 40,
          text: 'edit',
        } as any}
        commonProps={baseCommonProps}
        invScale={1}
        isEditing
      />
    )

    const textProps = recorded.Text[0]
    expect(textProps.visible).toBe(false)
  })
})
