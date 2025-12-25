import type React from 'react'
import type { LineStyleWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { LineNode } from '@/types/canvas'
import { cn } from '@/utils/utils'
import { WidgetLabel } from '../shared'
import type { WidgetProps } from './types'

type LineStyleOption = 'solid' | 'dashed' | 'dotted'

export const LineStyleWidget: React.FC<WidgetProps<LineStyleWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  const lineNode = node as LineNode
  const options = config.props?.options ?? (['solid', 'dashed', 'dotted'] as LineStyleOption[])

  const getStyleFromDash = (dash?: number[]): string => {
    if (!dash || dash.length === 0) return 'solid'
    if (dash[0] !== undefined && dash[0] < 1) return 'dotted'
    return 'dashed'
  }

  const getDashFromStyle = (style: string): number[] | undefined => {
    if (style === 'dashed') return [3, 3]
    if (style === 'dotted') return [0.001, 2]
    return undefined
  }

  const currentStyle = getStyleFromDash(lineNode.dash)

  return (
    <div>
      <WidgetLabel>{resolveText(config.labelKey ?? 'properties_line_style', 'Style')}</WidgetLabel>
      <div className="flex gap-1">
        {options.map((style: LineStyleOption) => (
          <button
            key={style}
            type="button"
            onClick={() => onChange({ dash: getDashFromStyle(style) })}
            className={cn(
              'flex-1 py-1.5 px-2 rounded border text-[10px]',
              currentStyle === style
                ? 'bg-accent text-accent-foreground border-border'
                : 'bg-background text-muted-foreground border-border hover:bg-muted'
            )}
          >
            {style === 'solid' && <div className="w-full h-0.5 bg-current" />}
            {style === 'dashed' && (
              <div className="w-full h-0.5 border-b-2 border-dashed border-current" />
            )}
            {style === 'dotted' && (
              <div className="w-full h-0.5 border-b-2 border-dotted border-current" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
