import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

const { debugSpy } = vi.hoisted(() => ({
  debugSpy: vi.fn(),
}))

vi.mock('@/utils/logger', () => ({
  createContextLogger: () => ({
    debug: debugSpy,
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}))

import { useKeyboardShortcuts } from '@/components/canvas/hooks/useKeyboardShortcuts'

describe('useKeyboardShortcuts', () => {
  it('handles editor shortcuts and ignores input targets', () => {
    const onUndo = vi.fn()
    const onRedo = vi.fn()
    const onDelete = vi.fn()
    const onSelectAll = vi.fn()
    const onMoveUp = vi.fn()
    const onMoveDown = vi.fn()
    const onMoveLeft = vi.fn()
    const onMoveRight = vi.fn()
    const onCopy = vi.fn()
    const onPaste = vi.fn()

    renderHook(() =>
      useKeyboardShortcuts({
        onUndo,
        onRedo,
        onDelete,
        onSelectAll,
        onMoveUp,
        onMoveDown,
        onMoveLeft,
        onMoveRight,
        onCopy,
        onPaste,
      })
    )

    // ignored when target is input
    const input = document.createElement('input')
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, bubbles: true }))
    expect(onUndo).not.toHaveBeenCalled()

    // Undo (Meta+Z)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true }))
    expect(onUndo).toHaveBeenCalledTimes(1)

    // Redo (Meta+Shift+Z)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', metaKey: true, shiftKey: true }))
    expect(onRedo).toHaveBeenCalledTimes(1)

    // Redo (Meta+Y)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'y', metaKey: true }))
    expect(onRedo).toHaveBeenCalledTimes(2)

    // Delete
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }))
    expect(onDelete).toHaveBeenCalledTimes(1)

    // Select all
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', metaKey: true }))
    expect(onSelectAll).toHaveBeenCalledTimes(1)

    // Move (Arrow keys + shift)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp', shiftKey: true }))
    expect(onMoveUp).toHaveBeenCalledWith(10)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }))
    expect(onMoveDown).toHaveBeenCalledWith(1)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
    expect(onMoveLeft).toHaveBeenCalledWith(1)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
    expect(onMoveRight).toHaveBeenCalledWith(1)

    // Copy/Paste
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', metaKey: true }))
    expect(onCopy).toHaveBeenCalledTimes(1)
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'v', metaKey: true }))
    expect(onPaste).toHaveBeenCalledTimes(1)

    expect(debugSpy).toHaveBeenCalled()
  })
})
