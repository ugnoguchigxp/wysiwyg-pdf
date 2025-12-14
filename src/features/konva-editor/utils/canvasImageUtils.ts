import type { Dispatch, SetStateAction } from 'react'
import type { ImageNode, TableNode } from '@/types/canvas'
import { createContextLogger } from '@/utils/logger'

const log = createContextLogger('CanvasImageUtils')

type WysiwygPdfGlobalConfig = {
  assetBaseUrl?: string
}

function getAssetBaseUrl(): string {
  const cfg = (globalThis as unknown as { __WYSIWYG_PDF__?: WysiwygPdfGlobalConfig })
    .__WYSIWYG_PDF__
  return cfg?.assetBaseUrl ?? ''
}

// 画像の拡張子を自動検出するヘルパー関数
export async function findImageWithExtension(
  assetId: string
): Promise<{ url: string; img: HTMLImageElement } | null> {
  if (!assetId) return null
  // Check if assetId is a Data URL
  if (assetId.startsWith('data:') || assetId.startsWith('blob:') || assetId.startsWith('http')) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ url: assetId, img })
      img.onerror = () => {
        log.error('Failed to load image from URL')
        resolve(null)
      }
      img.src = assetId
    })
  }

  const base = getAssetBaseUrl()
  const baseUrl = `${base || ''}/assets/images/${assetId}`.replace(/([^:]\/\/)\/+/, '$1')
  const extensions = ['png', 'jpg', 'jpeg', 'svg', 'webp']

  for (const ext of extensions) {
    try {
      const imageUrl = `${baseUrl}.${ext}`
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        img.src = imageUrl
      })
      return { url: imageUrl, img }
    } catch (_error) {
      // Continue to next extension
    }
  }
  return null
}

// 画像要素の描画
export function drawImageElement(
  ctx: CanvasRenderingContext2D,
  element: ImageNode,
  imageCache: Map<string, HTMLImageElement>,
  setImageCache: Dispatch<SetStateAction<Map<string, HTMLImageElement>>>,
  labels: { loading: string; placeholder: string }
) {
  const { x, y, w, h, src } = element

  if (!src) {
    // Empty placeholder
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(x, y, w, h)
    ctx.strokeStyle = '#d1d5db'
    ctx.strokeRect(x, y, w, h)

    ctx.fillStyle = '#6b7280'
    ctx.font = '12px Meiryo'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(labels.placeholder, x + w / 2, y + h / 2)
    return
  }

  ctx.save()

  // Helper to load
  const loadAndCache = (source: string) => {
    findImageWithExtension(source).then((res) => {
      if (res) {
        setImageCache((prev) => new Map(prev).set(source, res.img))
        // Also cache by resolved URL if different?
        if (res.url !== source) setImageCache((prev) => new Map(prev).set(res.url, res.img))
      }
    })
  }

  if (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http')) {
    const cachedImg = imageCache.get(src)
    if (cachedImg?.complete) {
      ctx.drawImage(cachedImg, x, y, w, h)
    } else {
      loadAndCache(src)
      // Loading placeholder
      ctx.fillStyle = '#3b82f6'
      ctx.font = '12px Meiryo'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(labels.loading, x + w / 2, y + h / 2)
    }
    ctx.restore()
    return
  }

  // Asset ID logic
  const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
  const base = getAssetBaseUrl()
  const baseUrl = `${base || ''}/assets/images/${src}`.replace(/([^:]\/\/)\/+/, '$1')
  let foundCachedImage = false

  // Try finding in cache by potential URLs?
  // This logic relies on `findImageWithExtension` populating cache with the key we used to lookup?
  // Actually `findImageWithExtension` returns the resolved URL.
  // We should probably rely on `findImageWithExtension` caching the RESULT URL, but we don't know it yet.
  // So we check if we have mapped `src` to an image in cache?

  // Simplified: check if `src` is in cache (mapped by previous load)
  // Or check if derived URLs are in cache.
  // Reusing logic from original file roughly.

  for (const ext of extensions) {
    const imageUrl = `${baseUrl}.${ext}`
    const cachedImg = imageCache.get(imageUrl)
    if (cachedImg?.complete) {
      ctx.drawImage(cachedImg, x, y, w, h)
      foundCachedImage = true
      break
    }
  }

  if (!foundCachedImage) {
    // Trigger load
    findImageWithExtension(src).then((result) => {
      if (result) {
        setImageCache((prev: Map<string, HTMLImageElement>) =>
          new Map(prev).set(result.url, result.img)
        )
      }
    })

    // Loading placeholder
    ctx.fillStyle = '#3b82f6'
    ctx.font = '12px Meiryo'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(labels.loading, x + w / 2, y + h / 2)
  }

  ctx.restore()
}

// テーブル要素の描画
export function drawTableElement(ctx: CanvasRenderingContext2D, element: TableNode) {
  const { x: tableX, y: tableY, table } = element
  const { rows, cols, cells } = table

  ctx.save()
  ctx.translate(tableX, tableY)

  // Helper to get row Y position
  const getRowY = (rowIndex: number) => {
    let y = 0
    for (let i = 0; i < rowIndex; i++) {
      if (rows[i] !== undefined) y += rows[i]
    }
    return y
  }

  // Helper to get col X position
  const getColX = (colIndex: number) => {
    let x = 0
    for (let i = 0; i < colIndex; i++) {
      if (cols[i] !== undefined) x += cols[i]
    }
    return x
  }

  // Draw cells
  cells.forEach((cell) => {
    const cx = getColX(cell.c)
    const cy = getRowY(cell.r)

    // Calculate width/height including span
    let width = 0
    for (let i = 0; i < (cell.cs || 1); i++) {
      const cw = cols[cell.c + i]
      if (cw !== undefined) width += cw
    }

    let height = 0
    for (let i = 0; i < (cell.rs || 1); i++) {
      const rh = rows[cell.r + i]
      if (rh !== undefined) height += rh
    }

    // Background
    if (cell.bg) {
      ctx.fillStyle = cell.bg
      ctx.fillRect(cx, cy, width, height)
    }

    // Border
    const borderColor = cell.borderColor || cell.border || '#cccccc'
    const borderWidth = cell.borderW ?? (cell.border ? 1 : 1)
    if (borderWidth > 0) {
      ctx.strokeStyle = borderColor
      ctx.lineWidth = borderWidth
      ctx.strokeRect(cx, cy, width, height)
    }

    // Text
    if (cell.v) {
      const fontSize = cell.fontSize || 12
      const fontFamily = cell.font || 'Meiryo'
      const fontWeight = 400
      const fontColor = cell.color || '#000000'
      const align = cell.align || 'l' // 'l' | 'c' | 'r'
      const verticalAlign = cell.vAlign || 'm' // 't' | 'm' | 'b'

      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
      ctx.fillStyle = fontColor
      ctx.textBaseline = verticalAlign === 't' ? 'top' : verticalAlign === 'b' ? 'bottom' : 'middle'

      let textX = cx
      const textY =
        verticalAlign === 't' ? cy + 4 : verticalAlign === 'b' ? cy + height - 4 : cy + height / 2

      // Horizontal Align
      if (align === 'c') {
        ctx.textAlign = 'center'
        textX += width / 2
      } else if (align === 'r') {
        ctx.textAlign = 'right'
        textX += width - 4
      } else {
        ctx.textAlign = 'left'
        textX += 4
      }

      // Vertical Align (Using 'm' logic above)

      ctx.fillText(cell.v, textX, textY)
    }
  })

  ctx.restore()
}

// 背景画像の描画
export function drawBackgroundImage(
  ctx: CanvasRenderingContext2D,
  backgroundImageId: string,
  pageWidth: number,
  pageHeight: number,
  backgroundImageCache: Map<string, HTMLImageElement>,
  labels?: { loading: string; imageLoading: (name: string) => string }
) {
  if (!backgroundImageId) return

  // Check for Data URL (new behavior)
  if (
    backgroundImageId.startsWith('data:') ||
    backgroundImageId.startsWith('blob:') ||
    backgroundImageId.startsWith('http')
  ) {
    const cachedImage = backgroundImageCache.get(backgroundImageId)
    if (cachedImage?.complete) {
      ctx.drawImage(cachedImage, 0, 0, pageWidth, pageHeight)
    } else {
      // Loading state
      ctx.fillStyle = '#f0f9ff'
      ctx.fillRect(0, 0, pageWidth, pageHeight)
      ctx.fillStyle = '#3b82f6'
      ctx.font = '14px Meiryo'
      ctx.textAlign = 'center'
      ctx.fillText(labels?.loading ?? '背景画像読み込み中...', pageWidth / 2, pageHeight / 2)
    }
    return
  }

  // Legacy behavior (ID based) - Assuming simple IDs
  const cachedImage = backgroundImageCache.get(backgroundImageId)
  if (cachedImage) {
    ctx.drawImage(cachedImage, 0, 0, pageWidth, pageHeight)
  } else {
    ctx.fillStyle = '#f0f9ff'
    ctx.fillRect(10, 10, pageWidth - 20, pageHeight - 20)
    ctx.fillStyle = '#3b82f6'
    ctx.font = '14px Meiryo'
    ctx.textAlign = 'center'
    ctx.fillText(
      labels?.imageLoading(backgroundImageId) ?? `画像読み込み中: ${backgroundImageId}`,
      pageWidth / 2,
      pageHeight / 2
    )
  }
}

// 背景画像のプリロード
export function preloadBackgroundImage(
  backgroundImageId: string,
  backgroundImageCache: Map<string, HTMLImageElement>,
  setBackgroundImageCache: Dispatch<SetStateAction<Map<string, HTMLImageElement>>>
) {
  if (!backgroundImageId || backgroundImageCache.has(backgroundImageId)) return

  findImageWithExtension(backgroundImageId)
    .then((result) => {
      if (result) {
        setBackgroundImageCache((prev: Map<string, HTMLImageElement>) =>
          new Map(prev).set(backgroundImageId, result.img)
        )
      }
    })
    .catch((error) => {
      log.error('Error loading background image:', error)
    })
}
