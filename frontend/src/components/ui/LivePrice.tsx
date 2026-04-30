'use client'

import { memo, useEffect, useRef, useState } from 'react'
import { useApp, priceDecimalsForValue } from '@/contexts/AppContext'
import type { TranslationKey } from '@/lib/i18n'
import {
  useLiveQuote,
  liveQuoteHasValidPrices,
  quoteSpotPrices,
  type UsListingQuote,
} from '@/hooks/usePriceStream'

const num = (v: unknown): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : 0

function fmtMoney(value: number, decimals = 2): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

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

  const spots = quote ? quoteSpotPrices(quote) : null
  const livePrice = spots ? (currency === 'USD' ? spots.usd : spots.eur) : undefined
  const initialPrice = currency === 'USD' ? initialPriceUsd : initialPriceEur
  const price = typeof livePrice === 'number' && Number.isFinite(livePrice) && livePrice > 0
    ? livePrice
    : (typeof initialPrice === 'number' && Number.isFinite(initialPrice) && initialPrice > 0
        ? initialPrice
        : null)

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

  const dec = decimals ?? priceDecimalsForValue(price)
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
        minimumFractionDigits: dec,
        maximumFractionDigits: dec,
      })}
    </span>
  )
}

export const LivePrice = memo(LivePriceImpl)

const SESSION_LABEL: Partial<Record<string, TranslationKey>> = {
  pre_market: 'pc_quote_session_pre',
  after_hours: 'pc_quote_session_after',
  regular: 'pc_quote_session_regular',
  closed: 'pc_quote_session_closed',
}

/** Second row: US Yahoo USD price + % (pre/RTH/after) when DE mode uses a German listing. */
export const LiveUsListingRow = memo(function LiveUsListingRow({
  ticker,
  fallback,
}: {
  ticker: string
  fallback?: UsListingQuote | null
}) {
  const { t, marketRegion } = useApp()
  const quote = useLiveQuote(ticker)
  const us = quote?.us_listing ?? fallback ?? null
  if (marketRegion !== 'DE' || !us || !Number.isFinite(us.current_price_usd)) return null

  const dec = priceDecimalsForValue(us.current_price_usd)
  const pct = Number(us.day_change_pct)
  const pctOk = Number.isFinite(pct)
  const sess = typeof us.quote_session === 'string' ? SESSION_LABEL[us.quote_session] : undefined

  return (
    <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, lineHeight: 1.4 }}>
      <span style={{ color: '#64748b', fontWeight: 600 }}>{t('pc_us_quote_prefix')}</span>
      <span style={{ color: '#64748b' }}>{' · '}</span>
      <span style={{ color: '#e2e8f0' }}>
        $
        {us.current_price_usd.toLocaleString(undefined, {
          minimumFractionDigits: dec,
          maximumFractionDigits: dec,
        })}
      </span>
      {pctOk && (
        <>
          <span style={{ color: '#64748b' }}>{' · '}</span>
          <span style={{ color: pct >= 0 ? '#22c55e' : '#ef4444' }}>
            {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
          </span>
        </>
      )}
      {sess && (
        <>
          <span style={{ color: '#64748b' }}>{' · '}</span>
          <span style={{ color: '#a78bfa' }}>{t(sess)}</span>
        </>
      )}
    </div>
  )
})

/** Pre-market / after-hours / closed badge + optional regular-session reference price (from Yahoo). */
export const LiveQuoteExtendedHint = memo(function LiveQuoteExtendedHint({
  ticker,
}: {
  ticker: string
}) {
  const { t, formatPrice, marketRegion } = useApp()
  const quote = useLiveQuote(ticker)

  const session = quote?.quote_session
  if (marketRegion === 'DE' && session === 'pre_market') {
    return null
  }

  const labelKey = typeof session === 'string' ? SESSION_LABEL[session] : undefined

  const regEur = quote?.regular_market_price
  const regUsd = quote?.regular_market_price_usd
  const showRef =
    (session === 'pre_market' || session === 'after_hours') &&
    typeof regEur === 'number' &&
    Number.isFinite(regEur) &&
    regEur > 0

  if (!labelKey && !showRef) return null

  return (
    <div style={{ marginTop: 4 }}>
      {labelKey && (
        <span
          style={{
            display: 'inline-block',
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: '#a78bfa',
            background: 'rgba(139, 92, 246, 0.12)',
            borderRadius: 4,
            padding: '2px 6px',
          }}
        >
          {t(labelKey)}
        </span>
      )}
      {showRef && (
        <div style={{ fontSize: 10, color: '#64748b', marginTop: labelKey ? 4 : 0, lineHeight: 1.35 }}>
          {t('pc_regular_reference')}:{' '}
          <span style={{ color: '#94a3b8' }}>
            {formatPrice(regEur, typeof regUsd === 'number' ? regUsd : undefined)}
          </span>
        </div>
      )}
    </div>
  )
})

interface LiveDayChangeProps {
  ticker: string
  initialPct?: number
  style?: React.CSSProperties
}

function LiveDayChangeImpl({ ticker, initialPct, style }: LiveDayChangeProps) {
  const quote = useLiveQuote(ticker)
  const hasLive = quote && liveQuoteHasValidPrices(quote)
  const pct =
    hasLive && typeof quote.day_change_pct === 'number'
      ? quote.day_change_pct
      : (typeof initialPct === 'number' && Number.isFinite(initialPct) && initialPct !== 0
          ? initialPct
          : (hasLive ? 0 : null))
  if (pct === null) return <span style={style}>—</span>
  const color = pct >= 0 ? '#22c55e' : '#ef4444'
  return (
    <span style={{ ...style, color }}>
      {pct >= 0 ? '+' : ''}{pct.toFixed(2)}%
    </span>
  )
}

export const LiveDayChange = memo(LiveDayChangeImpl)

// ---------------------------------------------------------------------------
// LiveMarketValue — shares × live price in the active display currency.
// Falls back to the server-provided snapshot until the first WS tick lands.
// ---------------------------------------------------------------------------

interface LiveMarketValueProps {
  ticker: string
  shares: number
  fallbackEur: number
  fallbackUsd: number
  decimals?: number
  style?: React.CSSProperties
}

export const LiveMarketValue = memo(function LiveMarketValue({
  ticker,
  shares,
  fallbackEur,
  fallbackUsd,
  decimals = 2,
  style,
}: LiveMarketValueProps) {
  const { currency, currencySymbol } = useApp()
  const quote = useLiveQuote(ticker)
  const spots = quote ? quoteSpotPrices(quote) : null
  const livePrice = spots ? (currency === 'USD' ? spots.usd : spots.eur) : null
  const fallback = currency === 'USD' ? fallbackUsd : fallbackEur
  const fallbackNum = num(fallback)
  const value =
    livePrice !== null && Number.isFinite(livePrice) && livePrice > 0
      ? livePrice * num(shares)
      : fallbackNum > 0
        ? fallbackNum
        : null
  if (value === null) return <span style={{ color: '#64748b', ...style }}>—</span>
  return (
    <span style={{ color: '#f1f5f9', ...style }}>
      {currencySymbol}{fmtMoney(value, decimals)}
    </span>
  )
})

// ---------------------------------------------------------------------------
// LivePnL — shares × (live price − avg cost) in the active display currency.
//
// avg_cost is stored in EUR on the backend, so when the user is viewing in
// USD we convert the cost basis at the current FX rate from the same tick
// (keeps cost basis consistent with the live price denominator).
// Falls back to the server-side snapshot until the first WS tick arrives.
// ---------------------------------------------------------------------------

interface LivePnLProps {
  ticker: string
  shares: number
  avgCostEur: number
  fallbackEur: number
  fallbackUsd: number
  style?: React.CSSProperties
}

export const LivePnL = memo(function LivePnL({
  ticker,
  shares,
  avgCostEur,
  fallbackEur,
  fallbackUsd,
  style,
}: LivePnLProps) {
  const { currency, currencySymbol } = useApp()
  const quote = useLiveQuote(ticker)

  let pnl: number
  if (quote) {
    const spots = quoteSpotPrices(quote)
    if (spots) {
      if (currency === 'USD') {
        const rate = quote.eur_rate || 0.91
        const avgCostUsd = num(avgCostEur) / rate
        pnl = (spots.usd - avgCostUsd) * num(shares)
      } else {
        pnl = (spots.eur - num(avgCostEur)) * num(shares)
      }
    } else {
      pnl = num(currency === 'USD' ? fallbackUsd : fallbackEur)
    }
  } else {
    pnl = num(currency === 'USD' ? fallbackUsd : fallbackEur)
  }

  const color = pnl >= 0 ? '#22c55e' : '#ef4444'
  const sign = pnl >= 0 ? '+' : '-'
  return (
    <span style={{ color, fontWeight: 600, ...style }}>
      {sign}{currencySymbol}{fmtMoney(Math.abs(pnl))}
    </span>
  )
})

// ---------------------------------------------------------------------------
// LivePnLPct — (live price − avg cost) / avg cost × 100. Currency-agnostic
// (a return % is a pure number), computed in EUR space which matches the
// canonical avg-cost basis. Falls back to the server snapshot pre-tick.
// ---------------------------------------------------------------------------

interface LivePnLPctProps {
  ticker: string
  avgCostEur: number
  fallbackPct: number
  style?: React.CSSProperties
  /** When true wraps in parentheses, e.g. `(+1.23%)`. */
  parens?: boolean
  /** When true, hides the colour and just renders muted text. */
  muted?: boolean
}

export const LivePnLPct = memo(function LivePnLPct({
  ticker,
  avgCostEur,
  fallbackPct,
  style,
  parens = false,
  muted = false,
}: LivePnLPctProps) {
  const quote = useLiveQuote(ticker)
  const cost = num(avgCostEur)

  let pct: number
  if (quote && cost > 0) {
    const spots = quoteSpotPrices(quote)
    pct = spots ? ((spots.eur - cost) / cost) * 100 : num(fallbackPct)
  } else {
    pct = num(fallbackPct)
  }

  const color = muted ? '#64748b' : pct >= 0 ? '#22c55e' : '#ef4444'
  const sign = pct >= 0 ? '+' : ''
  const text = `${sign}${pct.toFixed(2)}%`
  return (
    <span style={{ color, ...style }}>
      {parens ? `(${text})` : text}
    </span>
  )
})
