import {
  ChevronLeft,
  Download,
  Image as ImageIcon,
  Redo,
  Save,
  Settings2,
  Undo,
} from 'lucide-react'
import type React from 'react'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/i18n/I18nContext'

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
  loadMenu?: React.ReactNode
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
  loadMenu,
  children,
  i18nOverrides,
}) => {
  const { t } = useI18n()

  // Helper to resolve translation: Override -> i18next -> Default
  const resolveText = (key: string, defaultValue?: string) => {
    if (i18nOverrides?.[key]) return i18nOverrides[key]
    return t(key, defaultValue ?? key)
  }

  const defaultOptions = [
    { label: resolveText('orientations_portrait', 'Portrait'), value: 'portrait' },
    { label: resolveText('orientations_landscape', 'Landscape'), value: 'landscape' },
  ]

  const currentOptions = orientationOptions || defaultOptions

  return (
    <div className="px-5 py-3 bg-secondary border-b border-border flex items-center justify-between shrink-0 h-16 transition-colors shadow-sm">
      <div className="flex items-center gap-4 min-w-0 flex-1 mr-4">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap shrink-0"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          {resolveText('back', 'Back')}
        </button>

        <div className="h-6 w-px bg-border shrink-0" />

        <input
          type="text"
          value={templateName}
          onChange={(e) => onTemplateNameChange(e.target.value)}
          className="border border-border rounded-md px-3 py-1.5 text-sm w-full max-w-64 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-colors min-w-[50px]"
        />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Orientation Select */}
        <div className="flex items-center gap-2 border border-border rounded-md px-2 py-1 bg-background">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {resolveText('editor_orientation', 'Orientation')}:
          </span>
          <select
            value={orientation}
            onChange={(e) => onOrientationChange(e.target.value as 'portrait' | 'landscape')}
            className="text-xs bg-transparent border-none focus:ring-0 text-foreground cursor-pointer outline-none"
          >
            {currentOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="h-6 w-px bg-border mx-1" />

        {/* History Controls */}
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-30 transition-colors"
          title={resolveText('toolbar_undo', 'Undo')}
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-md hover:bg-accent text-muted-foreground disabled:opacity-30 transition-colors"
          title={resolveText('toolbar_redo', 'Redo')}
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-border mx-1" />

        <Button
          variant="circle-help"
          size="circle"
          onClick={onShowShortcuts}
          title={resolveText('toolbar_shortcuts', 'Shortcuts')}
        >
          ?
        </Button>

        <div className="h-6 w-px bg-border mx-1" />

        {/* Actions */}
        <button
          type="button"
          onClick={onDownloadImage}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent rounded-md border border-border transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
        >
          <ImageIcon className="w-4 h-4" />
          {resolveText('header_image', 'Image')}
        </button>

        <button
          type="button"
          onClick={onDownloadPdf}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent rounded-md border border-border transition-colors shadow-sm whitespace-nowrap flex-shrink-0"
        >
          <Download className="w-4 h-4" />
          {resolveText('header_pdf', 'PDF')}
        </button>

        <div className="h-6 w-px bg-border mx-1" />

        {/* [Load] [Save] order */}
        {loadMenu}

        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md shadow-sm transition-colors whitespace-nowrap flex-shrink-0"
        >
          <Save className="w-4 h-4" />
          {resolveText('save', 'Save')}
        </button>

        <div className="h-6 w-px bg-border mx-1" />

        {onSettingsClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSettingsClick}
            className="text-muted-foreground hover:text-foreground"
            title={resolveText('header_settings', 'Settings')}
          >
            <Settings2 className="w-5 h-5" />
          </Button>
        )}

        {/* Custom Actions (e.g. Dashboard, DarkMode switches) rendered AFTER Save */}
        {children}
      </div>
    </div>
  )
}
