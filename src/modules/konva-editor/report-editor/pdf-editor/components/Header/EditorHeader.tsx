import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ChevronLeft,
  Undo,
  Redo,
  Download,
  Image as ImageIcon,
  Save,
  CircleHelp,
} from 'lucide-react'

interface EditorHeaderProps {
  templateName: string
  onTemplateNameChange: (name: string) => void
  orientation: 'portrait' | 'landscape'
  onOrientationChange: (orientation: 'portrait' | 'landscape') => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onDownloadImage: () => void
  onDownloadPdf: () => void
  onSave: () => void
  onBack?: () => void
  onShowShortcuts?: () => void
  children?: React.ReactNode
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  templateName,
  onTemplateNameChange,
  orientation,
  onOrientationChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onDownloadImage,
  onDownloadPdf,
  onSave,
  onBack,
  onShowShortcuts,
  children,
}) => {
  const { t } = useTranslation()

  return (
    <div className="px-5 py-3 bg-theme-bg-secondary border-b border-theme-border flex items-center justify-between shrink-0 h-16 transition-colors shadow-sm">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center text-sm font-medium text-theme-text-secondary hover:text-theme-text-primary transition-colors"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </button>

        <div className="h-6 w-px bg-theme-border" />

        <input
          type="text"
          value={templateName}
          onChange={(e) => onTemplateNameChange(e.target.value)}
          className="border border-theme-border rounded-md px-3 py-1.5 text-sm w-64 bg-theme-bg-primary text-theme-text-primary focus:outline-none focus:ring-1 focus:ring-theme-object-primary transition-colors"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* Orientation Select */}
        <div className="flex items-center gap-2 border border-theme-border rounded-md px-2 py-1 bg-theme-bg-primary">
          <span className="text-xs font-medium text-theme-text-secondary">
            {t('editor_orientation')}:
          </span>
          <select
            value={orientation}
            onChange={(e) => onOrientationChange(e.target.value as 'portrait' | 'landscape')}
            className="text-xs bg-transparent border-none focus:ring-0 text-theme-text-primary cursor-pointer outline-none"
          >
            <option value="portrait">{t('orientations_portrait')}</option>
            <option value="landscape">{t('orientations_landscape')}</option>
          </select>
        </div>

        <div className="h-6 w-px bg-theme-border mx-1" />

        {/* History Controls */}
        <button
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-md hover:bg-theme-bg-tertiary text-theme-text-secondary disabled:opacity-30 transition-colors"
          title={t('toolbar_undo')}
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-md hover:bg-theme-bg-tertiary text-theme-text-secondary disabled:opacity-30 transition-colors"
          title={t('toolbar_redo')}
        >
          <Redo className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-theme-border mx-1" />

        <button
          onClick={onShowShortcuts}
          className="p-2 rounded-md hover:bg-theme-bg-tertiary text-theme-text-secondary transition-colors"
          title={t('toolbar_shortcuts')}
        >
          <CircleHelp className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-theme-border mx-1" />

        {/* Actions */}
        <button
          onClick={onDownloadImage}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-theme-text-primary hover:bg-theme-bg-tertiary rounded-md border border-theme-border transition-colors shadow-sm"
        >
          <ImageIcon className="w-4 h-4" />
          Image
        </button>

        <button
          onClick={onDownloadPdf}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-theme-text-primary hover:bg-theme-bg-tertiary rounded-md border border-theme-border transition-colors shadow-sm"
        >
          <Download className="w-4 h-4" />
          PDF
        </button>

        <button
          onClick={onSave}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-theme-object-primary hover:bg-theme-object-primary/90 rounded-md shadow-sm transition-colors"
        >
          <Save className="w-4 h-4" />
          {t('save')}
        </button>

        {/* Custom Actions (e.g. Theme Toggle) */}
        {children}
      </div>
    </div>
  )
}
