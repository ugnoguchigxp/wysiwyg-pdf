import { createContextLogger } from '../../../../../../utils/logger'

import type { Dispatch, SetStateAction } from 'react'
import type { IImageElement, ITableElement } from '../../types/wysiwyg'

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
  // Check if assetId is a Data URL
  if (assetId.startsWith('data:') || assetId.startsWith('blob:')) {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => resolve({ url: assetId, img })
      img.onerror = () => {
        log.error('Failed to load image from Data URL')
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
  element: IImageElement,
  imageCache: Map<string, HTMLImageElement>,
  setImageCache: Dispatch<SetStateAction<Map<string, HTMLImageElement>>>,
  labels: { loading: string; placeholder: string }
) {
  const { box, assetId } = element

  ctx.save()

  if (assetId?.trim()) {
    // Check for Data URL
    if (assetId.startsWith('data:') || assetId.startsWith('blob:')) {
      const cachedImg = imageCache.get(assetId)
      if (cachedImg?.complete) {
        // log.debug('Drawing cached Data URL image');
        ctx.drawImage(cachedImg, box.x, box.y, box.width, box.height)
        // No border or background for loaded image
      } else {
        log.info('Data URL image not cached, loading...')
        // Load Data URL if not cached
        findImageWithExtension(assetId)
          .then((result) => {
            if (result) {
              log.info('Data URL loaded successfully')
              setImageCache((prev: Map<string, HTMLImageElement>) =>
                new Map(prev).set(result.url, result.img)
              )
            } else {
              log.error('Failed to load Data URL')
            }
          })
          .catch((error) => {
            log.error('Error loading Data URL image:', error)
          })

        // Loading placeholder (transparent, just text)
        ctx.fillStyle = '#3b82f6'
        ctx.font = '12px Meiryo'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(labels.loading, box.x + box.width / 2, box.y + box.height / 2)
      }
      ctx.restore()
      return
    }

    const extensions = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    const base = getAssetBaseUrl()
    const baseUrl = `${base || ''}/assets/images/${assetId}`.replace(/([^:]\/\/)\/+/, '$1')
    let foundCachedImage = false

    for (const ext of extensions) {
      const imageUrl = `${baseUrl}.${ext}`
      const cachedImg = imageCache.get(imageUrl)
      if (cachedImg?.complete) {
        ctx.drawImage(cachedImg, box.x, box.y, box.width, box.height)
        // No border
        foundCachedImage = true
        break
      }
    }

    if (!foundCachedImage) {
      findImageWithExtension(assetId)
        .then((result) => {
          if (result) {
            setImageCache((prev: Map<string, HTMLImageElement>) =>
              new Map(prev).set(result.url, result.img)
            )
          } else {
            log.warn(`No image found for asset ID: ${assetId}`)
          }
        })
        .catch((error) => {
          log.warn('Error loading image:', error)
        })

      // Loading placeholder
      ctx.fillStyle = '#3b82f6'
      ctx.font = '12px Meiryo'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(labels.loading, box.x + box.width / 2, box.y + box.height / 2)
    }
  } else {
    // Empty placeholder
    ctx.fillStyle = '#f3f4f6'
    ctx.fillRect(box.x, box.y, box.width, box.height)
    ctx.strokeStyle = '#d1d5db'
    ctx.strokeRect(box.x, box.y, box.width, box.height)

    ctx.fillStyle = '#6b7280'
    ctx.font = '12px Meiryo'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(labels.placeholder, box.x + box.width / 2, box.y + box.height / 2)
  }

  ctx.restore()
}

// テーブル要素の描画
export function drawTableElement(ctx: CanvasRenderingContext2D, element: ITableElement) {
  const { box, cells, rows, cols } = element

  ctx.save()
  ctx.translate(box.x, box.y) // Move to table origin

  // Helper to get row Y position
  const getRowY = (rowIndex: number) => {
    let y = 0
    for (let i = 0; i < rowIndex; i++) {
      if (rows[i]) y += rows[i].height
    }
    return y
  }

  // Helper to get col X position
  const getColX = (colIndex: number) => {
    let x = 0
    for (let i = 0; i < colIndex; i++) {
      if (cols[i]) x += cols[i].width
    }
    return x
  }

  // Draw cells
  cells.forEach((cell) => {
    const x = getColX(cell.col)
    const y = getRowY(cell.row)

    // Calculate width/height including span
    let width = 0
    for (let i = 0; i < (cell.colSpan || 1); i++) {
      if (cols[cell.col + i]) width += cols[cell.col + i].width
    }

    let height = 0
    for (let i = 0; i < (cell.rowSpan || 1); i++) {
      if (rows[cell.row + i]) height += rows[cell.row + i].height
    }

    // Background
    if (cell.styles.backgroundColor) {
      ctx.fillStyle = cell.styles.backgroundColor
      ctx.fillRect(x, y, width, height)
    }

    // Border (Simple implementation: stroke rect)
    // In a real Excel renderer, we'd handle individual borders. Here we assume uniform for now.
    const borderColor = cell.styles.borderColor || '#000000'
    const borderWidth = cell.styles.borderWidth || 1
    ctx.strokeStyle = borderColor
    ctx.lineWidth = borderWidth
    ctx.strokeRect(x, y, width, height)

    // Text
    if (cell.content) {
      const fontSize = cell.styles.font?.size || 12
      const fontFamily = cell.styles.font?.family || 'Meiryo'
      const fontWeight = cell.styles.font?.weight || 400
      const fontColor = cell.styles.font?.color || '#000000'
      const align = cell.styles.align || 'left'
      const verticalAlign = cell.styles.verticalAlign || 'top'

      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
      ctx.fillStyle = fontColor

      let textX = x
      let textY = y

      // Horizontal Align
      if (align === 'center') {
        ctx.textAlign = 'center'
        textX += width / 2
      } else if (align === 'right') {
        ctx.textAlign = 'right'
        textX += width - 4 // Padding
      } else {
        ctx.textAlign = 'left'
        textX += 4 // Padding
      }

      // Vertical Align
      ctx.textBaseline = 'top' // Default
      if (verticalAlign === 'middle') {
        ctx.textBaseline = 'middle'
        textY += height / 2
      } else if (verticalAlign === 'bottom') {
        ctx.textBaseline = 'bottom'
        textY += height - 4
      } else {
        textY += 4
      }

      ctx.fillText(cell.content, textX, textY)
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
  // Check for Data URL (new behavior)
  if (backgroundImageId.startsWith('data:') || backgroundImageId.startsWith('blob:')) {
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

  // Legacy behavior (ID based)
  const availableImages = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
  ]

  if (availableImages.includes(backgroundImageId)) {
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
  } else {
    // Invalid ID or empty
    // Do nothing or fill with white/transparent?
    // If it's not a known ID and not a Data URL, we assume it's invalid or empty.
  }
}

// 背景画像のプリロード
export function preloadBackgroundImage(
  backgroundImageId: string,
  backgroundImageCache: Map<string, HTMLImageElement>,
  setBackgroundImageCache: Dispatch<SetStateAction<Map<string, HTMLImageElement>>>
) {
  if (!backgroundImageId || backgroundImageCache.has(backgroundImageId)) return

  // Check for Data URL
  if (backgroundImageId.startsWith('data:') || backgroundImageId.startsWith('blob:')) {
    findImageWithExtension(backgroundImageId)
      .then((result) => {
        if (result) {
          setBackgroundImageCache((prev: Map<string, HTMLImageElement>) =>
            new Map(prev).set(backgroundImageId, result.img)
          )
        }
      })
      .catch((error) => {
        log.error('Error loading background image Data URL:', error)
      })
    return
  }

  // Legacy behavior
  const availableImages = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
  ]

  if (availableImages.includes(backgroundImageId)) {
    findImageWithExtension(backgroundImageId)
      .then((result) => {
        if (result) {
          setBackgroundImageCache((prev: Map<string, HTMLImageElement>) =>
            new Map(prev).set(backgroundImageId, result.img)
          )
        } else {
          log.error(`Failed to load background image: ${backgroundImageId}`)
        }
      })
      .catch((error) => {
        log.error(`Error loading background image ${backgroundImageId}:`, error)
      })
  }
}
