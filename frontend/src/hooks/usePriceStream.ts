'use client'

import { useEffect, useSyncExternalStore } from 'react'
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
          this.quotes.set(ticker, { ...q, ticker, ts })
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
