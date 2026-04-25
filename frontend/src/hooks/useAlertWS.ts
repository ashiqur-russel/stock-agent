'use client'

import { useEffect, useRef, useState } from 'react'
import { getToken } from '@/lib/api'

const WS_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/^http/, 'ws')

// Server message shape from backend/routers/ws.py @ /api/v1/ws/alerts.
//   - "connected"      → handshake; no ticker, no message
//   - "price_update"   → heartbeat for every portfolio ticker (every 30s)
//   - "price_alert"    → SHARP RALLY / DROP / SUPPORT BROKEN / BREAKOUT
//   - "signal_change"  → swing setup quality changed
// We only surface the last two as toasts; the others are noise.
type ServerMessage =
  | { type: 'connected'; tickers: string[]; market_open: boolean }
  | {
      type: 'price_update'
      ticker: string
      price: number
      change_pct: number
      day_change_pct: number
      market_open: boolean
    }
  | {
      type: 'price_alert'
      ticker: string
      title: string
      message: string
      severity: 'high' | 'critical'
    }
  | {
      type: 'signal_change'
      ticker: string
      title: string
      old_signal: string
      new_signal: string
      message: string
      severity: 'high'
    }

export interface LiveAlert {
  id: string
  type: 'price_alert' | 'signal_change'
  ticker: string
  title: string
  message: string
  severity: 'high' | 'critical'
  timestamp: string
}

let nextLocalId = 1

export function useAlertWS(onAlert?: (alert: LiveAlert) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>
    let cancelled = false

    const connect = () => {
      const token = getToken()
      if (!token || cancelled) return

      const ws = new WebSocket(`${WS_URL}/api/v1/ws/alerts?token=${encodeURIComponent(token)}`)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)
      ws.onclose = () => {
        setConnected(false)
        if (!cancelled) reconnectTimer = setTimeout(connect, 10_000)
      }
      ws.onerror = () => ws.close()
      ws.onmessage = (e) => {
        let data: ServerMessage
        try {
          data = JSON.parse(e.data) as ServerMessage
        } catch {
          return
        }
        if (data.type !== 'price_alert' && data.type !== 'signal_change') return

        const alert: LiveAlert = {
          id: `${data.ticker}-${Date.now()}-${nextLocalId++}`,
          type: data.type,
          ticker: data.ticker,
          title: data.title,
          message: data.message,
          severity: data.severity,
          timestamp: new Date().toISOString(),
        }
        onAlert?.(alert)
      }
    }

    connect()
    return () => {
      cancelled = true
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
  }, [onAlert])

  return { connected }
}
