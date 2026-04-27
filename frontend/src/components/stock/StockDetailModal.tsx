'use client'

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useApp, priceDecimalsForValue } from '@/contexts/AppContext'
import { market } from '@/lib/api'
import ModalShell from '@/components/ui/ModalShell'
import CandlestickChart from '@/components/charts/CandlestickChart'
import { DetailPanelTile } from '@/components/stock/DetailPanelTile'
import { TickerNewsRow } from '@/components/stock/TickerNewsRow'
import { LiveDayChange, LivePrice, LiveQuoteExtendedHint, LiveUsListingRow } from '@/components/ui/LivePrice'
import type { UsListingQuote } from '@/hooks/usePriceStream'

const PERIODS = [
  { label: '1W', value: '5d' },
  { label: '1M', value: '1mo' },
  { label: '3M', value: '3mo' },
  { label: '6M', value: '6mo' },
  { label: '1Y', value: '1y' },
]

export interface FundamentalsMore {
  beta?: number
  dividend_yield_pct?: number
  eps_ttm?: number
  forward_pe?: number
  revenue_eur?: number
  revenue_usd?: number
  profit_margin_pct?: number
  debt_to_equity?: number
  shares_outstanding?: number
}

export interface StockQuoteDetail {
  ticker?: string
  display_name?: string
  current_price: number
  current_price_usd: number
  day_change_pct: number
  market_cap_eur?: number
  market_cap_usd?: number
  pe_ratio?: number
  week_52_high_eur?: number
  week_52_high_usd?: number
  week_52_low_eur?: number
  week_52_low_usd?: number
  fundamentals_more?: FundamentalsMore
  us_listing?: { ticker?: string; current_price_usd?: number; day_change_pct?: number }
}

interface NewsItem {
  title: string
  publisher?: string
  published_at?: string
  url?: string
}

function formatCompactCap(n: number, sym: string): string {
  const abs = Math.abs(n)
  if (abs >= 1e12) return `${sym}${(n / 1e12).toFixed(2)}T`
  if (abs >= 1e9) return `${sym}${(n / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${sym}${(n / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${sym}${(n / 1e3).toFixed(1)}K`
  return `${sym}${n.toLocaleString()}`
}

const MOBILE_MQ = '(max-width: 640px)'

/** Slightly shorter chart on narrow viewports (tabbed layout has less vertical space). */
function useNarrowChartHeight(): boolean {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)
    const apply = () => setNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])
  return narrow
}

interface Props {
  ticker: string | null
  onClose: () => void
  usListingFallback?: UsListingQuote | null
}

/** Overview = fundamentals + chart; News is separate. */
type DetailTab = 'overview' | 'news'

export default function StockDetailModal({ ticker, onClose, usListingFallback }: Props) {
  const { t, currency, currencySymbol, lang } = useApp()
  const narrowChart = useNarrowChartHeight()
  const [tab, setTab] = useState<DetailTab>('overview')
  const [maximized, setMaximized] = useState(false)
  const [period, setPeriod] = useState('3mo')
  const [moreOpen, setMoreOpen] = useState(false)
  const [quote, setQuote] = useState<StockQuoteDetail | null>(null)
  const [news, setNews] = useState<NewsItem[]>([])
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!ticker) return
    setError(null)
    try {
      const [q, n] = await Promise.all([
        market.quote(ticker) as Promise<StockQuoteDetail>,
        market.news(ticker) as Promise<NewsItem[]>,
      ])
      setQuote(q)
      setNews(Array.isArray(n) ? n : [])
    } catch {
      setQuote(null)
      setNews([])
      setError(t('sdm_load_error'))
    }
  }, [ticker, t])

  useEffect(() => {
    if (!ticker) {
      setQuote(null)
      setNews([])
      setError(null)
      setMaximized(false)
      setPeriod('3mo')
      setMoreOpen(false)
      return
    }
    setTab('overview')
    load()
    const id = setInterval(load, 30_000)
    return () => clearInterval(id)
  }, [ticker, load])

  if (!ticker) return null

  const locale = lang === 'de' ? 'de' : 'en'
  const relativePublished = (iso: string) => {
    if (!iso) return ''
    const t0 = Date.parse(iso)
    if (!Number.isFinite(t0)) return ''
    const sec = Math.floor((Date.now() - t0) / 1000)
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
    if (sec < 60) return rtf.format(-sec, 'second')
    if (sec < 3600) return rtf.format(-Math.floor(sec / 60), 'minute')
    if (sec < 86400) return rtf.format(-Math.floor(sec / 3600), 'hour')
    if (sec < 604800) return rtf.format(-Math.floor(sec / 86400), 'day')
    return new Date(t0).toLocaleDateString(locale)
  }

  const chartH = maximized
    ? Math.min(520, Math.floor(window.innerHeight * 0.45))
    : narrowChart
      ? Math.min(320, Math.floor(window.innerHeight * 0.32))
      : 300

  const cap =
    currency === 'USD'
      ? quote?.market_cap_usd ?? quote?.market_cap_eur
      : quote?.market_cap_eur ?? quote?.market_cap_usd

  const wHigh = currency === 'USD' ? quote?.week_52_high_usd : quote?.week_52_high_eur
  const wLow = currency === 'USD' ? quote?.week_52_low_usd : quote?.week_52_low_eur

  const fmtPrice = (v: number | undefined) => {
    if (v === undefined || !Number.isFinite(v)) return '—'
    const d = priceDecimalsForValue(v)
    return `${currencySymbol}${v.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d })}`
  }

  const more = quote?.fundamentals_more
  const rev =
    currency === 'USD'
      ? more?.revenue_usd ?? more?.revenue_eur
      : more?.revenue_eur ?? more?.revenue_usd

  const moreRows: { label: string; value: string }[] = []
  if (more) {
    if (more.beta !== undefined && more.beta === more.beta) {
      moreRows.push({ label: t('sdm_beta'), value: String(more.beta) })
    }
    if (more.dividend_yield_pct !== undefined && more.dividend_yield_pct > 0) {
      moreRows.push({ label: t('sdm_div_yield'), value: `${more.dividend_yield_pct}%` })
    }
    if (more.eps_ttm !== undefined && more.eps_ttm === more.eps_ttm) {
      moreRows.push({ label: t('sdm_eps_ttm'), value: String(more.eps_ttm) })
    }
    if (
      more.forward_pe !== undefined &&
      more.forward_pe > 0 &&
      more.forward_pe !== quote?.pe_ratio
    ) {
      moreRows.push({ label: t('sdm_forward_pe'), value: String(more.forward_pe) })
    }
    if (rev !== undefined && rev > 0) {
      moreRows.push({ label: t('sdm_revenue'), value: formatCompactCap(rev, currencySymbol) })
    }
    if (more.profit_margin_pct !== undefined && more.profit_margin_pct === more.profit_margin_pct) {
      moreRows.push({ label: t('sdm_profit_margin'), value: `${more.profit_margin_pct}%` })
    }
    if (more.debt_to_equity !== undefined && more.debt_to_equity === more.debt_to_equity) {
      moreRows.push({ label: t('sdm_debt_equity'), value: String(more.debt_to_equity) })
    }
    if (more.shares_outstanding !== undefined && more.shares_outstanding > 0) {
      moreRows.push({
        label: t('sdm_shares_out'),
        value: more.shares_outstanding.toLocaleString(locale),
      })
    }
  }

  const statGrid = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 10,
      }}
    >
      {[
        { label: t('sdm_market_cap'), value: cap !== undefined && cap > 0 ? formatCompactCap(cap, currencySymbol) : '—' },
        {
          label: t('sdm_pe'),
          value:
            quote?.pe_ratio !== undefined && Number.isFinite(quote.pe_ratio)
              ? String(quote.pe_ratio)
              : '—',
        },
        { label: t('sdm_52w_high'), value: fmtPrice(wHigh) },
        { label: t('sdm_52w_low'), value: fmtPrice(wLow) },
      ].map((row) => (
        <DetailPanelTile key={row.label} label={row.label} value={row.value} />
      ))}
    </div>
  )

  const moreAccordion =
    moreRows.length > 0 ? (
      <div style={{ marginTop: 14 }}>
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: '#020617',
            border: '1px solid #1e293b',
            borderRadius: 8,
            color: '#94a3b8',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {t('sdm_more_metrics')}
          <span style={{ fontSize: 12, opacity: 0.8 }}>{moreOpen ? '▲' : '▼'}</span>
        </button>
        {moreOpen && (
          <div
            style={{
              marginTop: 10,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 10,
            }}
          >
            {moreRows.map((row) => (
              <DetailPanelTile key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        )}
      </div>
    ) : null

  const statsSection: ReactNode = (
    <section>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
        {t('sdm_fundamentals')}
      </div>
      {statGrid}
      {moreAccordion}
    </section>
  )

  const chartSection: ReactNode = (
    <section>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {PERIODS.map(({ label, value }) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            style={{
              padding: '4px 12px',
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              border: 'none',
              background: period === value ? '#22c55e' : '#1e293b',
              color: period === value ? '#fff' : '#94a3b8',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <CandlestickChart ticker={ticker} period={period} height={chartH} />
    </section>
  )

  const newsSection: ReactNode = (
    <section aria-label={t('sdm_news')}>
      {news.length === 0 ? (
        <p style={{ margin: 0, color: '#64748b', fontSize: 14 }}>{t('sdm_no_news')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {news.map((item, i) => (
            <TickerNewsRow
              key={`${item.title}-${i}`}
              title={item.title}
              url={item.url}
              publisher={item.publisher}
              timeLabel={relativePublished(item.published_at ?? '')}
            />
          ))}
        </div>
      )}
    </section>
  )

  const tabIds: Record<DetailTab, string> = {
    overview: 'sdm-tab-overview',
    news: 'sdm-tab-news',
  }
  const panelIds: Record<DetailTab, string> = {
    overview: 'sdm-panel-overview',
    news: 'sdm-panel-news',
  }

  const tabBtn = (id: DetailTab, label: string) => (
    <button
      key={id}
      type="button"
      role="tab"
      id={tabIds[id]}
      aria-selected={tab === id}
      aria-controls={panelIds[id]}
      tabIndex={tab === id ? 0 : -1}
      onClick={() => setTab(id)}
      style={{
        flex: 1,
        padding: '10px 8px',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        border: 'none',
        borderBottom: tab === id ? '2px solid #22c55e' : '2px solid transparent',
        background: 'transparent',
        color: tab === id ? '#f1f5f9' : '#64748b',
        marginBottom: -1,
      }}
    >
      {label}
    </button>
  )

  const shellStyle: CSSProperties = maximized
    ? {
        position: 'fixed',
        inset: 12,
        zIndex: 1000,
        maxWidth: 'none',
        width: 'auto',
        height: 'auto',
        maxHeight: 'none',
        display: 'flex',
        flexDirection: 'column',
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: 12,
        boxShadow: '0 25px 80px rgba(0,0,0,0.55)',
        overflow: 'hidden',
      }
    : {
        position: 'relative',
        width: 'min(560px, calc(100vw - 32px))',
        maxHeight: 'min(90vh, 880px)',
        display: 'flex',
        flexDirection: 'column',
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: 12,
        boxShadow: '0 25px 80px rgba(0,0,0,0.55)',
        overflow: 'hidden',
      }

  const bodyContent = (
    <>
      <div
        role="tablist"
        aria-label={`${ticker} ${t('sdm_tabs_aria')}`}
        style={{
          flexShrink: 0,
          display: 'flex',
          borderBottom: '1px solid #1e293b',
          background: '#0f172a',
        }}
      >
        {tabBtn('overview', t('sdm_tab_overview'))}
        {tabBtn('news', t('sdm_tab_news'))}
      </div>
      <div
        role="tabpanel"
        id={panelIds[tab]}
        aria-labelledby={tabIds[tab]}
        style={{ overflowY: 'auto', flex: 1, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 20 }}
      >
        {error && <div style={{ color: '#f87171', fontSize: 14 }}>{error}</div>}
        {tab === 'overview' && (
          <>
            {statsSection}
            {chartSection}
          </>
        )}
        {tab === 'news' && newsSection}
      </div>
    </>
  )

  return (
    <ModalShell
      open
      onClose={onClose}
      lockBodyScroll
      zIndex={999}
      backdropTint="slate"
      fillViewport={maximized}
      outerPadding={maximized ? 0 : 16}
      ariaLabelledBy="stock-detail-title"
      panelStyle={shellStyle}
    >
      <div
        style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          padding: '16px 18px',
          borderBottom: '1px solid #1e293b',
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div id="stock-detail-title" style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>
            {quote?.display_name ?? ticker}
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{ticker}</div>
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '8px 14px' }}>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>
              <LivePrice ticker={ticker} />
            </span>
            <span style={{ fontSize: 15, fontWeight: 600 }}>
              <LiveDayChange ticker={ticker} initialPct={quote?.day_change_pct} />
            </span>
          </div>
          <div style={{ marginTop: 6, fontSize: 12 }}>
            <LiveQuoteExtendedHint ticker={ticker} />
            <LiveUsListingRow ticker={ticker} fallback={usListingFallback ?? undefined} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setMaximized((m) => !m)}
            style={{
              padding: '8px 12px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#94a3b8',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {maximized ? t('sdm_collapse') : t('sdm_expand')}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px 12px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#94a3b8',
              fontSize: 18,
              lineHeight: 1,
              cursor: 'pointer',
            }}
            aria-label={t('sdm_close')}
          >
            ×
          </button>
        </div>
      </div>

      {bodyContent}
    </ModalShell>
  )
}
