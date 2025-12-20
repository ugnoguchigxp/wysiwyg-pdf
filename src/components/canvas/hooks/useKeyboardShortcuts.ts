/**
 * useKeyboardShortcuts Hook
 * Handles keyboard shortcuts for the editor
 */

import { useEffect, useRef } from 'react'
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
  const handlersRef = useRef(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement

      // Check if we're in an input field - if so, skip shortcuts
      if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
        return
      }

      // Allow both Meta (Cmd) and Ctrl keys to be more forgiving
      const ctrlOrCmd = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      const code = e.code

      const currentHandlers = handlersRef.current

      // Undo: Ctrl/Cmd + Z
      if (ctrlOrCmd && !e.shiftKey && (key === 'z' || code === 'KeyZ')) {
        e.preventDefault()
        log.debug('Keyboard shortcut: Undo')
        currentHandlers.onUndo?.()
        return
      }

      // Redo: Ctrl/Cmd + Shift + Z OR Ctrl/Cmd + Y
      if (
        (ctrlOrCmd && e.shiftKey && (key === 'z' || code === 'KeyZ')) ||
        (ctrlOrCmd && (key === 'y' || code === 'KeyY'))
      ) {
        e.preventDefault()
        log.debug('Keyboard shortcut: Redo')
        currentHandlers.onRedo?.()
        return
      }

      // Delete or Backspace: Delete selected item
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        log.debug('Keyboard shortcut: Delete')
        currentHandlers.onDelete?.()
        return
      }

      // Ctrl/Cmd + A: Select All
      if (ctrlOrCmd && e.key === 'a') {
        e.preventDefault()
        log.debug('Keyboard shortcut: Select All')
        currentHandlers.onSelectAll?.()
        return
      }

      // Arrow Keys: Move selected item
      const stepMm = e.shiftKey ? 10 : 1

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        log.debug('Keyboard shortcut: Move Up', { stepMm })
        currentHandlers.onMoveUp?.(stepMm)
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        log.debug('Keyboard shortcut: Move Down', { stepMm })
        currentHandlers.onMoveDown?.(stepMm)
        return
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        log.debug('Keyboard shortcut: Move Left', { stepMm })
        currentHandlers.onMoveLeft?.(stepMm)
        return
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault()
        log.debug('Keyboard shortcut: Move Right', { stepMm })
        currentHandlers.onMoveRight?.(stepMm)
        return
      }

      // Copy: Ctrl/Cmd + C
      if (ctrlOrCmd && (key === 'c' || code === 'KeyC')) {
        e.preventDefault()
        log.debug('Keyboard shortcut: Copy')
        currentHandlers.onCopy?.()
        return
      }

      // Paste: Ctrl/Cmd + V
      if (ctrlOrCmd && (key === 'v' || code === 'KeyV')) {
        e.preventDefault()
        log.debug('Keyboard shortcut: Paste')
        currentHandlers.onPaste?.()
        return
      }
    }

    // Capture phrase might be better to avoid propagation issues?
    // Using capture: true
    window.addEventListener('keydown', handleKeyDown, { capture: true })

    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
    }
  }, []) // Bind once
}
