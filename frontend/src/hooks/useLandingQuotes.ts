'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { fetchPublicLandingQuotes } from '@/lib/api'
import { LANDING_TICKER_ORDER, type LandingTickerRow } from '@/lib/landingQuotes'

export function useLandingQuotes() {
  const { currency, currencySymbol } = useApp()
  const [tickerRows, setTickerRows] = useState<LandingTickerRow[] | null>(null)

  const loadQuotes = useCallback(() => {
    fetchPublicLandingQuotes()
      .then((data) => {
        setTickerRows(
          data.quotes.map((q) => {
            const chg = typeof q.day_change_pct === 'number' ? q.day_change_pct : 0
            const ok = q.ok === true
            return {
              sym: (q.ticker || '').toUpperCase(),
              eur: q.current_price ?? 0,
              usd: q.current_price_usd ?? 0,
              chgPct: chg,
              up: chg >= 0,
              ok,
            }
          }),
        )
      })
      .catch(() => {
        setTickerRows(
          LANDING_TICKER_ORDER.map((sym) => ({
            sym,
            eur: 0,
            usd: 0,
            chgPct: 0,
            up: true,
            ok: false,
          })),
        )
      })
  }, [])

  useEffect(() => {
    loadQuotes()
    const id = setInterval(loadQuotes, 60_000)
    return () => clearInterval(id)
  }, [loadQuotes])

  const formatPair = useCallback(
    (eur: number, usd: number) => {
      const val = currency === 'USD' ? usd : eur
      if (val >= 10000) return `${currencySymbol}${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      if (val >= 1000) return `${currencySymbol}${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      return `${currencySymbol}${val.toFixed(2)}`
    },
    [currency, currencySymbol],
  )

  const loadingTickers = tickerRows === null
  const scrollRows = useMemo(() => {
    const base: LandingTickerRow[] =
      tickerRows && tickerRows.length > 0
        ? tickerRows
        : LANDING_TICKER_ORDER.map((sym) => ({
            sym,
            eur: 0,
            usd: 0,
            chgPct: 0,
            up: true,
            ok: false,
          }))
    return [...base, ...base]
  }, [tickerRows])

  return { tickerRows, scrollRows, loadingTickers, formatPair }
}
