import type React from 'react'
import type { TextContentWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { TextNode } from '@/types/canvas'
import { cn } from '@/utils/utils'
import { WidgetLabel } from '../shared'
import type { WidgetProps } from './types'

export const TextContentWidget: React.FC<WidgetProps<TextContentWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  if (node.t !== 'text') return null
  const textNode = node as TextNode
  const rows = config.props?.rows ?? 3

  return (
    <div>
      <WidgetLabel>
        {resolveText(config.labelKey ?? 'properties_text_content', 'Content')}
      </WidgetLabel>
      <textarea
        value={textNode.text ?? ''}
        onChange={(e) => onChange({ text: e.target.value } as Partial<TextNode>)}
        rows={rows}
        className={cn(
          'w-full px-1.5 py-1 border border-border rounded text-[11px]',
          'bg-background text-foreground resize-y',
          'focus:outline-none focus:ring-1 focus:ring-ring'
        )}
      />
    </div>
  )
}
