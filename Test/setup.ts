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
