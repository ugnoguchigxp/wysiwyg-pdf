import type React from 'react'
import type { DataBindingWidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { WidgetProps } from './types'

export const DataBindingWidget: React.FC<WidgetProps<DataBindingWidgetConfig>> = ({
  config,
  resolveText,
}) => {
  // Placeholder implementation
  return (
    <div className="text-xs text-muted-foreground italic">
      {config.props?.mode === 'repeater'
        ? resolveText('data_binding_repeater', 'Repeater Binding')
        : resolveText('data_binding_field', 'Field Binding')}{' '}
      {resolveText('wip', '(WIP)')}
    </div>
  )
}
