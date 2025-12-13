/**
 * WYSIWYG Types (Refactored for Unified JSON Schema v2)
 */

import type {
  Doc,
  UnifiedNode,
  Unit
} from '../../../../../types/canvas'

export * from '../../../../../types/canvas'

export type PageSize =
  | 'A4'
  | 'A5'
  | 'B5'
  | 'Letter'
  | {
    width: number
    height: number
    unit: Unit
  }

// Component Props interfaces
export interface ICanvasEditorProps {
  templateDoc: Doc
  selectedElement?: UnifiedNode
  selectedElementId?: string
  onElementSelect: (element: UnifiedNode | null) => void
  onElementUpdate: (element: UnifiedNode) => void
  onTemplateUpdate: (template: Doc) => void
  onTemplateChange: (template: Doc) => void
  zoom: number

  isPresentationMode?: boolean
  currentPageId?: string // 現在表示するページID
}
