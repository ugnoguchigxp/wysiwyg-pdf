import type Konva from 'konva'
import { useCallback } from 'react'
import type { SignatureNode, TableNode, UnifiedNode } from '../../../types/canvas'
import { isWHElement } from '../utils/elementUtils'

type TransformableNode = Konva.Node & {
    x(): number
    y(): number
    width(): number
    height(): number
    scaleX(): number
    scaleY(): number
    rotation(): number
}

import { getUpdateForConnectedLines } from '../utils/lineUtils'

interface UseCanvasTransformProps {
    element: UnifiedNode
    allElements?: UnifiedNode[]
    shapeRef: React.RefObject<Konva.Node | null>
    onChange: (
        newAttrs:
            | (Partial<UnifiedNode> & { id?: string })
            | (Partial<UnifiedNode> & { id?: string })[]
    ) => void
}

export const useCanvasTransform = ({ element, allElements, shapeRef, onChange }: UseCanvasTransformProps) => {
    const handleTransformEnd = useCallback(() => {
        const node = shapeRef.current as TransformableNode | null
        if (!node || !isWHElement(element)) return

        const scaleX = node.scaleX()
        const scaleY = node.scaleY()

        node.scaleX(1)
        node.scaleY(1)

        const newWidth = Math.max(5, node.width() * scaleX)
        const newHeight = Math.max(5, node.height() * scaleY)

        let newX = node.x()
        let newY = node.y()

        if (element.t === 'shape') {
            const type = element.shape
            if (['circle', 'star', 'pentagon', 'hexagon'].includes(type as string)) {
                newX -= newWidth / 2
                newY -= newHeight / 2
            }
        }

        let elementUpdate: Partial<UnifiedNode> & { id?: string }

        if (element.t === 'table') {
            const tableElement = element as TableNode
            const oldWidth = tableElement.w || 1
            const oldHeight = tableElement.h || 1
            const widthRatio = newWidth / oldWidth
            const heightRatio = newHeight / oldHeight

            const newCols = tableElement.table.cols.map((w) => w * widthRatio)
            const newRows = tableElement.table.rows.map((h) => h * heightRatio)

            elementUpdate = {
                id: element.id,
                x: newX,
                y: newY,
                w: newWidth,
                h: newHeight,
                r: node.rotation(),
                table: {
                    ...tableElement.table,
                    cols: newCols,
                    rows: newRows,
                },
            } as unknown as Partial<UnifiedNode>
        } else if (element.t === 'signature') {
            const signatureElement = element as SignatureNode
            const scaleX = newWidth / (signatureElement.w || 1)
            const scaleY = newHeight / (signatureElement.h || 1)

            const scaledStrokes = signatureElement.strokes.map((stroke: number[]) => {
                const scaled: number[] = []
                for (let i = 0; i < stroke.length; i += 2) {
                    const x = stroke[i] * scaleX
                    const y = stroke[i + 1] * scaleY
                    scaled.push(x, y)
                }
                return scaled
            })

            elementUpdate = {
                id: element.id,
                x: newX,
                y: newY,
                w: newWidth,
                h: newHeight,
                r: node.rotation(),
                strokes: scaledStrokes,
            } as unknown as Partial<UnifiedNode>
        } else {
            elementUpdate = {
                id: element.id,
                x: newX,
                y: newY,
                w: newWidth,
                h: newHeight,
                r: node.rotation(),
            }
        }

        const updates: (Partial<UnifiedNode> & { id?: string })[] = [elementUpdate]

        if (allElements) {
            const currentGeo = { ...element, ...elementUpdate } as UnifiedNode
            const lineUpdates = getUpdateForConnectedLines(element.id, currentGeo, allElements)
            updates.push(...lineUpdates)
        }

        onChange(updates)
    }, [element, onChange, shapeRef, allElements])

    return { handleTransformEnd }
}
