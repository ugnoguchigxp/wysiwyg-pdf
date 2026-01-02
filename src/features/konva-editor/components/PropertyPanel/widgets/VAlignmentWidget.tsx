import { AlignVerticalJustifyCenter, ArrowDownToLine, ArrowUpToLine } from 'lucide-react'
import type React from 'react'
import type { VAlignmentWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { TextNode } from '@/types/canvas'
import { cn } from '@/utils/utils'
import { WidgetLabel } from '../shared'
import type { WidgetProps } from './types'

type VAlignOption = 't' | 'm' | 'b'

const vAlignIcons: Record<VAlignOption, React.FC<{ size?: number }>> = {
  t: ArrowUpToLine,
  m: AlignVerticalJustifyCenter,
  b: ArrowDownToLine,
}

export const VAlignmentWidget: React.FC<WidgetProps<VAlignmentWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  if (node.t !== 'text') return null
  const textNode = node as TextNode
  const options = config.props?.options ?? (['t', 'm', 'b'] as VAlignOption[])

  return (
    <div>
      {config.labelKey && <WidgetLabel>{resolveText(config.labelKey, 'V-Align')}</WidgetLabel>}
      <div className="flex bg-background rounded border border-border p-0.5">
        {options.map((opt: VAlignOption) => {
          const Icon = vAlignIcons[opt]
          const isActive = (textNode.vAlign || 't') === opt // Default to 't' (top)
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange({ vAlign: opt } as Partial<TextNode>)}
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
