"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { type Locale } from "@/lib/i18n"

const LOCALE_KEY = "eticksystem_locale"
const DEFAULT_LOCALE: Locale = "az"

interface LocaleContextType {
  locale:    Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextType>({
  locale:    DEFAULT_LOCALE,
  setLocale: () => {},
})

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  // Load saved locale on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALE_KEY) as Locale | null
      if (saved && ["az", "en", "ru", "tr"].includes(saved)) {
        setLocaleState(saved)
      }
    } catch {
      // localStorage not available (SSR or private mode)
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem(LOCALE_KEY, newLocale)
    } catch {
      // ignore
    }
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {children}
    </LocaleContext.Provider>
  )
}

export function useLocale() {
  return useContext(LocaleContext)
}