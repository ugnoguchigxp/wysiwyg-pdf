import React from 'react'

export type Translator = (key: string, fallback?: string) => string

export const defaultT: Translator = (key, fallback) => fallback ?? key

type I18nContextValue = {
  t: Translator
}

const I18nContext = React.createContext<I18nContextValue>({ t: defaultT })

export const I18nProvider: React.FC<{
  t?: Translator
  children: React.ReactNode
}> = ({ t, children }) => {
  const value = React.useMemo(() => ({ t: t ?? defaultT }), [t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export const useI18n = (): I18nContextValue => {
  return React.useContext(I18nContext)
}
