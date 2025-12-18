import type { Doc, UnifiedNode } from '@/types/canvas'

export * from '@/types/canvas'

// 操作ログ (Operation)
export type Operation =
  | { kind: 'create-element'; element: UnifiedNode }
  | {
      kind: 'update-element'
      id: string
      prev: Partial<UnifiedNode>
      next: Partial<UnifiedNode>
    }
  | {
      kind: 'delete-element'
      id: string
      prevElement: UnifiedNode
    }
  | { kind: 'reorder-elements'; prevOrder: string[]; nextOrder: string[] }

// エディタ状態 (EditorState)
export interface EditorState {
  // 編集中のドキュメント実体
  document: Doc

  // 履歴管理 (Undo/Redo用)
  history: {
    past: Operation[] // 実行済みの操作スタック
    future: Operation[] // Undoされた操作スタック (Redo用)
  }

  // UI状態 (保存対象外)
  selection: string[] // 選択中の要素ID
  zoom: number // 表示倍率 (1.0 = 100%)
  scroll: { x: number; y: number } // スクロール位置
}

export interface BedLayoutListItem {
  id: string
  unitId: string
  name: string
  schemaVersion: string
  updatedAt: string
  updatedBy: string
  etag?: string
  description?: string
  color?: string
  service_code?: string
}

export type PageSize =
  | 'A4'
  | 'A5'
  | 'B5'
  | 'Letter'
  | {
      width: number
      height: number
      unit: 'mm' | 'pt' | 'px' | 'in'
    }

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
