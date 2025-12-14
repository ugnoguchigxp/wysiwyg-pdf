import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  Undo,
  Redo,
  Download,
  Image as ImageIcon,
  Save,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'

export interface EditorHeaderProps {
  templateName: string
  onTemplateNameChange: (name: string) => void
  orientation: string
  onOrientationChange: (orientation: 'portrait' | 'landscape') => void
  orientationOptions?: { label: string; value: string }[]
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onDownloadImage: () => void
  onDownloadPdf: () => void
  onSave: () => void
  onBack?: () => void
  onShowShortcuts?: () => void
  onSettingsClick?: () => void
  children?: React.ReactNode
  i18nOverrides?: Record<string, string>
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  templateName,
  onTemplateNameChange,
  orientation,
  onOrientationChange,
  orientationOptions,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDownloadImage,
  onDownloadPdf,
  onSave,
  onBack,
  onShowShortcuts,
  onSettingsClick,
  children,
  i18nOverrides,
}) => {
  const { t } = useTranslation()

  // Helper to resolve translation: Override -> i18next -> Default
  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides && i18nOverrides[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  const defaultOptions = [
    { label: resolveText('orientations_portrait', 'Portrait'), value: 'portrait' },
    { label: resolveText('orientations_landscape', 'Landscape'), value: 'landscape' },
  ]

  const currentOptions = orientationOptions || defaultOptions

  return (
    <div className="px-5 py-3 bg-theme-bg-secondary border-b border-theme-border flex items-center justify-between shrink-0 h-16 transition-colors shadow-sm">
      <div className="flex items-center gap-4 min-w-0 flex-1 mr-4">
        <button
          onClick={onBack}
          className="flex items-center text-sm font-medium text-theme-text-secondary hover:text-theme-text-primary transition-colors whitespace-nowrap shrink-0"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {resolveText('back', 'Back')}
        </button>

        <div className="h-6 w-px bg-theme-border shrink-0" />

        <input
          type="text"
          value={templateName}
          onChange={(e) => onTemplateNameChange(e.target.value)}
          className="border border-theme-border rounded-md px-3 py-1.5 text-sm w-full max-w-64 bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-object-primary transition-colors min-w-[50px]"
        />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Orientation Select */}
        <div className="flex items-center gap-2 border border-theme-border rounded-md px-2 py-1 bg-theme-bg-primary">
          <span className="text-xs font-medium text-theme-text-secondary whitespace-nowrap">
            {resolveText('editor_orientation', 'Orientation')}:
          </span>
          <select
            value={orientation}
            onChange={(e) => onOrientationChange(e.target.value as 'portrait' | 'landscape')}
            className="text-xs bg-transparent border-none focus:ring-0 text-theme-text-primary cursor-pointer outline-none"
          >
            {currentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="h-6 w-px bg-theme-border mx-1" />

        {/* History Controls */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-md hover:bg-theme-bg-tertiary text-theme-text-secondary disabled:opacity-30 transition-colors"
          title={resolveText('toolbar_undo', 'Undo')}
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-md hover:bg-theme-bg-tertiary text-theme-text-secondary disabled:opacity-30 transition-colors"
          title={resolveText('toolbar_redo', 'Redo')}
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-theme-border mx-1" />

        <Button
          variant="circle-help"
          size="circle"
          onClick={onShowShortcuts}
          title={resolveText('toolbar_shortcuts', 'Shortcuts')}
        >
          ?
        </Button>

        <div className="h-6 w-px bg-theme-border mx-1" />

        {/* Actions */}
        <button
          onClick={onDownloadImage}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-theme-text-primary hover:bg-theme-bg-tertiary rounded-md border border-theme-border transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
        >
          <ImageIcon className="w-4 h-4" />
          {resolveText('header_image', 'Image')}
        </button>

        <button
          onClick={onDownloadPdf}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-theme-text-primary hover:bg-theme-bg-tertiary rounded-md border border-theme-border transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          {resolveText('header_pdf', 'PDF')}
        </button>

        <button
          onClick={onSave}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-theme-object-primary hover:bg-theme-object-primary/90 rounded-md shadow-sm transition-colors whitespace-nowrap flex-shrink-0"
        >
          <Save className="w-4 h-4" />
          {resolveText('save', 'Save')}
        </button>

        {onSettingsClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className="text-theme-text-secondary hover:text-theme-text-primary"
            title={resolveText('header_settings', 'Settings')}
          >
            <Settings2 className="w-5 h-5" />
          </Button>
        )}

        {/* Custom Actions (e.g. Theme Toggle) */}
        {children}
      </div>
    </div>
  )
}
