'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { useLiveQuote } from '@/hooks/usePriceStream'

interface LivePriceProps {
  ticker: string
  /** Initial price to render before the first WebSocket tick arrives. */
  initialPriceEur?: number
  initialPriceUsd?: number
  /** Decimals to format with. */
  decimals?: number
  /** Optional inline style for the price text. */
  style?: React.CSSProperties
  /** Show a brief flash highlight when the price changes (Webull-style). */
  flash?: boolean
}

/**
 * A self-contained price display that subscribes to the live price stream for
 * a single ticker. Only this element re-renders when its price changes — the
 * surrounding card stays untouched, eliminating the full-card refresh flicker.
 */
function LivePriceImpl({
  ticker,
  initialPriceEur,
  initialPriceUsd,
  decimals = 2,
  style,
  flash = true,
}: LivePriceProps) {
  const { currency, currencySymbol } = useApp()
  const quote = useLiveQuote(ticker)

  const livePrice = quote
    ? currency === 'USD' ? quote.current_price_usd : quote.current_price
    : undefined
  const initialPrice = currency === 'USD' ? initialPriceUsd : initialPriceEur
  const price = typeof livePrice === 'number' && Number.isFinite(livePrice)
    ? livePrice
    : (typeof initialPrice === 'number' && Number.isFinite(initialPrice) ? initialPrice : null)

  const prevPriceRef = useRef<number | null>(null)
  const [flashColor, setFlashColor] = useState<string | null>(null)

  useEffect(() => {
    if (!flash || price === null) return
    const prev = prevPriceRef.current
    if (prev !== null && prev !== price) {
      setFlashColor(price > prev ? '#22c55e' : '#ef4444')
      const timer = setTimeout(() => setFlashColor(null), 600)
      prevPriceRef.current = price
      return () => clearTimeout(timer)
    }
    prevPriceRef.current = price
  }, [price, flash])

  if (price === null) {
    return <span style={style}>—</span>
  }

  const baseColor = (style?.color as string | undefined) ?? '#f1f5f9'
  return (
    <span
      style={{
        ...style,
        color: flashColor ?? baseColor,
        transition: 'color 600ms ease-out',
      }}
    >
      {currencySymbol}{price.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  )
}

export const LivePrice = memo(LivePriceImpl)

interface LiveDayChangeProps {
  ticker: string
  initialPct?: number
  style?: React.CSSProperties
}

function LiveDayChangeImpl({ ticker, initialPct, style }: LiveDayChangeProps) {
  const quote = useLiveQuote(ticker)
  const pct = typeof quote?.day_change_pct === 'number'
    ? quote.day_change_pct
    : (typeof initialPct === 'number' && Number.isFinite(initialPct) ? initialPct : null)
  if (pct === null) return <span style={style}>—</span>
  const color = pct >= 0 ? '#22c55e' : '#ef4444'
  return (
    <span style={{ ...style, color }}>
      {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
    </span>
  )
}

export const LiveDayChange = memo(LiveDayChangeImpl)
