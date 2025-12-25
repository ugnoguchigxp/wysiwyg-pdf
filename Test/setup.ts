import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'
import React from 'react'

// Radix UI (and friends) rely on these browser APIs.
if (!globalThis.ResizeObserver) {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

if (!HTMLElement.prototype.scrollIntoView) {
  HTMLElement.prototype.scrollIntoView = () => {}
}

{
  const originalWarn = console.warn
  const originalError = console.error
  const originalLog = console.log

  console.warn = (...args: unknown[]) => {
    const msg = args.map((a) => String(a)).join(' ')
    if (msg.includes('Missing `Description` or `aria-describedby')) return
    if (msg.includes('unrecognized in this browser')) return
    return originalWarn(...args)
  }

  console.error = (...args: unknown[]) => {
    const msg = args.map((a) => String(a)).join(' ')
    if (msg.includes('unrecognized in this browser')) return
    return originalError(...args)
  }

  console.log = (...args: unknown[]) => {
    const msg = String(args[0] ?? '')
    if (msg.includes('Signature Lines Object (Optimized)')) return
    return originalLog(...args)
  }
}

{
  const stderrAny = process.stderr as any
  const originalWrite = stderrAny.write.bind(process.stderr)
  stderrAny.write = (chunk: any, ...rest: any[]) => {
    const msg = typeof chunk === 'string' ? chunk : chunk?.toString?.() ?? ''
    if (msg.includes('unrecognized in this browser')) return true
    return originalWrite(chunk, ...rest)
  }
}

{
  const originalGetContext = HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = function (
    contextId: string,
    ...args: unknown[]
  ): any {
    if (contextId === '2d') {
      return {
        font: '',
        measureText: (text: string) => ({ width: (text?.length ?? 0) * 10 }),
        scale: () => {},
        setTransform: () => {},
        save: () => {},
        restore: () => {},
        clearRect: () => {},
        fillRect: () => {},
        getImageData: () => ({ data: [0, 0, 0, 0] }),
      }
    }

    try {
      const ctx = originalGetContext?.call(this, contextId, ...(args as any[]))
      if (ctx) return ctx
    } catch {
      // ignore jsdom "not implemented" errors
    }
    return null
  }
}

vi.mock('@/i18n/I18nContext', () => {
  type Translator = (key: string, _fallback?: string) => string

  const defaultT: Translator = (key) => key

  const I18nProvider = ({ children }: { t?: Translator; children: React.ReactNode }) => {
    return React.createElement(React.Fragment, null, children)
  }

  const useI18n = () => {
    return { t: defaultT }
  }

  return {
    I18nProvider,
    useI18n,
    defaultT,
  }
})
