'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { type Lang, type TranslationKey, t as translate } from '@/lib/i18n'
import { getToken, settings } from '@/lib/api'
import { AUTH_SESSION_EVENT } from '@/lib/authEvents'
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

  // When logged in, server-backed `market_region` is the source of truth (overrides localStorage).
  useEffect(() => {
    const loadMarketRegionFromServer = () => {
      if (typeof window === 'undefined' || !getToken()) return
      settings
        .getPreferences()
        .then((p) => {
          if (p.market_region === 'DE' || p.market_region === 'US') {
            setMarketRegionState(p.market_region)
            localStorage.setItem(MARKET_REGION_STORAGE_KEY, p.market_region)
          }
        })
        .catch(() => {
          // offline / not logged in — keep local value
        })
    }
    loadMarketRegionFromServer()
    if (typeof window !== 'undefined') {
      window.addEventListener(AUTH_SESSION_EVENT, loadMarketRegionFromServer)
      return () => window.removeEventListener(AUTH_SESSION_EVENT, loadMarketRegionFromServer)
    }
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
    if (getToken()) {
      settings.putPreferences({ market_region: m }).catch(() => {
        // keep UI state; retry on next session sync
      })
    }
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
