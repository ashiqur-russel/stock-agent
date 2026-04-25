'use client'

import { useEffect, useRef, useState } from 'react'
import { getToken } from '@/lib/api'

const WS_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000').replace(/^http/, 'ws')

export interface LiveAlert {
  id: string
  ticker: string
  condition: string
  target_price: number
  current_price: number
  message: string
  timestamp: string
}

export function useAlertWS(onAlert?: (alert: LiveAlert) => void) {
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>

    const connect = () => {
      const token = getToken()
      if (!token) return

      const ws = new WebSocket(`${WS_URL}/ws/alerts?token=${token}`)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)
      ws.onclose = () => {
        setConnected(false)
        reconnectTimer = setTimeout(connect, 10_000)
      }
      ws.onerror = () => ws.close()
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data) as LiveAlert
          onAlert?.(data)
        } catch {
          // ignore
        }
      }
    }

    connect()
    return () => {
      clearTimeout(reconnectTimer)
      wsRef.current?.close()
    }
  }, [onAlert])

  return { connected }
}
