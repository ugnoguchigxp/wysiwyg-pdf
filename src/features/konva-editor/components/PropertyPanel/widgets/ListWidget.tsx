import type React from 'react'
import type { ListWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { TextNode } from '@/types/canvas'
import { cn } from '@/utils/utils'
import {
  applyListFormatting,
  getListTypeFromText,
  removeListFormatting,
} from '@/features/konva-editor/utils/textList'
import { WidgetLabel } from '../shared'
import type { WidgetProps } from './types'

const BulletIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" width="20" height="20" aria-hidden="true">
    <circle cx="12" cy="16" r="4" />
    <rect x="22" y="14" width="32" height="4" rx="2" />
    <circle cx="12" cy="32" r="4" />
    <rect x="22" y="30" width="32" height="4" rx="2" />
    <circle cx="12" cy="48" r="4" />
    <rect x="22" y="46" width="32" height="4" rx="2" />
  </svg>
)

const NumberIcon: React.FC = () => (
  <svg viewBox="0 0 64 64" width="20" height="20" aria-hidden="true">
    <text x="4" y="20" fontSize="14" fontFamily="system-ui, sans-serif">1.</text>
    <rect x="22" y="14" width="32" height="4" rx="2" />
    <text x="4" y="36" fontSize="14" fontFamily="system-ui, sans-serif">2.</text>
    <rect x="22" y="30" width="32" height="4" rx="2" />
    <text x="4" y="52" fontSize="14" fontFamily="system-ui, sans-serif">3.</text>
    <rect x="22" y="46" width="32" height="4" rx="2" />
  </svg>
)

export const ListWidget: React.FC<WidgetProps<ListWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  if (node.t !== 'text') return null
  const textNode = node as TextNode
  const text = textNode.text ?? ''
  const isVertical = !!textNode.vertical
  const activeType = getListTypeFromText(text, { vertical: isVertical })

  const handleClick = (type: 'bullet' | 'number') => {
    const nextText =
      activeType === type
        ? removeListFormatting(text, { vertical: isVertical })
        : applyListFormatting(text, type, { vertical: isVertical })
    onChange({ text: nextText } as Partial<TextNode>)
  }

  return (
    <div>
      <WidgetLabel>{resolveText(config.labelKey ?? 'properties_list', 'List')}</WidgetLabel>
      <div className="flex bg-background rounded border border-border p-1 gap-1">
        <button
          type="button"
          onClick={() => handleClick('bullet')}
          className={cn(
            'flex-1 py-2 flex items-center justify-center gap-1 rounded text-xs transition-colors',
            activeType === 'bullet'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent text-muted-foreground'
          )}
          title={resolveText('properties_list_bullet', 'Bulleted list')}
        >
          <BulletIcon />
        </button>
        <button
          type="button"
          onClick={() => handleClick('number')}
          className={cn(
            'flex-1 py-2 flex items-center justify-center gap-1 rounded text-xs transition-colors',
            activeType === 'number'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent text-muted-foreground'
          )}
          title={resolveText('properties_list_numbered', 'Numbered list')}
        >
          <NumberIcon />
        </button>
      </div>
    </div>
  )
}
