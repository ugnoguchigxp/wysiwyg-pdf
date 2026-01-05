import { describe, it, expect } from 'vitest'
import { validateForAI } from '@/utils/ai-validation'
import { AI_LIMITS } from '@/constants/ai-limits'
import type { Doc, Surface, TextNode, ImageNode } from '@/types/canvas'

function createMinimalDoc(overrides: Partial<Doc> = {}): Doc {
    return {
        v: 1,
        id: 'test-doc',
        title: 'Test Document',
        unit: 'mm',
        surfaces: [{ id: 'page-1', type: 'page', w: 210, h: 297 }],
        nodes: [],
        ...overrides,
    }
}

function createTextNode(id: string, surfaceId: string, text: string): TextNode {
    return {
        t: 'text',
        id,
        s: surfaceId,
        x: 0,
        y: 0,
        w: 100,
        h: 20,
        text,
    }
}

function createImageNode(id: string, surfaceId: string, src: string): ImageNode {
    return {
        t: 'image',
        id,
        s: surfaceId,
        x: 0,
        y: 0,
        w: 100,
        h: 100,
        src,
    }
}

describe('validateForAI', () => {
    it('should return valid for a minimal valid doc', () => {
        const doc = createMinimalDoc()
        const result = validateForAI(doc)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
        expect(result.warnings).toHaveLength(0)
    })

    it('should error when surfaces exceed maxSurfaces', () => {
        const surfaces: Surface[] = Array.from({ length: AI_LIMITS.maxSurfaces + 1 }, (_, i) => ({
            id: `page-${i + 1}`,
            type: 'page' as const,
            w: 210,
            h: 297,
        }))
        const doc = createMinimalDoc({ surfaces })
        const result = validateForAI(doc)

        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.includes('Surface count'))).toBe(true)
    })

    it('should error when total nodes exceed maxTotalNodes', () => {
        const nodes = Array.from({ length: AI_LIMITS.maxTotalNodes + 1 }, (_, i) =>
            createTextNode(`txt-${i}`, 'page-1', 'test')
        )
        const doc = createMinimalDoc({ nodes })
        const result = validateForAI(doc)

        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.includes('Total node count'))).toBe(true)
    })

    it('should warn when nodes per surface exceed maxNodesPerSurface', () => {
        const nodes = Array.from({ length: AI_LIMITS.maxNodesPerSurface + 1 }, (_, i) =>
            createTextNode(`txt-${i}`, 'page-1', 'test')
        )
        const doc = createMinimalDoc({ nodes })
        const result = validateForAI(doc)

        // This generates a warning, not an error (valid is still true if under maxTotalNodes)
        expect(result.warnings.some((w) => w.includes('nodes (limit:'))).toBe(true)
    })

    it('should warn when text length exceeds maxTextLength', () => {
        const longText = 'a'.repeat(AI_LIMITS.maxTextLength + 1)
        const nodes = [createTextNode('txt-1', 'page-1', longText)]
        const doc = createMinimalDoc({ nodes })
        const result = validateForAI(doc)

        expect(result.valid).toBe(true)
        expect(result.warnings.some((w) => w.includes('text length'))).toBe(true)
    })

    it('should warn when base64 image exceeds maxImageSizeBytes', () => {
        // Create a base64 string that exceeds the limit
        // base64 encodes 3 bytes into 4 characters, so we need (maxImageSizeBytes + 1) * 4/3 characters
        const base64Length = Math.ceil(((AI_LIMITS.maxImageSizeBytes + 1000) * 4) / 3)
        const largeBase64 = 'A'.repeat(base64Length)
        const largeSrc = `data:image/png;base64,${largeBase64}`

        const nodes = [createImageNode('img-1', 'page-1', largeSrc)]
        const doc = createMinimalDoc({ nodes })
        const result = validateForAI(doc)

        expect(result.valid).toBe(true)
        expect(result.warnings.some((w) => w.includes('estimated size'))).toBe(true)
    })

    it('should not warn for small base64 images', () => {
        const smallBase64 = 'SGVsbG8gV29ybGQ=' // "Hello World"
        const smallSrc = `data:image/png;base64,${smallBase64}`

        const nodes = [createImageNode('img-1', 'page-1', smallSrc)]
        const doc = createMinimalDoc({ nodes })
        const result = validateForAI(doc)

        expect(result.valid).toBe(true)
        expect(result.warnings).toHaveLength(0)
    })
})
