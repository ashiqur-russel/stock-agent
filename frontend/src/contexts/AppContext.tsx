'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { type Lang, type TranslationKey, t as translate } from '@/lib/i18n'

type Currency = 'EUR' | 'USD'

interface AppCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey) => string
  currency: Currency
  setCurrency: (c: Currency) => void
  formatPrice: (eur: number, usd?: number) => string
  currencySymbol: string
}

const AppContext = createContext<AppCtx | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')
  const [currency, setCurrencyState] = useState<Currency>('EUR')

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Lang | null
    const savedCurrency = localStorage.getItem('app_currency') as Currency | null
    if (savedLang === 'en' || savedLang === 'de') setLangState(savedLang)
    if (savedCurrency === 'EUR' || savedCurrency === 'USD') setCurrencyState(savedCurrency)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('app_lang', l)
  }

  const setCurrency = (c: Currency) => {
    setCurrencyState(c)
    localStorage.setItem('app_currency', c)
  }

  const currencySymbol = currency === 'EUR' ? '€' : '$'

  const formatPrice = (eur: number, usd?: number): string => {
    const val = currency === 'USD' ? (usd ?? eur / 0.91) : eur
    return `${currencySymbol}${val.toFixed(2)}`
  }

  const t = (key: TranslationKey) => translate(key, lang)

  return (
    <AppContext.Provider value={{ lang, setLang, t, currency, setCurrency, formatPrice, currencySymbol }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppCtx {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
