import React from 'react'
import { render } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { TextRenderer } from '@/components/canvas/renderers/TextRenderer'
import { ptToMm } from '@/utils/units'

// --- Mock Setup ---
const recorded = {
  Group: [] as any[],
  Rect: [] as any[],
  Line: [] as any[],
  Path: [] as any[],
  Text: [] as any[],
  Circle: [] as any[],
  VerticalKonvaText: [] as any[],
  VerticalCaret: [] as any[],
}

const resetRecorded = () => {
  Object.keys(recorded).forEach((key) => {
    recorded[key as keyof typeof recorded].length = 0
  })
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

vi.mock('@/features/vertical-text', () => ({
  VerticalKonvaText: (props: any) => {
    record('VerticalKonvaText', props)
    return <div data-testid="VerticalKonvaText" />
  },
  VerticalCaret: (props: any) => {
    record('VerticalCaret', props)
    return <div data-testid="VerticalCaret" />
  },
}))

vi.mock('@/features/konva-editor/utils/textUtils', () => ({
  measureText: vi.fn(),
}))
vi.mock('@/features/konva-editor/utils/textList', () => ({
  parseListLine: (line: string) => {
    if (line.startsWith('- ')) {
      return { isList: true, type: 'bullet', markerText: '•', indentLength: 0, gapLength: 1, content: line.substring(2) }
    }
    if (line.startsWith('1. ')) {
      return { isList: true, type: 'number', markerText: '1.', indentLength: 0, gapLength: 1, content: line.substring(3) }
    }
    return { isList: false }
  }
}))

import { measureText } from '@/features/konva-editor/utils/textUtils'

describe('components/canvas/renderers/TextRenderer', () => {
  const baseCommonProps = { id: 't1', ref: () => { } } as any
  const baseElement = {
    id: 't1',
    t: 'text',
    x: 0,
    y: 0,
    w: 100,
    h: 40,
    text: 'hello',
  } as any

  beforeEach(() => {
    resetRecorded()
    vi.mocked(measureText).mockReturnValue({ width: 10, height: 10 } as any)
  })

  // --- 1. Basic Rendering & Box Logic ---
  describe('Box Rendering', () => {
    it('renders plain text without box if no frame/border/bg', () => {
      render(<TextRenderer element={baseElement} commonProps={baseCommonProps} invScale={1} />)
      // Expect simple Text node, no Rect (except maybe inside group if logic changes, but current logic says listLayer uses group or simple text)
      // Actually implementation says: if (!shouldShowBox) it renders one Group with Text.
      // Wait, current impl ALWAYS renders Group wrapper.
      // Inside, if shouldShowBox is false, it just renders generic text.
      expect(recorded.Group.length).toBeGreaterThan(0)
      const textNodes = recorded.Text
      // Should be 1 visible text node
      expect(textNodes.length).toBe(1)
      expect(textNodes[0].text).toBe('hello')

      // Should NOT render background rect
      expect(recorded.Rect.length).toBe(0)
    })

    it('renders background rect if backgroundColor is present', () => {
      render(<TextRenderer element={{ ...baseElement, backgroundColor: '#f00' }} commonProps={baseCommonProps} invScale={1} />)
      expect(recorded.Rect.length).toBe(1)
      expect(recorded.Rect[0].fill).toBe('#f00')
    })

    it('renders border rect if borderWidth > 0', () => {
      render(<TextRenderer element={{ ...baseElement, borderWidth: 1, borderColor: '#00f' }} commonProps={baseCommonProps} invScale={1} />)
      expect(recorded.Rect.length).toBe(1)
      expect(recorded.Rect[0].stroke).toBe('#00f')
    })
  })

  // --- 2. List Rendering ---
  describe('List Rendering', () => {
    it('renders list lines separately when text contains list markers', () => {
      const listElement = { ...baseElement, text: '- item 1\n- item 2', hasFrame: true } // force box to trigger list logic easier
      // actually logic triggers renderListLines if !element.vertical inside "if (shouldShowBox)" block.
      // SO we need to force shouldShowBox = true for lists? 
      // Looking at code: "const shouldShowBox = ..." 
      // "if (shouldShowBox) { ... const listLayer = ... }"
      // "else { ... return <Group><Text ... /></Group> }"
      // So lists ONLY appear if shouldShowBox is true? 
      // Let's check logic: NO, TextRenderer has an early return for simple text, BUT if it is a list, does it handle it in the "else"?
      // Reading code: 
      //   if (shouldShowBox) { ... renderListLines ... } 

      // Wait, if hasFrame is false, and no background, standard "Text" component is used. Does that support lists? 
      // No, the standard `Text` component just renders string. 
      // So lists might only work nicely when inside a box? 
      // Let's force hasFrame=true to test list logic.

      render(<TextRenderer element={listElement} commonProps={baseCommonProps} invScale={1} />)

      // We expect renderListLines to be called.
      // It splits lines. 2 lines.
      // logic: parseListLine returns true.
      // It renders Group for lines.
      // Inside loop:
      // Group -> Text(indent) + Text(marker) + Text(gap) + Text(content)

      const textNodes = recorded.Text
      // 2 lines * 4 parts = 8 text nodes? 
      expect(textNodes.length).toBeGreaterThan(1)
      // Verify marker rendering
      const markers = textNodes.filter(t => t.text === '•')
      expect(markers.length).toBe(2)
    })
  })

  // --- 3. Vertical Text ---
  describe('Vertical Text', () => {
    it('renders VerticalKonvaText when vertical is true', () => {
      const vertElement = { ...baseElement, vertical: true, hasFrame: true }
      render(<TextRenderer element={vertElement} commonProps={baseCommonProps} invScale={1} />)

      expect(recorded.VerticalKonvaText.length).toBe(1)
      // Should not render standard Horizontal Text if in box
      // In vertical mode "if (shouldShowBox)" -> renders VerticalKonvaText
      // What if !shouldShowBox? 
      //   if (element.vertical) { ... return <VerticalKonvaText ... /> }
      // Logic exists at bottom for vertical too.

      // Wait, let's verify both paths (in-box and out-of-box)
      // The code has "if (shouldShowBox)" block. Inside it handles vertical.
      // AND "if (element.vertical)" block at bottom (generic return).
      // If shouldShowBox is true, it returns EARLY.
    })

    it('renders vertical text without box logic (hit fallback)', () => {
      // hasFrame=false, no border/bg. vertical=true.
      // This should hit the END of the function.
      const vertElement = { ...baseElement, vertical: true, hasFrame: false, backgroundColor: undefined, borderColor: undefined }
      render(<TextRenderer element={vertElement} commonProps={baseCommonProps} invScale={1} />)
      expect(recorded.VerticalKonvaText.length).toBeGreaterThan(0)
    })

    it('renders VerticalCaret when editing vertical text', () => {
      const vertElement = { ...baseElement, vertical: true, hasFrame: true }
      render(<TextRenderer element={vertElement} commonProps={baseCommonProps} invScale={1} isEditing={true} />)

      expect(recorded.VerticalCaret.length).toBe(1)
      expect(recorded.VerticalCaret[0].visible).toBe(true)
    })
  })

  // --- 4. Interactions & Toggles ---
  describe('Collapse Toggle', () => {
    it('renders collapse button if hasChildren is true', () => {
      const treeElement = { ...baseElement, hasFrame: true, data: { hasChildren: true, isCollapsed: false } }
      const toggleFn = vi.fn()
      render(<TextRenderer element={treeElement} commonProps={baseCommonProps} invScale={1} onToggleCollapse={toggleFn} />)

      // Look for circle/path for button
      expect(recorded.Circle.length).toBe(1)
      expect(recorded.Path.length).toBe(1)
    })

    it('does not render button if no children', () => {
      const simpleElement = { ...baseElement, hasFrame: true, data: { hasChildren: false } }
      render(<TextRenderer element={simpleElement} commonProps={baseCommonProps} invScale={1} />)
      expect(recorded.Circle.length).toBe(0)
    })
  })

  // --- 5. Drag & Drop Indicators (from existing tests, kept for regression) ---
  describe('Drag Drop', () => {
    it('renders drop line', () => {
      const props = { ...baseElement, hasFrame: true }
      render(<TextRenderer element={props} commonProps={baseCommonProps} invScale={1}
        dragState={{ isDragging: true, dropTargetId: 't1', canDrop: true, dropPosition: 'before' } as any} />)
      expect(recorded.Line.length).toBe(1)
    })

    it('renders invalid drop overlay', () => {
      const props = { ...baseElement, hasFrame: true }
      render(<TextRenderer element={props} commonProps={baseCommonProps} invScale={1}
        dragState={{ isDragging: true, dropTargetId: 't1', canDrop: false } as any} />)
      // Path used for X icon
      expect(recorded.Path.length).toBe(1)
    })
  })
})
