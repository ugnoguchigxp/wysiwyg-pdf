import { useCallback } from 'react'
import type { Doc, UnifiedNode, TextNode, ShapeNode, LineNode, ImageNode, TableNode } from '@/types/canvas'
import { ptToMm } from '@/utils/units'
import { calculateInitialTextBoxSize } from '@/features/konva-editor/utils/textLayout'
import { createContextLogger } from '@/utils/logger'
import { generateNodeId } from '@/utils/id'

const log = createContextLogger('useCanvasOperations')

interface UseCanvasOperationsProps {
    templateDoc: Doc
    onTemplateChange: (doc: Doc) => void
    onSelectElement: (elementId: string) => void
    onToolSelect?: (tool: string) => void
    resolveText: (key: string, defaultValue?: string) => string
    dpi?: number
}

export function useCanvasOperations({
    templateDoc,
    onTemplateChange,
    onSelectElement,
    onToolSelect,
    resolveText,
    dpi = 96,
}: UseCanvasOperationsProps) {

    const getTargetSurfaceId = useCallback((currentPageId?: string) => {
        if (currentPageId) return currentPageId
        return templateDoc.surfaces[0]?.id ?? 'page-1'
    }, [templateDoc.surfaces])

    const calculateInitialPosition = useCallback((surfaceId: string) => {
        const surface = templateDoc.surfaces.find((s) => s.id === surfaceId)
        // Default fallback size
        const surfaceW = surface?.w ?? 210
        const surfaceH = surface?.h ?? 297

        const nodesOnSurface = templateDoc.nodes.filter((n) => n.s === surfaceId).length
        const offset = nodesOnSurface * 10 // 10mm offset per new element to avoid staggering

        // Place around top-left area but with offset
        // Let's use a simpler logic: center or fixed start + offset
        // Using fixed start + offset based on count to mimic previous logic roughly but safer
        // Previous logic was: surfaceW * 0.15 + offset. surfaceW is mm.
        const startX = surfaceW * 0.15
        const startY = surfaceH * 0.15

        // Check bounds
        const x = Math.min(startX + offset, surfaceW - 50)
        const y = Math.min(startY + offset, surfaceH - 50)

        return { x, y }
    }, [templateDoc])

    const withNewElement = useCallback((element: UnifiedNode) => {
        const nextDoc: Doc = {
            ...templateDoc,
            nodes: [...templateDoc.nodes, element],
        }
        onTemplateChange(nextDoc)
        onSelectElement(element.id)
        onToolSelect?.('select')
        log.debug('Element added', { id: element.id, type: element.t })
    }, [templateDoc, onTemplateChange, onSelectElement, onToolSelect])

    const addText = useCallback((currentPageId?: string) => {
        const s = getTargetSurfaceId(currentPageId)
        const { x, y } = calculateInitialPosition(s)
        const id = generateNodeId(templateDoc, 'text')
        const textContent = resolveText('toolbar_default_text', 'Text')
        const fontSizePt = 24
        const fontSizeMm = ptToMm(fontSizePt)
        const font = {
            family: 'Meiryo',
            sizeMm: fontSizeMm,
            weight: 400,
        }
        const { w, h } = calculateInitialTextBoxSize(textContent, font, { dpi })

        const text: TextNode = {
            id,
            t: 'text',
            s,
            locked: false,
            r: 0,
            name: 'Text',
            text: textContent,
            font: font.family,
            fontSize: fontSizeMm,
            fontWeight: font.weight,
            fill: '#000000',
            align: 'l',
            vAlign: 't',
            x,
            y,
            w,
            h,
        }
        withNewElement(text)
    }, [getTargetSurfaceId, calculateInitialPosition, resolveText, dpi, withNewElement])

    const addShape = useCallback((shapeType: string, currentPageId?: string) => {
        const s = getTargetSurfaceId(currentPageId)
        const { x, y } = calculateInitialPosition(s)
        const id = generateNodeId(templateDoc, 'shape')

        let width = 30
        let height = 30

        if (shapeType === 'trapezoid') {
            width = 40
            height = 24
        } else if (shapeType === 'cylinder') {
            width = 24
            height = 40
        } else if (['arrow-u', 'arrow-d'].includes(shapeType)) {
            width = 16
            height = 32
        } else if (['arrow-l', 'arrow-r'].includes(shapeType)) {
            width = 32
            height = 16
        }

        const shape: ShapeNode = {
            id,
            t: 'shape',
            shape: shapeType.toLowerCase() as ShapeNode['shape'],
            s,
            locked: false,
            r: 0,
            name: shapeType,
            x,
            y,
            w: width,
            h: height,
            stroke: '#000000',
            strokeW: 0.2,
            fill: '#ffffff',
        }
        withNewElement(shape)
    }, [getTargetSurfaceId, calculateInitialPosition, withNewElement])

    const addLine = useCallback((currentPageId?: string) => {
        const s = getTargetSurfaceId(currentPageId)
        const { x, y } = calculateInitialPosition(s)
        const id = generateNodeId(templateDoc, 'line')

        const line: LineNode = {
            id,
            t: 'line',
            s,
            locked: false,
            name: 'Line',
            pts: [x, y, x + 50, y],
            stroke: '#000000',
            strokeW: 0.2,
            routing: 'orthogonal',
        }
        withNewElement(line)
    }, [getTargetSurfaceId, calculateInitialPosition, withNewElement])

    const addImage = useCallback((currentPageId?: string) => {
        const s = getTargetSurfaceId(currentPageId)
        const { x, y } = calculateInitialPosition(s)
        const id = generateNodeId(templateDoc, 'image')
        const image: ImageNode = {
            id,
            t: 'image',
            s,
            locked: false,
            r: 0,
            name: 'Image',
            x,
            y,
            w: 40,
            h: 30,
            src: '',
        }
        withNewElement(image)
    }, [getTargetSurfaceId, calculateInitialPosition, withNewElement])

    const addTable = useCallback((currentPageId?: string) => {
        const s = getTargetSurfaceId(currentPageId)
        const { x, y } = calculateInitialPosition(s)
        const id = generateNodeId(templateDoc, 'table')
        const table: TableNode = {
            id,
            t: 'table',
            s,
            locked: false,
            r: 0,
            name: 'Table',
            x,
            y,
            w: 90,
            h: 30,
            table: {
                rows: [10, 10, 10],
                cols: [30, 30, 30],
                cells: [
                    { r: 0, c: 0, v: '', borderW: 0.2, borderColor: '#000000' },
                    { r: 0, c: 1, v: '', borderW: 0.2, borderColor: '#000000' },
                    { r: 0, c: 2, v: '', borderW: 0.2, borderColor: '#000000' },
                ],
            },
        }
        // Fill all cells logic if needed, but simple init is fine for now
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (!table.table.cells.find((cell) => cell.r === r && cell.c === c)) {
                    table.table.cells.push({ r, c, v: '', borderW: 0.2, borderColor: '#000000' })
                }
            }
        }
        withNewElement(table)
    }, [getTargetSurfaceId, calculateInitialPosition, withNewElement])

    return {
        addText,
        addShape,
        addLine,
        addImage,
        addTable,
    }
}
