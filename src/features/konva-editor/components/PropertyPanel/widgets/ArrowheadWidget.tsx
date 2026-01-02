import { ArrowLeft, ArrowRight, Circle, Diamond, Minus } from 'lucide-react'
import type React from 'react'
import type { ArrowheadWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { ArrowType, LineNode } from '@/types/canvas'
import { cn } from '@/utils/utils'
import { WidgetLabel } from '../shared'
import type { WidgetProps } from './types'

export const ArrowheadWidget: React.FC<WidgetProps<ArrowheadWidgetConfig>> = ({
  config,
  node,
  onChange,
  resolveText,
}) => {
  if (node.t !== 'line') return null
  const lineNode = node as LineNode

  // arrows = [start, end]
  const position = config.props?.position ?? 'end'
  const index = position === 'start' ? 0 : 1
  const currentArrow = lineNode.arrows?.[index] ?? 'none'

  const options: ArrowType[] = ['none', 'arrow', 'circle', 'diamond']

  const handleSelect = (arrowType: ArrowType) => {
    // Ensure arrows array exists and clone it
    const currentArrows = lineNode.arrows ?? ['none', 'none']
    const newArrows: [ArrowType, ArrowType] = [...currentArrows] as [ArrowType, ArrowType]
    newArrows[index] = arrowType
    onChange({ arrows: newArrows } as Partial<LineNode>)
  }

  return (
    <div>
      <WidgetLabel>
        {resolveText(
          config.labelKey ?? `arrow_${position}`,
          position === 'start' ? 'Start Arrow' : 'End Arrow'
        )}
      </WidgetLabel>
      <div className="flex bg-muted rounded p-0.5 border border-border">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            className={cn(
              'flex-1 py-1.5 flex items-center justify-center rounded transition-colors',
              currentArrow === opt
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'hover:bg-accent text-muted-foreground'
            )}
            title={
              opt === 'none'
                ? resolveText('none', 'None')
                : opt === 'arrow'
                  ? resolveText('properties_arrow_standard', 'Standard')
                  : opt === 'circle'
                    ? resolveText('properties_arrow_circle', 'Circle')
                    : resolveText('properties_arrow_diamond', 'Diamond')
            }
          >
            {opt === 'none' && <Minus size={14} />}
            {opt === 'arrow' &&
              (position === 'start' ? <ArrowLeft size={14} /> : <ArrowRight size={14} />)}
            {opt === 'circle' && <Circle size={12} />}
            {opt === 'diamond' && <Diamond size={12} />}
          </button>
        ))}
      </div>
    </div>
  )
}
