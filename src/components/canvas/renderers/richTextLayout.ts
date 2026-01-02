import type { CellHorizontalAlign, CellVerticalAlign, RichTextFragment } from '@/types/canvas'

export interface RichTextLayoutNode {
    text: string
    x: number
    y: number
    width: number
    height: number
    fs: number
    fam: string
    color: string // Resolved color (never undefined)
    bold?: boolean
    italic?: boolean
    strike?: boolean
    underline?: boolean
}

const MEASURE_CANVAS = typeof document !== 'undefined' ? document.createElement('canvas') : null

export const measureTextWidth = (
    text: string,
    fontSize: number,
    fontFamily: string,
    bold: boolean,
    italic: boolean
) => {
    if (!MEASURE_CANVAS) return 0
    const ctx = MEASURE_CANVAS.getContext('2d')
    if (!ctx) return 0

    const fontStyle = `${italic ? 'italic' : ''} ${bold ? 'bold' : 'normal'}`.trim()
    ctx.font = `${fontStyle} ${fontSize}px ${fontFamily}`

    return ctx.measureText(text).width
}

export const calculateRichTextLayout = (
    fragments: RichTextFragment[],
    width: number,
    height: number,
    align: CellHorizontalAlign,
    vAlign: CellVerticalAlign,
    defaultFontSize: number,
    defaultFontFamily: string,
    defaultColor: string,
    wrap: boolean
): RichTextLayoutNode[] => {
    const nodes: RichTextLayoutNode[] = []

    let currentLine: RichTextLayoutNode[] = []
    let currentLineWidth = 0
    let currentLineMaxHeight = 0
    let currentY = 0

    const commitLine = () => {
        let offsetX = 0
        if (align === 'c') {
            offsetX = (width - currentLineWidth) / 2
        } else if (align === 'r') {
            offsetX = width - currentLineWidth
        }

        currentLine.forEach((node) => {
            node.x += offsetX
            node.y = currentY
            node.height = currentLineMaxHeight
            nodes.push(node)
        })

        currentY += currentLineMaxHeight
        currentLine = []
        currentLineWidth = 0
        currentLineMaxHeight = 0
    }

    for (let i = 0; i < fragments.length; i++) {
        const f = fragments[i]
        const fs = f.fontSize || defaultFontSize
        const fam = f.font || defaultFontFamily
        const bold = !!f.bold
        const italic = !!f.italic
        const color = f.color || defaultColor

        // Direct call to measureTextWidth (KISS Principle)
        const measure = (t: string) => measureTextWidth(t, fs, fam, bold, italic)

        // Initial approx height
        const fragLineHeight = fs * 1.15

        // Helper to add a node to the current line (DRY)
        const pushNode = (text: string, w: number) => {
            currentLine.push({
                text,
                x: currentLineWidth,
                y: 0, // Placeholder
                width: w,
                height: fragLineHeight, // Placeholder
                fs,
                fam,
                color,
                bold,
                italic,
                strike: f.strike,
                underline: !!f.underline,
            })
            currentLineWidth += w
            currentLineMaxHeight = Math.max(currentLineMaxHeight, fragLineHeight)
        }

        let remainingText = f.text

        while (remainingText.length > 0) {
            const fullW = measure(remainingText)

            if (!wrap || currentLineWidth + fullW <= width) {
                // Fits entirely
                pushNode(remainingText, fullW)
                remainingText = ''
            } else {
                // Needs wrap
                const available = width - currentLineWidth

                // Edge case: Line full
                if (available <= 0) {
                    if (currentLine.length > 0) {
                        commitLine()
                        continue
                    }
                }

                // Greedy search for split point
                let guess = Math.floor(remainingText.length * (available / (fullW || 1)))
                if (guess < 1) guess = 1
                if (guess > remainingText.length) guess = remainingText.length

                let w = measure(remainingText.substring(0, guess))

                if (w <= available) {
                    while (guess < remainingText.length) {
                        const nextW = measure(remainingText.substring(0, guess + 1))
                        if (nextW > available) break
                        w = nextW
                        guess++
                    }
                } else {
                    while (guess > 0) {
                        const prevW = measure(remainingText.substring(0, guess - 1))
                        if (prevW <= available) break
                        guess--
                    }
                    w = measure(remainingText.substring(0, guess))
                }

                // Force at least 1 char if line is empty
                if (guess === 0) {
                    if (currentLine.length > 0) {
                        commitLine()
                        continue
                    }
                    guess = 1
                    w = measure(remainingText.substring(0, 1))
                }

                const chunk = remainingText.substring(0, guess)
                pushNode(chunk, w)
                remainingText = remainingText.substring(guess)

                commitLine()
            }
        }
    }

    if (currentLine.length > 0) {
        commitLine()
    }

    const totalBlockHeight = currentY
    let startYOffset = 0
    if (vAlign === 'm') {
        startYOffset = (height - totalBlockHeight) / 2
    } else if (vAlign === 'b') {
        startYOffset = height - totalBlockHeight
    }

    return nodes.map((n) => ({ ...n, y: n.y + startYOffset }))
}
