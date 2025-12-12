/**
 * WYSIWYG Types (copied from /wysiwyg-pdf/types/wysiwyg.ts)
 * バックエンド型定義と統一
 */

import type {
  ArrowType,
  BindingType,
  ConnectionPoint,
  CanvasElement as Element,
  ElementType,
  IBinding,
  IBox,
  IConnection,
  IElementBase,
  IImageElement,
  ILineElement,
  IPosition,
  IShapeElement,
  ISize,
  ITableElement,
  ITextElement,
  Unit,
} from '../../../../../types/canvas'

export type {
  Unit,
  ElementType,
  BindingType,
  ArrowType,
  ConnectionPoint,
  IConnection,
  IBinding,
  IPosition,
  ISize,
  IBox,
  IElementBase,
  ITextElement,
  IShapeElement,
  ILineElement,
  IImageElement,
  ITableElement,
  Element,
}

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

export interface ITemplateMeta {
  id?: string
  name: string
  title?: string
  version: number
  description?: string
  createdAt?: string
  updatedAt?: string
  ownerId?: string
}

export interface IPage {
  id: string
  size: PageSize
  margin: {
    top: number
    right: number
    bottom: number
    left: number
    unit: Unit
  }
  background?: {
    color?: string
    imageId?: string
  }
}

export interface ITemplateDoc {
  meta: ITemplateMeta
  pages: IPage[]
  elements: Element[]
}

// Component Props interfaces (必要になったものだけ後で個別に import して使用)
export interface ICanvasEditorProps {
  templateDoc: ITemplateDoc
  selectedElement?: Element
  selectedElementId?: string
  onElementSelect: (element: Element | null) => void
  onElementUpdate: (element: Element) => void
  onTemplateUpdate: (template: ITemplateDoc) => void
  onTemplateChange: (template: ITemplateDoc) => void
  zoom: number

  isPresentationMode?: boolean
  currentPageId?: string // 現在表示するページID
}
