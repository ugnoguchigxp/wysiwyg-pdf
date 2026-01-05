import type React from 'react'
import type { ShapeNode, TextNode, UnifiedNode } from '@/types/canvas'
import { generateUUID } from '@/utils/browser'
import { ptToMm } from '@/utils/units'

export type LayoutType =
  | 'blank'
  | 'title'
  | 'title-only'
  | 'title-content'
  | 'two-column'
  | 'three-column'
  | 'four-images'
  | 'big-number'

export interface LayoutDefinition {
  id: LayoutType
  label: string
  description: string
  icon: React.ReactNode
  generateNodes: (slideId: string, width: number, height: number) => UnifiedNode[]
}

const SECTION_MARGIN = 20 // mm
const TITLE_Y = 15
const TITLE_H = 20
const CONTENT_Y = TITLE_Y + TITLE_H + 10

// Helper to create basic text
// fontSize is in POINTS (pt) and will be converted to MM
const createText = (
  s: string,
  text: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fontSizePt: number,
  align: 'l' | 'c' | 'r' = 'l',
  fontWeight = 400
): TextNode => ({
  id: `text-${generateUUID()}`,
  t: 'text',
  s,
  x,
  y,
  w,
  h,
  text,
  fontSize: ptToMm(fontSizePt),
  font: 'Meiryo',
  align,
  vAlign: 't',
  fill: '#333333',
  fontWeight,
  isPlaceholder: true, // Mark as placeholder
})

// Helper to create placeholder shape (for images)
const createPlaceholder = (s: string, x: number, y: number, w: number, h: number): ShapeNode => ({
  id: `shape-${generateUUID()}`,
  t: 'shape',
  s,
  x,
  y,
  w,
  h,
  shape: 'rect',
  fill: '#f0f0f0',
  stroke: '#cccccc',
  strokeW: 1,
  isPlaceholder: true, // Mark as placeholder
})

// Icons
const IconWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="w-24 h-16 border border-border bg-white relative rounded-sm shadow-sm group-hover:border-primary transition-all overflow-hidden border-muted-foreground/20">
    {children}
  </div>
)
const Rect = ({
  x,
  y,
  w,
  h,
  fill = '#cbd5e1',
}: {
  x: string
  y: string
  w: string
  h: string
  fill?: string
}) => (
  <div
    className="absolute"
    style={{ left: x, top: y, width: w, height: h, backgroundColor: fill }}
  />
)

export const SLIDE_LAYOUTS: LayoutDefinition[] = [
  {
    id: 'title',
    label: 'Title Slide',
    description: 'Large title and subtitle',
    icon: (
      <IconWrapper>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-2 items-center w-3/4">
          <div className="h-2 w-full bg-primary/60 rounded-[1px]" />
          <div className="h-1.5 w-2/3 bg-muted-foreground/40 rounded-[1px]" />
        </div>
      </IconWrapper>
    ),
    generateNodes: (s, w, h) => {
      const titleY = h / 2 - 25
      const subY = h / 2 + 15
      return [
        createText(
          s,
          'Click to add Title',
          SECTION_MARGIN,
          titleY,
          w - SECTION_MARGIN * 2,
          35,
          44,
          'c',
          700
        ),
        createText(
          s,
          'Click to add Subtitle',
          SECTION_MARGIN,
          subY,
          w - SECTION_MARGIN * 2,
          20,
          24,
          'c',
          400
        ),
      ]
    },
  },
  {
    id: 'title-only',
    label: 'Title Only',
    description: 'Only a title at the top',
    icon: (
      <IconWrapper>
        <div className="absolute top-2 left-[10%] w-[80%] h-2 bg-primary/60 rounded-[1px]" />
      </IconWrapper>
    ),
    generateNodes: (s, w) => [
      createText(
        s,
        'Click to add Title',
        SECTION_MARGIN,
        TITLE_Y,
        w - SECTION_MARGIN * 2,
        TITLE_H,
        36,
        'c',
        700
      ),
    ],
  },
  {
    id: 'title-content',
    label: 'Title & Content',
    description: 'Standard layout',
    icon: (
      <IconWrapper>
        <Rect x="10%" y="10%" w="80%" h="15%" fill="hsl(var(--primary) / 0.6)" />
        <div className="absolute top-[35%] left-[10%] w-[80%] flex flex-col gap-1.5">
          <div className="h-1 w-full bg-muted-foreground/40" />
          <div className="h-1 w-3/4 bg-muted-foreground/40" />
          <div className="h-1 w-full bg-muted-foreground/40" />
        </div>
      </IconWrapper>
    ),
    generateNodes: (s, w, h) => [
      createText(
        s,
        'Click to add Title',
        SECTION_MARGIN,
        TITLE_Y,
        w - SECTION_MARGIN * 2,
        TITLE_H,
        32,
        'l',
        700
      ),
      createText(
        s,
        '• Click to add text\n• Second point',
        SECTION_MARGIN,
        CONTENT_Y,
        w - SECTION_MARGIN * 2,
        h - CONTENT_Y - SECTION_MARGIN,
        18,
        'l'
      ),
    ],
  },
  {
    id: 'two-column',
    label: 'Two Content',
    description: 'Two columns of content',
    icon: (
      <IconWrapper>
        <div className="absolute top-[10%] left-[10%] w-[80%] h-[15%] bg-primary/60" />
        <div className="absolute top-[35%] left-[10%] w-[35%] h-[50%] bg-muted-foreground/20 border border-muted-foreground/30" />
        <div className="absolute top-[35%] right-[10%] w-[35%] h-[50%] bg-muted-foreground/20 border border-muted-foreground/30" />
      </IconWrapper>
    ),
    generateNodes: (s, w, h) => {
      const colW = (w - SECTION_MARGIN * 2 - 10) / 2
      return [
        createText(
          s,
          'Click to add Title',
          SECTION_MARGIN,
          TITLE_Y,
          w - SECTION_MARGIN * 2,
          TITLE_H,
          32,
          'l',
          700
        ),
        createText(
          s,
          '• Bullet point 1',
          SECTION_MARGIN,
          CONTENT_Y,
          colW,
          h - CONTENT_Y - SECTION_MARGIN,
          18,
          'l'
        ),
        createPlaceholder(
          s,
          SECTION_MARGIN + colW + 10,
          CONTENT_Y,
          colW,
          h - CONTENT_Y - SECTION_MARGIN
        ),
      ]
    },
  },
  {
    id: 'three-column',
    label: 'Three Columns',
    description: 'Three columns of text/content',
    icon: (
      <IconWrapper>
        <div className="absolute top-[10%] left-[10%] w-[80%] h-[15%] bg-primary/60" />
        <div className="absolute top-[35%] left-[5%] w-[26%] h-[50%] bg-muted-foreground/20 border border-muted-foreground/30" />
        <div className="absolute top-[35%] left-[37%] w-[26%] h-[50%] bg-muted-foreground/20 border border-muted-foreground/30" />
        <div className="absolute top-[35%] right-[5%] w-[26%] h-[50%] bg-muted-foreground/20 border border-muted-foreground/30" />
      </IconWrapper>
    ),
    generateNodes: (s, w, h) => {
      const gap = 10
      const colW = (w - SECTION_MARGIN * 2 - gap * 2) / 3
      return [
        createText(
          s,
          'Click to add Title',
          SECTION_MARGIN,
          TITLE_Y,
          w - SECTION_MARGIN * 2,
          TITLE_H,
          32,
          'c',
          700
        ),
        createText(s, 'Column 1', SECTION_MARGIN, CONTENT_Y, colW, h, 18, 'l'),
        createText(s, 'Column 2', SECTION_MARGIN + colW + gap, CONTENT_Y, colW, h, 18, 'l'),
        createText(s, 'Column 3', SECTION_MARGIN + (colW + gap) * 2, CONTENT_Y, colW, h, 18, 'l'),
      ]
    },
  },
  {
    id: 'four-images',
    label: 'Four Images',
    description: 'Title with 4 images',
    icon: (
      <IconWrapper>
        <div className="absolute top-[10%] left-[10%] w-[80%] h-[15%] bg-primary/60" />
        <div className="absolute top-[35%] left-[10%] w-[35%] h-[25%] bg-muted-foreground/20 border border-muted-foreground/30" />
        <div className="absolute top-[35%] right-[10%] w-[35%] h-[25%] bg-muted-foreground/20 border border-muted-foreground/30" />
        <div className="absolute bottom-[10%] left-[10%] w-[35%] h-[25%] bg-muted-foreground/20 border border-muted-foreground/30" />
        <div className="absolute bottom-[10%] right-[10%] w-[35%] h-[25%] bg-muted-foreground/20 border border-muted-foreground/30" />
      </IconWrapper>
    ),
    generateNodes: (s, w, h) => {
      const gap = 10
      const gridW = (w - SECTION_MARGIN * 2 - gap) / 2
      const gridH = (h - CONTENT_Y - SECTION_MARGIN - gap) / 2

      return [
        createText(
          s,
          'Click to add Title',
          SECTION_MARGIN,
          TITLE_Y,
          w - SECTION_MARGIN * 2,
          TITLE_H,
          32,
          'l',
          700
        ),
        // TL
        createPlaceholder(s, SECTION_MARGIN, CONTENT_Y, gridW, gridH),
        // TR
        createPlaceholder(s, SECTION_MARGIN + gridW + gap, CONTENT_Y, gridW, gridH),
        // BL
        createPlaceholder(s, SECTION_MARGIN, CONTENT_Y + gridH + gap, gridW, gridH),
        // BR
        createPlaceholder(s, SECTION_MARGIN + gridW + gap, CONTENT_Y + gridH + gap, gridW, gridH),
      ]
    },
  },
  {
    id: 'big-number',
    label: 'Big Number',
    description: 'Centered big statistic',
    icon: (
      <IconWrapper>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-bold text-primary/80">
          #
        </div>
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-muted-foreground/40" />
      </IconWrapper>
    ),
    generateNodes: (s, w, h) => [
      createText(s, '42%', w / 2 - 50, h / 2 - 40, 100, 60, 80, 'c', 700),
      createText(s, 'Total Growth', w / 2 - 50, h / 2 + 30, 100, 20, 24, 'c', 400),
    ],
  },
  {
    id: 'blank',
    label: 'Blank',
    description: 'Empty slide',
    icon: (
      <IconWrapper>
        <div />
      </IconWrapper>
    ),
    generateNodes: () => [],
  },
]
