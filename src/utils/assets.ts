import type { Asset, Doc, ImageNode } from '@/types/canvas'

export function resolveAssetUri(doc: Doc, assetId: string): string | undefined {
  return doc.assets?.find((a) => a.id === assetId)?.uri
}

export function getImageSrc(doc: Doc, node: ImageNode): string | undefined {
  if (node.src) return node.src
  if (node.assetId) return resolveAssetUri(doc, node.assetId)
  return undefined
}

export function addAsset(doc: Doc, asset: Omit<Asset, 'id'>): { doc: Doc; assetId: string } {
  const existingCount = doc.assets?.length ?? 0
  const assetId = `asset-${existingCount + 1}`
  const newAsset: Asset = { ...asset, id: assetId }
  return {
    doc: {
      ...doc,
      assets: [...(doc.assets ?? []), newAsset],
    },
    assetId,
  }
}
