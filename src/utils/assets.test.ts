import { describe, it, expect } from 'vitest'
import { resolveAssetUri, getImageSrc, addAsset } from '@/utils/assets'
import type { Doc, ImageNode } from '@/types/canvas'

function createDocWithAssets(): Doc {
    return {
        v: 1,
        id: 'test-doc',
        title: 'Test',
        unit: 'mm',
        surfaces: [{ id: 'page-1', type: 'page', w: 210, h: 297 }],
        nodes: [],
        assets: [
            { id: 'asset-1', type: 'image', uri: 'data:image/png;base64,abc123' },
            { id: 'asset-2', type: 'image', uri: 'https://example.com/image.png' },
        ],
    }
}

describe('resolveAssetUri', () => {
    it('should resolve asset URI by ID', () => {
        const doc = createDocWithAssets()
        const uri = resolveAssetUri(doc, 'asset-1')

        expect(uri).toBe('data:image/png;base64,abc123')
    })

    it('should return undefined for non-existent asset', () => {
        const doc = createDocWithAssets()
        const uri = resolveAssetUri(doc, 'non-existent')

        expect(uri).toBeUndefined()
    })

    it('should return undefined when doc has no assets', () => {
        const doc: Doc = {
            v: 1,
            id: 'test',
            title: 'Test',
            unit: 'mm',
            surfaces: [{ id: 'page-1', type: 'page', w: 210, h: 297 }],
            nodes: [],
        }
        const uri = resolveAssetUri(doc, 'asset-1')

        expect(uri).toBeUndefined()
    })
})

describe('getImageSrc', () => {
    it('should return src if present', () => {
        const doc = createDocWithAssets()
        const node: ImageNode = {
            t: 'image',
            id: 'img-1',
            s: 'page-1',
            x: 0,
            y: 0,
            w: 100,
            h: 100,
            src: 'https://direct.com/image.png',
        }

        const src = getImageSrc(doc, node)
        expect(src).toBe('https://direct.com/image.png')
    })

    it('should resolve assetId if src is not present', () => {
        const doc = createDocWithAssets()
        const node: ImageNode = {
            t: 'image',
            id: 'img-1',
            s: 'page-1',
            x: 0,
            y: 0,
            w: 100,
            h: 100,
            assetId: 'asset-2',
        }

        const src = getImageSrc(doc, node)
        expect(src).toBe('https://example.com/image.png')
    })

    it('should prefer src over assetId', () => {
        const doc = createDocWithAssets()
        const node: ImageNode = {
            t: 'image',
            id: 'img-1',
            s: 'page-1',
            x: 0,
            y: 0,
            w: 100,
            h: 100,
            src: 'https://preferred.com/image.png',
            assetId: 'asset-1',
        }

        const src = getImageSrc(doc, node)
        expect(src).toBe('https://preferred.com/image.png')
    })

    it('should return undefined if neither src nor assetId', () => {
        const doc = createDocWithAssets()
        const node: ImageNode = {
            t: 'image',
            id: 'img-1',
            s: 'page-1',
            x: 0,
            y: 0,
            w: 100,
            h: 100,
        }

        const src = getImageSrc(doc, node)
        expect(src).toBeUndefined()
    })
})

describe('addAsset', () => {
    it('should add new asset and return assetId', () => {
        const doc = createDocWithAssets()
        const result = addAsset(doc, {
            type: 'image',
            uri: 'data:image/jpeg;base64,xyz789',
        })

        expect(result.assetId).toBe('asset-3')
        expect(result.doc.assets?.length).toBe(3)
        expect(result.doc.assets?.find((a) => a.id === 'asset-3')?.uri).toBe(
            'data:image/jpeg;base64,xyz789'
        )
    })

    it('should handle doc without existing assets', () => {
        const doc: Doc = {
            v: 1,
            id: 'test',
            title: 'Test',
            unit: 'mm',
            surfaces: [{ id: 'page-1', type: 'page', w: 210, h: 297 }],
            nodes: [],
        }
        const result = addAsset(doc, {
            type: 'image',
            uri: 'data:image/png;base64,first',
        })

        expect(result.assetId).toBe('asset-1')
        expect(result.doc.assets?.length).toBe(1)
    })
})
