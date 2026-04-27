'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { portfolio } from '@/lib/api'

export interface Holding {
  ticker: string
  shares_held: number
  avg_cost: number
  current_price: number
  current_price_usd: number
  market_value: number
  market_value_usd: number
  unrealized_pnl: number
  unrealized_pnl_usd: number
  unrealized_pnl_pct: number
  realized_pnl: number
  realized_pnl_usd: number
  day_change_pct: number
  eur_rate: number
  quote_session?: string | null
  market_state?: string | null
  pre_market_price?: number | null
  pre_market_price_usd?: number | null
  post_market_price?: number | null
  post_market_price_usd?: number | null
  regular_market_price?: number | null
  regular_market_price_usd?: number | null
  signal?: SwingSignal | null
}

export type SwingSignal =
  | 'strong_buy'
  | 'potential_buy'
  | 'hold'
  | 'potential_sell'
  | 'strong_sell'

export function usePortfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)   // true only on first load
  const [refreshing, setRefreshing] = useState(false) // true on background refreshes
  const [error, setError] = useState<string | null>(null)
  const initialized = useRef(false)

  const load = useCallback(async () => {
    if (!initialized.current) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }
    setError(null)
    try {
      const data = await portfolio.get()
      setHoldings(data as Holding[])
      initialized.current = true
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load portfolio')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [load])

  return { holdings, loading, refreshing, error, refresh: load }
}
