import type React from 'react'
import { useTranslation } from 'react-i18next'
import {
  EditorHeader,
  type EditorHeaderProps,
} from '@/features/report-editor/components/Header/EditorHeader'

export const BedLayoutHeader: React.FC<EditorHeaderProps> = (props) => {
  const { t } = useTranslation()
  const { i18nOverrides } = props

  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides?.[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  return (
    <EditorHeader
      {...props}
      orientationOptions={[
        { label: resolveText('orientations_portrait', 'Portrait'), value: 'portrait' },
        { label: resolveText('orientations_landscape', 'Landscape'), value: 'landscape' },
        { label: resolveText('orientations_square', 'Square'), value: 'square' },
      ]}
    />
  )
}
