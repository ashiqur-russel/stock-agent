'use client'

import { useEffect, useState, useCallback } from 'react'
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
}

export function usePortfolio() {
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await portfolio.get()
      setHoldings(data as Holding[])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load portfolio')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [load])

  return { holdings, loading, error, refresh: load }
}
