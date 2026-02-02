import { useEffect, useState } from 'react'
import { Image as KonvaImage, Rect as KonvaRect } from 'react-konva'
import { findImageWithExtension } from '@/features/konva-editor/utils/canvasImageUtils'
import type { Surface } from '@/types/canvas'

interface PageBackgroundProps {
  width: number
  height: number
  surface: Surface
}

export const PageBackground = ({ width, height, surface }: PageBackgroundProps) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null)

  const bg = surface.bg
  const bgAssetId = surface.bgAssetId
  const isColor = bg ? bg.startsWith('#') || bg.startsWith('rgb') : true

  useEffect(() => {
    // Priority: bgAssetId > bg
    if (!bg && !bgAssetId) {
      setImage(null)
      return
    }

    if (isColor && !bgAssetId) {
      setImage(null)
      return
    }

    const resolveUrl = bgAssetId || bg
    if (!resolveUrl) return

    if (!resolveUrl.startsWith('http') && !resolveUrl.startsWith('data:')) {
      findImageWithExtension(resolveUrl).then((res) => {
        if (res) setImage(res.img)
      })
    } else {
      const img = new window.Image()
      img.src = resolveUrl
      img.onload = () => setImage(img)
    }
  }, [bg, bgAssetId, isColor])

  return (
    <>
      <KonvaRect
        name="_background"
        x={0}
        y={0}
        width={width}
        height={height}
        fill={isColor ? bg || '#ffffff' : '#ffffff'}
        shadowColor="black"
        shadowBlur={10}
        shadowOpacity={0.1}
      />
      {image && (
        <KonvaImage
          name="_background"
          x={0}
          y={0}
          width={width}
          height={height}
          image={image}
          listening={false}
        />
      )}
    </>
  )
}
