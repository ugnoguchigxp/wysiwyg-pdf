import type {
  CanvasElement,
  IBedElement,
  IImageElement,
  ILineElement,
  IShapeElement,
  ITextElement,
  ITableElement,
  IChartElement,
} from '../../types/canvas'

export type {
  CanvasElement,
  IBedElement,
  IImageElement,
  ILineElement,
  IShapeElement,
  ITextElement,
  ITableElement,
  IChartElement,
}

// グループ要素 (共通) - Keep local for now if not in shared, or move to shared later
import type { IGroupElement } from '../../types/canvas'
// Group Element (Use shared definition if possible, but for now align it)
export type GroupElement = IGroupElement

export type BedLayoutElement =
  | IBedElement
  | ILineElement
  | ITextElement
  | IImageElement
  | IShapeElement
  | GroupElement
  | ITableElement
  | IChartElement

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

  elementsById: Record<string, CanvasElement>
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
    // 描画領域の論理サイズ (pt換算または任意の単位)
    // squareなら 1000x1000, portraitなら 1000x1414 等の比率で定義
    width: number
    height: number
  }

  elementsById: Record<string, BedLayoutElement>
  elementOrder: string[]
}

// 操作ログ (Operation)
export type Operation =
  | { kind: 'create-element'; element: BedLayoutElement | CanvasElement }
  | {
      kind: 'update-element'
      id: string
      prev: Partial<BedLayoutElement | CanvasElement> // Simplified for now
      next: Partial<BedLayoutElement | CanvasElement>
    }
  | {
      kind: 'delete-element'
      id: string
      prevElement: BedLayoutElement | CanvasElement
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
