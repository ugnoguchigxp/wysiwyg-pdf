import type React from 'react'
import type { WidgetConfig } from '@/features/konva-editor/constants/propertyPanelConfig'
import type { UnifiedNode } from '@/types/canvas'
import { AlignmentWidget } from './AlignmentWidget'
import { ArrowheadWidget } from './ArrowheadWidget'
import { BorderWidget } from './BorderWidget'
import { CheckboxWidget } from './CheckboxWidget'
import { ColorPickerWidget } from './ColorPickerWidget'
import { DataBindingWidget } from './DataBindingWidget'
import { FillWidget } from './FillWidget'
import { FontWidget } from './FontWidget'
import { ImageWidget } from './ImageWidget'
import { LabelFieldWidget } from './LabelFieldWidget'
import { LineStyleWidget } from './LineStyleWidget'
import { ListWidget } from './ListWidget'
import { NumberInputWidget } from './NumberInputWidget'
import { PolygonWidget } from './PolygonWidget'
import { PosSizeWidget } from './PosSizeWidget'
import { SelectWidget } from './SelectWidget'
import { SliderWidget } from './SliderWidget'
import { StrokeWidget } from './StrokeWidget'
import { TextContentWidget } from './TextContentWidget'
import type { WidgetProps } from './types'
import { VAlignmentWidget } from './VAlignmentWidget'

export const renderWidget = (
  config: WidgetConfig,
  node: UnifiedNode,
  onChange: (updates: Partial<UnifiedNode>, options?: { saveToHistory?: boolean }) => void,
  resolveText: (key: string, fallback?: string) => string,
  customRenderers?: Record<string, React.FC<WidgetProps>>
) => {
  const commonProps = { node, onChange, resolveText }

  switch (config.type) {
    case 'posSize':
      return <PosSizeWidget {...commonProps} config={config} />
    case 'font':
      return <FontWidget {...commonProps} config={config} />
    case 'alignment':
      return <AlignmentWidget {...commonProps} config={config} />
    case 'vAlignment':
      return <VAlignmentWidget {...commonProps} config={config} />
    case 'stroke':
      return <StrokeWidget {...commonProps} config={config} />
    case 'fill':
      return <FillWidget {...commonProps} config={config} />
    case 'border':
      return <BorderWidget {...commonProps} config={config} />
    case 'polygon':
      return <PolygonWidget {...commonProps} config={config} />
    case 'image':
      return <ImageWidget {...commonProps} config={config} />
    case 'select':
      return <SelectWidget {...commonProps} config={config} />
    case 'colorPicker':
      return <ColorPickerWidget {...commonProps} config={config} />
    case 'slider':
      return <SliderWidget {...commonProps} config={config} />
    case 'textContent':
      return <TextContentWidget {...commonProps} config={config} />
    case 'lineStyle':
      return <LineStyleWidget {...commonProps} config={config} />
    case 'arrowhead':
      return <ArrowheadWidget {...commonProps} config={config} />
    case 'labelField':
      return <LabelFieldWidget {...commonProps} config={config} />
    case 'hiddenField':
      return null
    case 'dataBinding':
      return <DataBindingWidget {...commonProps} config={config} />
    case 'numberInput':
      return <NumberInputWidget {...commonProps} config={config} />
    case 'checkbox':
      return <CheckboxWidget {...commonProps} config={config} />
    case 'list':
      return <ListWidget {...commonProps} config={config} />
    case 'custom':
      if (customRenderers?.[config.props.renderKey]) {
        const CustomComponent = customRenderers[config.props.renderKey]
        return <CustomComponent {...commonProps} config={config} />
      }
      return null
    default:
      return (
        <div className="text-xs text-red-500">
          Unknown widget type: {(config as { type?: string }).type}
        </div>
      )
  }
}
