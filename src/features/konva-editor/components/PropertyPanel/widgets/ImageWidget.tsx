import type React from 'react'
import { useEffect, useState } from 'react'
import type { ImageWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { ImageNode } from '@/types/canvas'
import { pxToMm } from '@/utils/units'
import type { WidgetProps } from './types'

export const ImageWidget: React.FC<WidgetProps<ImageWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading')

  useEffect(() => {
    if (node.t !== 'image') return
    const imageNode = node as ImageNode
    const src = imageNode.src

    if (!src) {
      setStatus('error')
      return
    }
    if (src.startsWith('data:') || src.startsWith('http')) {
      setImageSrc(src)
      setStatus('loaded')
    } else {
      // Asset lookup would go here
      setImageSrc(src)
      setStatus('loaded')
    }
  }, [node])

  if (node.t !== 'image') return null

  const maxHeight = config.props?.maxPreviewHeight ?? 120

  return (
    <div>
      {config.props?.showPreview !== false && (
        <div className="mb-2">
          {status === 'loading' && (
            <div className="w-full h-20 bg-muted border border-border rounded flex items-center justify-center text-xs text-muted-foreground">
              {resolveText('loading', 'Loading...')}
            </div>
          )}
          {status === 'error' && (
            <div className="w-full h-20 bg-muted border border-border rounded flex items-center justify-center text-xs text-red-500">
              {resolveText('no_image', 'No Image')}
            </div>
          )}
          {status === 'loaded' && imageSrc && (
            <div
              className="w-full bg-muted border border-border rounded flex items-center justify-center p-2 mb-2"
              style={{ maxHeight }}
            >
              <img
                src={imageSrc}
                alt={resolveText('properties_preview', 'Preview')}
                className="max-w-full max-h-full object-contain"
                style={{ maxHeight: maxHeight - 16 }}
              />
            </div>
          )}
        </div>
      )}

      <div className="flex gap-1">
        <label className="flex flex-col items-center justify-center flex-1 h-8 border border-border border-dashed rounded cursor-pointer hover:bg-muted transition-colors">
          <span className="text-xs text-muted-foreground">
            {resolveText('browse', 'Browse...')}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                const reader = new FileReader()
                reader.onload = (ev) => {
                  const result = ev.target?.result as string
                  if (result) {
                    const img = new Image()
                    img.onload = () => {
                      const dpi = 96
                      const naturalW = pxToMm(img.width, { dpi })
                      const naturalH = pxToMm(img.height, { dpi })

                      onChange({
                        src: result,
                        w: naturalW,
                        h: naturalH,
                      } as Partial<ImageNode>)
                    }
                    img.src = result
                  }
                }
                reader.readAsDataURL(file)
              }
            }}
          />
        </label>
        {node.t === 'image' && (node as ImageNode).src && (
          <button
            onClick={() => onChange({ src: '' } as Partial<ImageNode>)}
            className="px-2 py-1 text-xs bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors"
            title={resolveText('remove', 'Remove')}
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}
