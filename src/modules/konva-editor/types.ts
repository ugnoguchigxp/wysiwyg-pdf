import type {
  UnifiedNode,
} from '../../types/canvas'

export * from '../../types/canvas'

// 帳票ドキュメント
export interface FormDocument {
  id: string
  type: 'form'
  name: string

  // 用紙設定 (PDF出力の基準)
  // A3は除外。基本はA4, B5。
  paper: {
    size: 'A4' | 'B5' | 'Custom'
    orientation: 'portrait' | 'landscape'
    width: number // pt単位
    height: number // pt単位
    margins?: { top: number; right: number; bottom: number; left: number } // pt
  }

  // 背景画像 (下絵)
  background?: {
    src: string
    opacity: number
    fit: 'fill' | 'contain' | 'cover' | 'none'
  }

  elementsById: Record<string, UnifiedNode>
  elementOrder: string[]
}

// ベッドレイアウト
export interface BedLayoutDocument {
  id: string
  type: 'bed_layout'
  name?: string

  // レイアウト設定
  layout: {
    // 用紙サイズではなく、形状タイプを選択
    mode: 'portrait' | 'landscape' | 'square'
    // 描画領域の論理サイズ
    width: number
    height: number
  }

  elementsById: Record<string, UnifiedNode>
  elementOrder: string[]
}

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
  document: FormDocument | BedLayoutDocument

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
