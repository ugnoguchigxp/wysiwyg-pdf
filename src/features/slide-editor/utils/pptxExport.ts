import type { Doc, UnifiedNode, TextNode, ShapeNode, ImageNode, LineNode } from '@/types/canvas'

/**
 * Checks if pptxgenjs is available (installed).
 */
export async function isPptxAvailable(): Promise<boolean> {
    try {
        await import('pptxgenjs')
        return true
    } catch (e) {
        return false
    }
}

/**
 * Exports the document to a PowerPoint file.
 * @param doc The document to export
 * @param fileName Output filename
 */
export async function exportToPptx(doc: Doc, fileName = 'presentation.pptx') {
    let PptxGenJS
    try {
        const module = await import('pptxgenjs')
        PptxGenJS = module.default
    } catch (e) {
        console.error('pptxgenjs is not installed.', e)
        throw new Error('PPTX generation library is not available.')
    }

    const pptx = new PptxGenJS()

    // 1. Setup Layout
    // PptxGenJS custom layout
    pptx.defineLayout({ name: 'A4', width: 11.69, height: 8.27 })
    pptx.layout = 'A4'

    // 2. Iterate Slides
    const slides = doc.surfaces.filter(s => s.type === 'slide')

    for (const surface of slides) {
        const slide = pptx.addSlide()

        // Background color
        if (surface.bg) {
            slide.background = { color: sanitizeHex(surface.bg, 'FFFFFF') }
        }

        // Filter nodes for this slide
        const nodes = doc.nodes.filter(n => n.s === surface.id)

        for (const node of nodes) {
            if (node.hidden) continue
            await addNodeToSlide(slide, node)
        }
    }

    // 3. Save
    await pptx.writeFile({ fileName })
}

// mm to inch
const MM_TO_INCH = 1 / 25.4

// Helper to sanitize hex color (strips #, handles null/undefined)
function sanitizeHex(color?: string, defaultColor = '000000'): string {
    if (!color) return defaultColor
    let c = color.trim()
    if (c.startsWith('#')) c = c.substring(1)

    // Check if it's a valid hex string (3 or 6 chars)
    if (/^[0-9A-Fa-f]{3}$/.test(c)) {
        // Expand 3-char hex to 6-char
        return c.split('').map(char => char + char).join('')
    }
    if (/^[0-9A-Fa-f]{6}$/.test(c)) return c

    // Fallback for named colors or rgba/transparent
    // PptxGenJS officially supports Hex, some named colors. 
    // If we can't parse, return default.
    return defaultColor
}

function sanitizeNum(val?: number): number {
    return (typeof val === 'number' && Number.isFinite(val)) ? val : 0
}

async function addNodeToSlide(slide: any, node: UnifiedNode) {
    const x = sanitizeNum(node.x) * MM_TO_INCH
    const y = sanitizeNum(node.y) * MM_TO_INCH
    const w = sanitizeNum(node.w) * MM_TO_INCH
    const h = sanitizeNum(node.h) * MM_TO_INCH

    // Common options
    const options: any = {
        x, y, w, h
    }

    if (node.r) {
        options.rotate = sanitizeNum(node.r)
    }

    if (node.t === 'text') {
        const tCheck = node as TextNode
        const color = sanitizeHex(tCheck.fill, '000000')
        const bg = tCheck.backgroundColor ? sanitizeHex(tCheck.backgroundColor) : undefined

        slide.addText(tCheck.text || '', {
            ...options,
            fontSize: Math.max(1, sanitizeNum(tCheck.fontSize) * 2.83), // Ensure >= 1pt
            fontFace: tCheck.font || 'Arial',
            color,
            bold: !!(tCheck.fontWeight && tCheck.fontWeight >= 700),
            italic: !!tCheck.italic,
            underline: !!tCheck.underline,
            strike: !!tCheck.lineThrough,
            align: tCheck.align === 'j' ? 'justify' : tCheck.align || 'left',
            valign: tCheck.vAlign === 'm' ? 'middle' : tCheck.vAlign === 'b' ? 'bottom' : 'top',
            fill: bg ? { color: bg } : undefined,
            lineSpacing: 18, // PptxGenJS uses points usually. Safe default.
        })
    }
    else if (node.t === 'shape') {
        const sCheck = node as ShapeNode
        const fillColor = sanitizeHex(sCheck.fill, 'FFFFFF')
        const lineColor = sanitizeHex(sCheck.stroke, '000000')
        const lineWidth = Math.max(0, sanitizeNum(sCheck.strokeW) * 2.83)

        let shapeType = 'rect'
        if (sCheck.shape === 'circle') shapeType = 'oval'
        else if (sCheck.shape === 'triangle') shapeType = 'triangle'
        else if (sCheck.shape === 'star') shapeType = 'star5'

        slide.addShape(shapeType, {
            ...options,
            fill: { color: fillColor },
            line: { color: lineColor, width: lineWidth },
        })
    }
    else if (node.t === 'image') {
        const iCheck = node as ImageNode
        if (iCheck.src) {
            slide.addImage({
                ...options,
                path: iCheck.src, // URL or base64
            })
        }
    }
    else if (node.t === 'line') {
        const lCheck = node as LineNode
        if (lCheck.pts && lCheck.pts.length >= 4) {
            const x1 = sanitizeNum(lCheck.pts[0]) * MM_TO_INCH
            const y1 = sanitizeNum(lCheck.pts[1]) * MM_TO_INCH
            const x2 = sanitizeNum(lCheck.pts[2]) * MM_TO_INCH
            const y2 = sanitizeNum(lCheck.pts[3]) * MM_TO_INCH

            const lx = Math.min(x1, x2)
            const ly = Math.min(y1, y2)
            const lw = Math.abs(x2 - x1)
            const lh = Math.abs(y2 - y1)

            // Prevent 0x0 shape if distinct points are not provided (dot)
            // If they are identical points, it might be a dot. 
            // PptxGenJS might handle 0 width/height OK for lines?

            const lineColor = sanitizeHex(lCheck.stroke, '000000')
            const lineWidth = Math.max(1, sanitizeNum(lCheck.strokeW) * 2.83) // Min width 1pt

            // Determine flip
            let flipH = false
            let flipV = false
            if (x1 > x2) flipH = true
            if (y1 > y2) flipV = true

            slide.addShape('line', {
                x: lx,
                y: ly,
                w: lw,
                h: lh,
                line: { color: lineColor, width: lineWidth },
                flipH,
                flipV
            })
        }
    }
    else if (node.t === 'signature') {
        // TODO: Implement signature rasterization
    }
}
