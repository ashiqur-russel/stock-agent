'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { getToken, API_URL } from '@/lib/api'

export type QuoteSession =
  | 'pre_market'
  | 'after_hours'
  | 'regular'
  | 'closed'
  | 'unknown'

/** US parent line when DE mode uses a German Yahoo symbol (finanzen.net-style). */
export interface UsListingQuote {
  ticker: string
  current_price_usd: number
  day_change_pct: number
  quote_session?: QuoteSession | string | null
  market_state?: string | null
}

export interface LiveQuote {
  ticker: string
  current_price: number
  current_price_usd: number
  day_change_pct: number
  eur_rate: number
  ts: number
  quote_session?: QuoteSession | string
  market_state?: string | null
  pre_market_price?: number | null
  pre_market_price_usd?: number | null
  post_market_price?: number | null
  post_market_price_usd?: number | null
  regular_market_price?: number | null
  regular_market_price_usd?: number | null
  us_listing?: UsListingQuote | null
  /** True when the backend returned a cached price because the live fetch failed (e.g. rate-limited). */
  data_stale?: boolean
}

/** True when at least one of EUR / USD spot prices is a positive finite number. */
export function liveQuoteHasValidPrices(q: LiveQuote): boolean {
  const eur = q.current_price
  const usd = q.current_price_usd
  return (
    (typeof eur === 'number' && Number.isFinite(eur) && eur > 0) ||
    (typeof usd === 'number' && Number.isFinite(usd) && usd > 0)
  )
}

/** Derive both legs from whichever side Yahoo filled (guards against €0 with valid $). */
export function quoteSpotPrices(q: LiveQuote): { eur: number; usd: number } | null {
  const rate = q.eur_rate && q.eur_rate > 0 ? q.eur_rate : 0.91
  let eur =
    typeof q.current_price === 'number' && Number.isFinite(q.current_price) ? q.current_price : NaN
  let usd =
    typeof q.current_price_usd === 'number' && Number.isFinite(q.current_price_usd)
      ? q.current_price_usd
      : NaN
  if (!(eur > 0) && usd > 0) {
    eur = usd * rate
  }
  if (!(usd > 0) && eur > 0) {
    usd = eur / rate
  }
  if (eur > 0 && usd > 0) {
    return { eur, usd }
  }
  return null
}

type Listener = () => void

const WS_URL = API_URL.replace(/^http/, 'ws')

// ---------------------------------------------------------------------------
// Singleton price-stream store
//
// One WebSocket per browser tab is shared by every <LivePrice/> on the page.
// Each component subscribes to a single ticker via useSyncExternalStore — when
// a quote arrives for AAPL, only the AAPL subscribers re-render. The rest of
// the card is left untouched, which is what gives the "live ticking number,
// stable card" feel similar to Webull / TradingView.
// ---------------------------------------------------------------------------

class PriceStream {
  private ws: WebSocket | null = null
  private quotes = new Map<string, LiveQuote>()
  private listenersByTicker = new Map<string, Set<Listener>>()
  private refCounts = new Map<string, number>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private connectAttempt = 0

  subscribe(ticker: string, listener: Listener): () => void {
    const t = ticker.toUpperCase()
    let set = this.listenersByTicker.get(t)
    if (!set) {
      set = new Set()
      this.listenersByTicker.set(t, set)
    }
    set.add(listener)

    const next = (this.refCounts.get(t) ?? 0) + 1
    this.refCounts.set(t, next)
    if (next === 1) this.sendSubscribeIfReady([t])

    this.ensureConnected()

    return () => {
      const setNow = this.listenersByTicker.get(t)
      if (setNow) {
        setNow.delete(listener)
        if (setNow.size === 0) this.listenersByTicker.delete(t)
      }
      const remaining = (this.refCounts.get(t) ?? 0) - 1
      if (remaining <= 0) {
        this.refCounts.delete(t)
        this.sendUnsubscribeIfReady([t])
      } else {
        this.refCounts.set(t, remaining)
      }
    }
  }

  getSnapshot(ticker: string): LiveQuote | undefined {
    return this.quotes.get(ticker.toUpperCase())
  }

  private ensureConnected(): void {
    if (typeof window === 'undefined') return
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return
    }
    const token = getToken()
    if (!token) return

    this.connectAttempt += 1
    let ws: WebSocket
    try {
      ws = new WebSocket(`${WS_URL}/api/v1/ws/prices?token=${encodeURIComponent(token)}`)
    } catch {
      this.scheduleReconnect()
      return
    }
    this.ws = ws

    ws.onopen = () => {
      this.connectAttempt = 0
      const tickers = Array.from(this.refCounts.keys())
      if (tickers.length > 0) {
        ws.send(JSON.stringify({ action: 'set', tickers }))
      }
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as
          | { type: 'connected' }
          | { type: 'prices'; quotes: (Omit<LiveQuote, 'ts'> & { us_listing?: UsListingQuote | null })[] }
        if (data.type !== 'prices') return
        const ts = Date.now()
        for (const q of data.quotes) {
          const ticker = q.ticker.toUpperCase()
          const prev = this.quotes.get(ticker)
          const incoming = { ...q, ticker } as LiveQuote
          if (!liveQuoteHasValidPrices(incoming)) {
            if (prev && liveQuoteHasValidPrices(prev)) {
              continue
            }
            continue
          }
          const usEq =
            JSON.stringify(prev?.us_listing ?? null) === JSON.stringify(q.us_listing ?? null)
          if (
            prev &&
            prev.current_price === q.current_price &&
            prev.day_change_pct === q.day_change_pct &&
            prev.quote_session === q.quote_session &&
            prev.regular_market_price === q.regular_market_price &&
            usEq
          ) {
            continue
          }
          this.quotes.set(ticker, { ...incoming, ts })
          const subs = this.listenersByTicker.get(ticker)
          if (subs) subs.forEach((fn) => fn())
        }
      } catch {
        // ignore malformed payloads
      }
    }

    ws.onclose = () => {
      this.ws = null
      if (this.refCounts.size > 0) this.scheduleReconnect()
    }
    ws.onerror = () => {
      try { ws.close() } catch { /* noop */ }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return
    const delay = Math.min(1000 * 2 ** this.connectAttempt, 30_000)
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.ensureConnected()
    }, delay)
  }

  private sendSubscribeIfReady(tickers: string[]): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'subscribe', tickers }))
    }
  }

  private sendUnsubscribeIfReady(tickers: string[]): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ action: 'unsubscribe', tickers }))
    }
  }
}

let streamSingleton: PriceStream | null = null

function getStream(): PriceStream {
  if (!streamSingleton) streamSingleton = new PriceStream()
  return streamSingleton
}

/**
 * Subscribe to live updates for a single ticker. Returns the latest quote (or
 * undefined while the first tick has not arrived). Only re-renders when this
 * ticker's quote changes.
 */
export function useLiveQuote(ticker: string | null | undefined): LiveQuote | undefined {
  const stream = getStream()
  const subscribe = (cb: Listener) => {
    if (!ticker) return () => {}
    return stream.subscribe(ticker, cb)
  }
  const getSnapshot = () => (ticker ? stream.getSnapshot(ticker) : undefined)
  const getServerSnapshot = () => undefined
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Convenience hook for components that just want to ensure a list of tickers
 * is being streamed (without consuming the values). Useful when many small
 * components each call `useLiveQuote` for a single ticker.
 */
export function usePriceStreamTickers(tickers: string[]): void {
  const stream = getStream()
  useEffect(() => {
    const unsubscribers = tickers.map((t) => stream.subscribe(t, () => {}))
    return () => {
      for (const u of unsubscribers) u()
    }
  }, [tickers.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps
}

interface PortfolioHoldingLike {
  ticker: string
  shares_held: number
  avg_cost: number
  market_value: number
  market_value_usd: number
  unrealized_pnl: number
  unrealized_pnl_usd: number
}

export interface LivePortfolioTotals {
  totalValueEur: number
  totalValueUsd: number
  totalUnrealizedEur: number
  totalUnrealizedUsd: number
}

/**
 * Aggregates portfolio totals using live WebSocket prices when available,
 * falling back to the server-provided snapshot values per holding.
 * Re-renders whenever any subscribed ticker's price changes.
 */
export function useLivePortfolioTotals(holdings: PortfolioHoldingLike[]): LivePortfolioTotals {
  const stream = getStream()
  const tickerStr = holdings.map((h) => h.ticker).join('|')

  const compute = useCallback((): LivePortfolioTotals => {
    let totalValueEur = 0
    let totalValueUsd = 0
    let totalUnrealizedEur = 0
    let totalUnrealizedUsd = 0
    for (const h of holdings) {
      const quote = stream.getSnapshot(h.ticker)
      const spots = quote ? quoteSpotPrices(quote) : null
      if (spots && spots.eur > 0 && spots.usd > 0) {
        const rate = (quote as LiveQuote).eur_rate || 0.91
        const avgCostUsd = h.avg_cost / rate
        totalValueEur += spots.eur * h.shares_held
        totalValueUsd += spots.usd * h.shares_held
        totalUnrealizedEur += (spots.eur - h.avg_cost) * h.shares_held
        totalUnrealizedUsd += (spots.usd - avgCostUsd) * h.shares_held
      } else {
        totalValueEur += h.market_value
        totalValueUsd += h.market_value_usd
        totalUnrealizedEur += h.unrealized_pnl
        totalUnrealizedUsd += h.unrealized_pnl_usd
      }
    }
    return { totalValueEur, totalValueUsd, totalUnrealizedEur, totalUnrealizedUsd }
  }, [tickerStr, holdings]) // eslint-disable-line react-hooks/exhaustive-deps

  const [totals, setTotals] = useState<LivePortfolioTotals>(compute)

  useEffect(() => {
    setTotals(compute())
    const unsubs = holdings.map((h) => stream.subscribe(h.ticker, () => setTotals(compute())))
    return () => { for (const u of unsubs) u() }
  }, [tickerStr, compute]) // eslint-disable-line react-hooks/exhaustive-deps

  return totals
}
