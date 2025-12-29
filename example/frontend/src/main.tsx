import { StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { useTranslation } from 'react-i18next'
import { I18nProvider, TooltipProvider, type Translator } from 'wysiwyg-pdf'
import './index.css'
import './i18n'
import App from './App.tsx'

function WysiwygPdfI18nBridge({ children }: { children: ReactNode }) {
  const { t } = useTranslation()

  const translator: Translator = (key, fallback) => {
    return String(
      t(key, {
        defaultValue: fallback ?? key,
      })
    )
  }

  return <I18nProvider t={translator}>{children}</I18nProvider>
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <WysiwygPdfI18nBridge>
        <App />
      </WysiwygPdfI18nBridge>
    </TooltipProvider>
  </StrictMode>
)
