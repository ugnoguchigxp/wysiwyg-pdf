import type React from 'react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
} from 'lucide-react'
import type { AlignmentWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { TextNode } from '@/types/canvas'
import { cn } from '@/utils/utils'
import { WidgetLabel } from '../shared'
import type { WidgetProps } from './types'

type AlignOption = 'l' | 'c' | 'r' | 'j'

const alignIcons: Record<AlignOption, React.FC<{ size?: number }>> = {
  l: AlignLeft,
  c: AlignCenter,
  r: AlignRight,
  j: AlignJustify,
}

export const AlignmentWidget: React.FC<WidgetProps<AlignmentWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  if (node.t !== 'text') return null
  const textNode = node as TextNode
  const options = config.props?.options ?? (['l', 'c', 'r'] as AlignOption[])

  return (
    <div>
      {config.labelKey && <WidgetLabel>{resolveText(config.labelKey, 'Align')}</WidgetLabel>}
      <div className="flex bg-background rounded border border-border p-0.5">
        {options.map((opt: AlignOption) => {
          const Icon = alignIcons[opt]
          const isActive = textNode.align === opt
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange({ align: opt } as Partial<TextNode>)}
              className={cn(
                'flex-1 py-1 flex justify-center rounded transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-muted-foreground'
              )}
            >
              <Icon size={14} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
