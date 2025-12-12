import React from 'react'

import {
  KonvaCanvasEditor,
  type KonvaCanvasEditorHandle,
} from '../../../components/canvas/KonvaCanvasEditor'
import type { CanvasElement, IBedElement } from '../../../types/canvas'
import type { BedLayoutDocument, FormDocument } from '../types'
import { PaperBackground } from './components/PaperBackground'
import { BedElement } from './elements/BedElement'

interface KonvaEditorProps {
  document: FormDocument | BedLayoutDocument
  name?: string
  zoom: number
  selection: string[]
  onSelect: (ids: string[]) => void
  onChangeElement: (id: string, newAttrs: Partial<CanvasElement>) => void
  onDelete?: (id: string) => void
  onUndo?: () => void
  onRedo?: () => void
}

export interface BedLayoutEditorHandle {
  downloadImage: () => void
}

export const BedLayoutEditor = React.forwardRef<BedLayoutEditorHandle, KonvaEditorProps>(
  (
    {
      document,
      name,
      zoom,
      selection,
      onSelect,
      onChangeElement,
      onDelete,
      onUndo: _onUndo,
      onRedo: _onRedo,
    },
    ref
  ) => {
    // Konva Stage reference for image export
    const editorRef = React.useRef<KonvaCanvasEditorHandle | null>(null)

    React.useImperativeHandle(ref, () => ({
      downloadImage: () => {
        const stage = editorRef.current?.getStage()
        if (stage) {
          const dataURL = stage.toDataURL({ pixelRatio: 2 })
          const link = window.document.createElement('a')
          link.download = `${name || (document.type === 'form' ? document.name : 'bed-layout')}.png`
          link.href = dataURL
          window.document.body.appendChild(link)
          link.click()
          window.document.body.removeChild(link)
        }
      },
    }))
    // Center the paper
    let paperWidth = 0
    let paperHeight = 0

    if (document.type === 'form') {
      paperWidth = document.paper.width
      paperHeight = document.paper.height
    } else {
      paperWidth = document.layout.width
      paperHeight = document.layout.height
    }

    // Filter out undefined elements and ensure type safety
    // This is critical for preventing runtime errors when rendering elements
    const elements = document.elementOrder
      .map((id) => document.elementsById[id])
      .filter((el): el is IBedElement => el !== undefined)

    return (
      <KonvaCanvasEditor
        ref={editorRef}
        elements={elements}
        selectedIds={selection}
        onSelect={onSelect}
        onChange={onChangeElement}
        zoom={zoom}
        paperWidth={paperWidth}
        paperHeight={paperHeight}
        onDelete={() => {
          if (selection.length > 0 && onDelete) {
            const id = selection[0]
            if (id) onDelete(id)
          }
        }}
        onUndo={_onUndo}
        onRedo={_onRedo}
        background={<PaperBackground document={document} />}
        renderCustom={(el, commonProps, handleShapeRef) => {
          if (el.type === 'Bed') {
            const { ref: _ignoredRef, ...propsWithoutRef } = commonProps
            return (
              <BedElement
                {...propsWithoutRef}
                element={el as IBedElement} // Cast is safe here because we checked el.type === 'Bed'
                isSelected={selection.includes(el.id)}
                shapeRef={handleShapeRef}
              />
            )
          }
          return null
        }}
      />
    )
  }
)

BedLayoutEditor.displayName = 'BedLayoutEditor'
