import { PAGE_SIZES } from '@/constants/pageSizes'
import { type LayoutDefinition, SLIDE_LAYOUTS } from '@/features/slide-editor/constants/layouts'
import type { Doc, UnifiedNode } from '@/types/canvas'
import { ptToMm } from '@/utils/units'

// Helper to generate default master nodes (e.g. page number)
export const generateMasterNodes = (surfaceId: string, w: number, h: number): UnifiedNode[] => {
  return [
    {
      id: `master-pagenum-${surfaceId}`,
      t: 'text',
      s: surfaceId,
      x: w - 20, // Bottom right
      y: h - 15,
      w: 15,
      h: 10,
      text: '#',
      dynamicContent: 'slide-number',
      fontSize: ptToMm(12), // 12pt
      align: 'r',
      fill: '#94a3b8',
      locked: true,
    },
  ]
}

// Generate Initial Masters for every layout type
export const INITIAL_MASTERS = SLIDE_LAYOUTS.map((layout: LayoutDefinition) => ({
  surface: {
    id: `master-${layout.id}`,
    type: 'slide',
    w: PAGE_SIZES.A4_LANDSCAPE.w,
    h: PAGE_SIZES.A4_LANDSCAPE.h,
    bg: '#ffffff',
    // masterId undefined -> This IS a master
  } as const,
  nodes: [
    ...generateMasterNodes(
      `master-${layout.id}`,
      PAGE_SIZES.A4_LANDSCAPE.w,
      PAGE_SIZES.A4_LANDSCAPE.h
    ),
    ...layout.generateNodes(
      `master-${layout.id}`,
      PAGE_SIZES.A4_LANDSCAPE.w,
      PAGE_SIZES.A4_LANDSCAPE.h
    ),
  ],
}))

export const INITIAL_DOC: Doc = {
  v: 1,
  id: 'slide-doc-1',
  title: 'New Presentation',
  unit: 'mm',
  surfaces: [
    // 1. All Layout Masters
    ...INITIAL_MASTERS.map((m: any) => m.surface),
    // 2. Initial Slide (Title Layout)
    {
      id: 'slide-1',
      type: 'slide',
      w: PAGE_SIZES.A4_LANDSCAPE.w,
      h: PAGE_SIZES.A4_LANDSCAPE.h,
      bg: undefined, // Transparent bg, uses master's
      masterId: 'master-title', // Linked to Title Master
    },
  ],
  // Initial nodes: Master Nodes + Slide Nodes (Title Layout)
  nodes: [
    ...INITIAL_MASTERS.flatMap((m: any) => m.nodes),
    ...(SLIDE_LAYOUTS.find((l: any) => l.id === 'title')?.generateNodes(
      'slide-1',
      PAGE_SIZES.A4_LANDSCAPE.w,
      PAGE_SIZES.A4_LANDSCAPE.h
    ) || []),
  ],
}
