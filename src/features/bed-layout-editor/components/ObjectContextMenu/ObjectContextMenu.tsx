import { ArrowDown, ArrowUp, BringToFront, SendToBack } from 'lucide-react'
import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '@/i18n/I18nContext'

interface ObjectContextMenuProps {
  visible: boolean
  x: number
  y: number
  onClose: () => void
  onAction: (action: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward') => void
}

export const ObjectContextMenu: React.FC<ObjectContextMenuProps> = ({
  visible,
  x,
  y,
  onClose,
  onAction,
}) => {
  const { t } = useI18n()
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ x, y })

  const handleAction = (
    action: 'bringToFront' | 'sendToBack' | 'bringForward' | 'sendBackward'
  ) => {
    onAction(action)
    onClose()
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside)
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect()
        const windowWidth = window.innerWidth
        const windowHeight = window.innerHeight
        let adjustedX = x
        let adjustedY = y

        if (x + rect.width > windowWidth) {
          adjustedX = windowWidth - rect.width - 8
        }
        if (y + rect.height > windowHeight) {
          adjustedY = windowHeight - rect.height - 8
        }

        if (adjustedX !== x || adjustedY !== y) {
          setPosition({ x: adjustedX, y: adjustedY })
        }
      }
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visible, onClose, x, y])

  useEffect(() => {
    if (visible) {
      setPosition({ x, y })
    }
  }, [x, y, visible])

  if (!visible) return null

  const itemClass =
    'flex items-center w-full px-3 py-2 text-sm text-left hover:bg-accent text-foreground gap-2 cursor-pointer'

  return createPortal(
    <div
      ref={ref}
      className="fixed z-50 bg-popover text-popover-foreground border border-border rounded shadow-lg w-48 py-1"
      style={{ top: position.y, left: position.x }}
      onContextMenu={(e) => e.preventDefault()}
      role="menu"
      tabIndex={-1}
    >
      <button type="button" onClick={() => handleAction('bringToFront')} className={itemClass}>
        <BringToFront className="w-4 h-4" />
        {t('ctx_bring_to_front', '最前面へ移動')}
      </button>
      <button type="button" onClick={() => handleAction('sendToBack')} className={itemClass}>
        <SendToBack className="w-4 h-4" />
        {t('ctx_send_to_back', '最背面へ移動')}
      </button>
      <div className="my-1 border-t border-border" />
      <button type="button" onClick={() => handleAction('bringForward')} className={itemClass}>
        <ArrowUp className="w-4 h-4" />
        {t('ctx_bring_forward', '前面へ移動')}
      </button>
      <button type="button" onClick={() => handleAction('sendBackward')} className={itemClass}>
        <ArrowDown className="w-4 h-4" />
        {t('ctx_send_backward', '背面へ移動')}
      </button>
    </div>,
    document.body
  )
}
