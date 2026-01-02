import type { UnifiedNode } from '@/types/canvas'

export interface SlideTemplate {
  id: string
  name: string
  thumbnail?: string // Optional base64 or url
  master: {
    bg: string
    textColor?: string // Default text color for placeholders
    nodes: UnifiedNode[]
  }
}

export const SLIDE_TEMPLATES: SlideTemplate[] = [
  {
    id: 'default',
    name: 'Default (White)',
    master: {
      bg: '#ffffff',
      textColor: '#333333',
      nodes: [],
    },
  },
  {
    id: 'corporate-dark',
    name: 'Corporate Dark',
    master: {
      bg: '#1e293b', // slate-800
      textColor: '#f8fafc', // slate-50 ~ white
      nodes: [
        // Top Accent Line
        {
          id: 'master-shape-1',
          t: 'shape',
          shape: 'rect',
          s: 'master', // special scope
          x: 0,
          y: 0,
          w: 297, // width of A4 landscape (approx) - should be dynamic but hardcoded for sample
          h: 5,
          fill: '#3b82f6', // blue-500
          strokeW: 0,
          r: 0,
          locked: true, // Master objects are locked by default
        },
        // Footer Line
        {
          id: 'master-shape-2',
          t: 'shape',
          shape: 'rect',
          s: 'master',
          x: 0,
          y: 205,
          w: 297,
          h: 5,
          fill: '#334155', // slate-700
          strokeW: 0,
          r: 0,
          locked: true,
        },
        // Slide Number Placeholder
        {
          id: 'master-text-page-num',
          t: 'text',
          s: 'master',
          x: 270,
          y: 200,
          w: 20,
          h: 10,
          text: '#',
          dynamicContent: 'slide-number',
          fontSize: 4, // mm ~ 12pt
          font: 'Arial',
          fill: '#94a3b8', // slate-400
          align: 'r',
          vAlign: 'm',
          locked: true,
        },
        // Copyright
        {
          id: 'master-text-copyright',
          t: 'text',
          s: 'master',
          x: 10,
          y: 200,
          w: 100,
          h: 10,
          text: '© 2024 Your Company',
          fontSize: 3.5, // mm ~ 10pt
          font: 'Arial',
          fill: '#64748b', // slate-500
          align: 'l',
          vAlign: 'm',
          locked: true,
        },
      ],
    },
  },
]
