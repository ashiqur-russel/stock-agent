'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { type Lang, type TranslationKey, t as translate } from '@/lib/i18n'
import {
  getDefaultMarketRegion,
  type MarketRegion,
  MARKET_REGION_STORAGE_KEY,
  readMarketRegionFromStorage,
} from '@/lib/marketHours'

type Currency = 'EUR' | 'USD'

interface AppCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: TranslationKey) => string
  currency: Currency
  setCurrency: (c: Currency) => void
  marketRegion: MarketRegion
  setMarketRegion: (m: MarketRegion) => void
  formatPrice: (eur: number, usd?: number) => string
  currencySymbol: string
}

const AppContext = createContext<AppCtx | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('en')
  const [currency, setCurrencyState] = useState<Currency>('EUR')
  const [marketRegion, setMarketRegionState] = useState<MarketRegion>(getDefaultMarketRegion)

  useEffect(() => {
    const savedLang = localStorage.getItem('app_lang') as Lang | null
    const savedCurrency = localStorage.getItem('app_currency') as Currency | null
    const savedRegion = readMarketRegionFromStorage()
    if (savedLang === 'en' || savedLang === 'de') setLangState(savedLang)
    if (savedCurrency === 'EUR' || savedCurrency === 'USD') setCurrencyState(savedCurrency)
    if (savedRegion) setMarketRegionState(savedRegion)
  }, [])

  const setLang = (l: Lang) => {
    setLangState(l)
    localStorage.setItem('app_lang', l)
  }

  const setCurrency = (c: Currency) => {
    setCurrencyState(c)
    localStorage.setItem('app_currency', c)
  }

  const setMarketRegion = (m: MarketRegion) => {
    setMarketRegionState(m)
    localStorage.setItem(MARKET_REGION_STORAGE_KEY, m)
  }

  const currencySymbol = currency === 'EUR' ? '€' : '$'

  const formatPrice = (eur: number, usd?: number): string => {
    const val = currency === 'USD' ? (usd ?? eur / 0.91) : eur
    return `${currencySymbol}${val.toFixed(2)}`
  }

  const t = (key: TranslationKey) => translate(key, lang)

  return (
    <AppContext.Provider
      value={{
        lang,
        setLang,
        t,
        currency,
        setCurrency,
        marketRegion,
        setMarketRegion,
        formatPrice,
        currencySymbol,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppCtx {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
