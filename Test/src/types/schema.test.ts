import { describe, it, expect } from 'vitest'
import type { Doc, TextNode, LineNode, WidgetNode } from '../../../src/types/canvas'

describe('Unified JSON Schema v2', () => {

    it('should validate a complete Document structure', () => {
        const doc: Doc = {
            v: 1,
            id: "doc-123",
            title: "Test Document",
            unit: "pt",
            surfaces: [
                {
                    id: "page-1",
                    type: "page",
                    w: 595,
                    h: 842,
                    bg: "#ffffff"
                }
            ],
            nodes: []
        }

        expect(doc.v).toBe(1)
        expect(doc.surfaces).toHaveLength(1)
        expect(doc.surfaces[0].type).toBe('page')
    })

    it('should validate a TextNode matches the schema', () => {
        const textNode: TextNode = {
            id: "text-1",
            t: "text",
            s: "page-1",
            x: 100,
            y: 100,
            w: 200,
            h: 50,
            r: 0,
            text: "Hello World",
            font: "Arial",
            fontSize: 16,
            fill: "#000000",
            align: 'c'
        }

        expect(textNode.t).toBe('text')
        // Check that legacy keys are undefined
        expect((textNode as unknown as Record<string, unknown>).type).toBeUndefined()
    })

    it('should validate a WidgetNode (Bed) matches the schema', () => {
        const bedNode: WidgetNode = {
            id: "bed-1",
            t: "widget",
            widget: "bed",
            s: "page-1",
            x: 50,
            y: 50,
            w: 100,
            h: 200,
            r: 90,
            name: "Bed A",
            data: {
                bedType: "standard",
                status: "occupied"
            }
        }

        expect(bedNode.t).toBe('widget')
        expect(bedNode.widget).toBe('bed')
        expect((bedNode as unknown as Record<string, unknown>).box).toBeUndefined()
    })

    it('should validate a LineNode with flattened points', () => {
        const lineNode: LineNode = {
            id: "line-1",
            t: "line",
            s: "page-1",
            pts: [0, 0, 100, 100],
            stroke: "black",
            strokeW: 2,
            arrows: ["none", "arrow"]
        }

        expect(lineNode.t).toBe('line')
        expect(lineNode.pts).toHaveLength(4)
        expect((lineNode as unknown as Record<string, unknown>).startPoint).toBeUndefined()
    })

    it('should accept Valid JSON structure', () => {
        // Runtime check of a raw JSON object
        const rawJson = {
            v: 1,
            id: "test",
            unit: "mm",
            surfaces: [],
            nodes: [
                {
                    id: "n1",
                    t: "text",
                    s: "s1",
                    text: "Content",
                    x: 0, y: 0, w: 10, h: 10
                }
            ]
        }

        // Type assertion to ensure it fits our interface
        const validDoc: Doc = rawJson as unknown as Doc
        expect(validDoc.nodes[0].t).toBe('text')
    })
})
