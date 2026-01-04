import type Konva from 'konva'
import type React from 'react'
import { forwardRef, useEffect, useState } from 'react'
import { Group, Image as KonvaImage, Rect, Text } from 'react-konva'
import { findImageWithExtension } from '@/features/konva-editor/utils/canvasImageUtils'
import { useI18n } from '@/i18n/I18nContext'
import type { ImageNode } from '../../types/canvas'
import type { CanvasElementCommonProps } from './types'

export const CanvasImage = forwardRef<
  Konva.Image | Konva.Group,
  {
    element: ImageNode
    commonProps: CanvasElementCommonProps
    invScale: number
  }
>(({ element, commonProps, invScale }, ref) => {
  const { t } = useI18n()
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error' | 'empty'>('empty')

  useEffect(() => {
    if (!element.src) {
      setStatus('empty')
      setImage(null)
      return
    }

    setStatus('loading')

    if (element.src.startsWith('http') || element.src.startsWith('data:')) {
      const img = new window.Image()
      img.src = element.src
      img.onload = () => {
        setImage(img)
        setStatus('loaded')
      }
      img.onerror = () => {
        setStatus('error')
      }
    } else {
      findImageWithExtension(element.src)
        .then((result) => {
          if (result) {
            setImage(result.img)
            setStatus('loaded')
          } else {
            setStatus('error')
          }
        })
        .catch((_err) => {
          setStatus('error')
        })
    }
  }, [element.src])

  const { ref: _ignoredRef, ...propsWithoutRef } = commonProps

  if (status === 'loaded' && image) {
    return (
      <KonvaImage
        {...propsWithoutRef}
        image={image}
        width={element.w}
        height={element.h}
        ref={ref as React.Ref<Konva.Image>}
        opacity={element.opacity ?? 1}
      />
    )
  }

  // Placeholder styling
  const isError = status === 'error'
  const isLoading = status === 'loading'
  const bgColor = isError ? '#fee2e2' : isLoading ? '#eff6ff' : '#e5e7eb'
  const borderColor = isError ? '#ef4444' : isLoading ? '#3b82f6' : '#6b7280'
  const textColor = isError ? '#b91c1c' : isLoading ? '#1d4ed8' : '#374151'
  const labelText = isError
    ? t('error', 'Error')
    : isLoading
      ? t('loading', 'Loading...')
      : t('properties_element_image', 'Image')

  return (
    <Group {...propsWithoutRef} ref={ref as React.Ref<Konva.Group>}>
      <Rect
        width={element.w}
        height={element.h}
        fill={bgColor}
        stroke={borderColor}
        strokeWidth={3 * invScale}
      />
      <Text
        x={0}
        y={0}
        width={element.w}
        height={element.h}
        text={labelText}
        fill={textColor}
        align="center"
        verticalAlign="middle"
        fontSize={14 * invScale}
        fontStyle="bold"
        fontFamily="Helvetica"
      />
    </Group>
  )
})

CanvasImage.displayName = 'CanvasImage'
