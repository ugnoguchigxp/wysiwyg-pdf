import { Keyboard } from 'lucide-react'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, ModalFooter } from '@/components/ui/Modal'

interface ShortcutHelpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ShortcutHelpModal: React.FC<ShortcutHelpModalProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation()

  const shortcuts = [
    { key: t('shortcut_undo'), cmd: 'Ctrl/Cmd + Z' },
    { key: t('shortcut_redo'), cmd: 'Ctrl/Cmd + Shift + Z / Ctrl + Y' },
    { key: t('shortcut_copy'), cmd: 'Ctrl/Cmd + C' },
    { key: t('shortcut_paste'), cmd: 'Ctrl/Cmd + V' },
    { key: t('shortcut_delete'), cmd: 'Delete / Backspace' },
    { key: t('shortcut_select_all'), cmd: 'Ctrl/Cmd + A' },
    { key: t('shortcut_move'), cmd: 'Arrow Keys' },
    { key: t('shortcut_move_fast'), cmd: 'Shift + Arrow Keys' },
  ]

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('shortcut_title')}
      description={t('shortcut_description')}
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-theme-text-secondary mb-4">
          <Keyboard className="w-5 h-5" />
          <span className="text-sm">{t('shortcut_helper_text')}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-x-8 gap-y-3">
          {shortcuts.map((s, i) => (
            <React.Fragment key={i}>
              <div className="text-sm font-medium text-theme-text-primary">{s.key}</div>
              <div className="text-xs font-mono bg-theme-bg-tertiary px-2 py-1 rounded border border-theme-border text-theme-text-secondary self-center">
                {s.cmd}
              </div>
              <div className="col-span-2 h-px bg-theme-border/50 last:hidden" />
            </React.Fragment>
          ))}
        </div>
      </div>

      <ModalFooter>
        <button
          onClick={() => onOpenChange(false)}
          className="px-4 py-2 text-sm font-medium text-white bg-theme-object-primary hover:bg-theme-object-primary/90 rounded-md transition-colors"
        >
          {t('close')}
        </button>
      </ModalFooter>
    </Modal>
  )
}
