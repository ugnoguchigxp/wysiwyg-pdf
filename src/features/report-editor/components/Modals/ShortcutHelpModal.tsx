import { Keyboard } from 'lucide-react'
import React from 'react'
import { Modal, ModalFooter } from '@/components/ui/Modal'
import { useI18n } from '@/i18n/I18nContext'

interface ShortcutHelpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const ShortcutHelpModal: React.FC<ShortcutHelpModalProps> = ({ open, onOpenChange }) => {
  const { t } = useI18n()

  const shortcuts = [
    { key: t('shortcut_undo', 'Undo'), cmd: 'Ctrl/Cmd + Z' },
    { key: t('shortcut_redo', 'Redo'), cmd: 'Ctrl/Cmd + Shift + Z / Ctrl + Y' },
    { key: t('shortcut_copy', 'Copy'), cmd: 'Ctrl/Cmd + C' },
    { key: t('shortcut_paste', 'Paste'), cmd: 'Ctrl/Cmd + V' },
    { key: t('shortcut_delete', 'Delete'), cmd: 'Delete / Backspace' },
    { key: t('shortcut_select_all', 'Select All'), cmd: 'Ctrl/Cmd + A' },
    { key: t('shortcut_move', 'Move'), cmd: 'Arrow Keys' },
    { key: t('shortcut_move_fast', 'Move (Fast)'), cmd: 'Shift + Arrow Keys' },
    { key: t('shortcut_rotate_snap', 'Snap rotation (45°)'), cmd: 'Hold Shift while rotating' },
  ]

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={t('shortcut_title', 'Keyboard Shortcuts')}
      description={t('shortcut_description', 'List of available keyboard shortcuts.')}
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground mb-4">
          <Keyboard className="w-5 h-5" />
          <span className="text-sm">{t('shortcut_helper_text', 'Available shortcuts')}</span>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-x-8 gap-y-3">
          {shortcuts.map((s, i) => (
            <React.Fragment key={i}>
              <div className="text-sm font-medium text-foreground">{s.key}</div>
              <div className="text-xs font-mono bg-muted px-2 py-1 rounded border border-border text-muted-foreground self-center">
                {s.cmd}
              </div>
              <div className="col-span-2 h-px bg-border/50 last:hidden" />
            </React.Fragment>
          ))}
        </div>
      </div>

      <ModalFooter>
        <button
          onClick={() => onOpenChange(false)}
          className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
        >
          {t('close', 'Close')}
        </button>
      </ModalFooter>
    </Modal>
  )
}
