/**
 * useKeyboardShortcuts Hook
 * Handles keyboard shortcuts for the editor
 */

import { useEffect } from 'react'
import { createContextLogger } from '../../../utils/logger'

const log = createContextLogger('useKeyboardShortcuts')

interface IKeyboardShortcutsHandlers {
  onUndo?: () => void
  onRedo?: () => void
  onDelete?: () => void
  onSelectAll?: () => void
  onMoveUp?: (step: number) => void
  onMoveDown?: (step: number) => void
  onMoveLeft?: (step: number) => void
  onMoveRight?: (step: number) => void
  onCopy?: () => void
  onPaste?: () => void
}

export const useKeyboardShortcuts = (handlers: IKeyboardShortcutsHandlers): void => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in an input field - if so, skip shortcuts
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return
      }

      // Allow both Meta (Cmd) and Ctrl keys to be more forgiving
      const ctrlOrCmd = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      const code = e.code

      // Undo: Ctrl/Cmd + Z
      if (ctrlOrCmd && !e.shiftKey && (key === 'z' || code === 'KeyZ')) {
        e.preventDefault()
        log.debug('Keyboard shortcut: Undo')
        handlers.onUndo?.()
        return
      }

      // Redo: Ctrl/Cmd + Shift + Z OR Ctrl/Cmd + Y
      if (
        (ctrlOrCmd && e.shiftKey && (key === 'z' || code === 'KeyZ')) ||
        (ctrlOrCmd && (key === 'y' || code === 'KeyY'))
      ) {
        e.preventDefault()
        log.debug('Keyboard shortcut: Redo')
        handlers.onRedo?.()
        return
      }

      // Delete or Backspace: Delete selected item
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        log.debug('Keyboard shortcut: Delete')
        handlers.onDelete?.()
        return
      }

      // Ctrl/Cmd + A: Select All
      if (ctrlOrCmd && e.key === 'a') {
        e.preventDefault()
        log.debug('Keyboard shortcut: Select All')
        handlers.onSelectAll?.()
        return
      }

      // Arrow Keys: Move selected item
      const step = e.shiftKey ? 10 : 1

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        log.debug('Keyboard shortcut: Move Up', { step })
        handlers.onMoveUp?.(step)
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        log.debug('Keyboard shortcut: Move Down', { step })
        handlers.onMoveDown?.(step)
        return
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        log.debug('Keyboard shortcut: Move Left', { step })
        handlers.onMoveLeft?.(step)
        return
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        log.debug('Keyboard shortcut: Move Right', { step })
        handlers.onMoveRight?.(step)
        return
      }

      // Copy: Ctrl/Cmd + C
      if (ctrlOrCmd && (key === 'c' || code === 'KeyC')) {
        e.preventDefault()
        log.debug('Keyboard shortcut: Copy')
        handlers.onCopy?.()
        return
      }

      // Paste: Ctrl/Cmd + V
      if (ctrlOrCmd && (key === 'v' || code === 'KeyV')) {
        e.preventDefault()
        log.debug('Keyboard shortcut: Paste')
        handlers.onPaste?.()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handlers])
}
