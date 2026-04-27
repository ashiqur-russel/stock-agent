'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import { useApp } from '@/contexts/AppContext'
import { AmountLocale } from '@/components/ui/Amount'
import MarketStatus from '@/components/ui/MarketStatus'
import TradeModal from '@/components/paper/TradeModal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import StockDetailModal from '@/components/stock/StockDetailModal'
import { isStockMarketOpen } from '@/lib/marketHours'
import {
  LivePrice,
  LiveQuoteExtendedHint,
  LiveDayChange,
  LiveMarketValue,
  LivePnL,
  LivePnLPct,
} from '@/components/ui/LivePrice'
import { paper as paperApi } from '@/lib/api'

interface Holding {
  ticker: string
  shares: number
  avg_cost: number
  current_price: number
  current_price_usd: number
  value: number
  value_usd: number
  pnl: number
  pnl_usd: number
  pnl_pct: number
}

interface Account {
  cash: number
  cash_usd: number
  portfolio_value: number
  portfolio_value_usd: number
  holdings: Holding[]
}

const CRYPTO_TICKERS = new Set([
  'BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC',
  'LTC', 'LINK', 'UNI', 'ATOM', 'XLM', 'TRX', 'ETC', 'FIL', 'HBAR', 'ICP',
  'APT', 'ARB', 'OP', 'NEAR', 'ALGO', 'VET', 'SAND', 'MANA', 'AXS', 'SHIB', 'PEPE',
])

function normalizeTicker(input: string): string {
  const upper = input.trim().toUpperCase()
  if (CRYPTO_TICKERS.has(upper) && !upper.includes('-')) return `${upper}-USD`
  return upper
}

const isCrypto = (ticker: string) => ticker.endsWith('-USD')

type WatchFilter = 'all' | 'stocks' | 'crypto'

function PaperContent() {
  const { t, currency, currencySymbol, marketRegion } = useApp()
  const [account, setAccount] = useState<Account | null>(null)
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [newTicker, setNewTicker] = useState('')
  const [, setLoading] = useState(true)
  const [modal, setModal] = useState<{ ticker: string; mode: 'BUY' | 'SELL' } | null>(null)
  const [resetOpen, setResetOpen] = useState(false)

  // Watchlist filter
  const [watchFilter, setWatchFilter] = useState<WatchFilter>('all')

  const [detailTicker, setDetailTicker] = useState<string | null>(null)

  // Market hours — re-check every minute
  const [marketOpen, setMarketOpen] = useState(() => isStockMarketOpen(marketRegion))
  useEffect(() => {
    setMarketOpen(isStockMarketOpen(marketRegion))
    const id = setInterval(() => setMarketOpen(isStockMarketOpen(marketRegion)), 60_000)
    return () => clearInterval(id)
  }, [marketRegion])

  const loadAccount = useCallback(async () => {
    try {
      const data = await paperApi.getAccount(currency) as Account
      setAccount(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [currency])

  const loadWatchlist = useCallback(async () => {
    try {
      const data = await paperApi.watchlist.list()
      setWatchlist(data.tickers)
    } catch {
      // ignore – first load can fail before auth completes
    }
  }, [])

  useEffect(() => {
    loadAccount()
    loadWatchlist()
  }, [loadAccount, loadWatchlist])

  const addToWatchlist = async () => {
    const raw = newTicker.trim()
    if (!raw) { setNewTicker(''); return }
    const ticker = normalizeTicker(raw)
    if (watchlist.includes(ticker)) { setNewTicker(''); return }
    setWatchlist((prev) => [...prev, ticker])
    setNewTicker('')
    try {
      await paperApi.watchlist.add(ticker)
    } catch {
      setWatchlist((prev) => prev.filter((t) => t !== ticker))
    }
  }

  const removeFromWatchlist = async (ticker: string) => {
    if (detailTicker === ticker) setDetailTicker(null)
    setWatchlist((prev) => prev.filter((t) => t !== ticker))
    try {
      await paperApi.watchlist.remove(ticker)
    } catch {
      setWatchlist((prev) => (prev.includes(ticker) ? prev : [...prev, ticker]))
    }
  }

  const performReset = async () => {
    await paperApi.reset(currency)
    await loadAccount()
    setResetOpen(false)
  }

  const openDetail = (ticker: string) => setDetailTicker(ticker)

  const getHolding = (ticker: string) => account?.holdings.find((h) => h.ticker === ticker)

  const totalEur = (account?.cash ?? 0) + (account?.portfolio_value ?? 0)
  const totalUsd = (account?.cash_usd ?? 0) + (account?.portfolio_value_usd ?? 0)
  const cashDisplay = currency === 'USD' ? (account?.cash_usd ?? 0) : (account?.cash ?? 0)
  const portfolioDisplay = currency === 'USD' ? (account?.portfolio_value_usd ?? 0) : (account?.portfolio_value ?? 0)
  const totalDisplay = currency === 'USD' ? totalUsd : totalEur

  const filteredWatchlist = watchlist.filter((t) =>
    watchFilter === 'all' ? true :
    watchFilter === 'crypto' ? isCrypto(t) : !isCrypto(t)
  )

  const filterPill = (label: string, value: WatchFilter) => (
    <button
      key={value}
      onClick={() => setWatchFilter(value)}
      style={{
        padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
        cursor: 'pointer', border: 'none',
        background: watchFilter === value ? '#22c55e' : '#1e293b',
        color: watchFilter === value ? '#fff' : '#94a3b8',
      }}
    >
      {label}
    </button>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t('pt_title')}</h1>
        <button onClick={() => setResetOpen(true)} style={{ padding: '6px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>
          {t('pt_reset')}
        </button>
      </div>

      <div style={{ marginBottom: 24 }}>
        <MarketStatus type='both' />
      </div>

      {/* Account summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: t('pt_cash'), val: cashDisplay },
          { label: t('pt_value'), val: portfolioDisplay },
          { label: t('pt_total'), val: totalDisplay },
        ].map((item) => (
          <div key={item.label} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>
              {currencySymbol}{item.val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        ))}
      </div>

      {/* Holdings */}
      {account?.holdings && account.holdings.length > 0 && (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24, marginBottom: 28 }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#94a3b8' }}>{t('pt_holdings')}</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  {[t('paper_ticker'), t('paper_shares'), t('paper_avg'), t('paper_current'), t('paper_value'), t('paper_pnl'), t('paper_actions')].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {account.holdings.map((h) => {
                  const stockBuyDisabled = !isCrypto(h.ticker) && !marketOpen
                  return (
                    <tr key={h.ticker} style={{ borderBottom: '1px solid #0d1117' }}>
                      <td style={{ padding: '10px', fontWeight: 700, color: '#f1f5f9' }}>
                        <button
                          onClick={() => openDetail(h.ticker)}
                          style={{ background: 'none', border: 'none', color: '#f1f5f9', cursor: 'pointer', fontWeight: 700, padding: 0, fontSize: 14 }}
                          title={`View ${h.ticker} chart`}
                        >
                          {h.ticker}
                        </button>
                      </td>
                      <td style={{ padding: '10px', color: '#f1f5f9' }}>{h.shares.toFixed(4)}</td>
                      <td style={{ padding: '10px', color: '#94a3b8' }}>
                        <AmountLocale eur={h.avg_cost} usd={h.avg_cost / 0.91} decimals={2} />
                      </td>
                      <td style={{ padding: '10px', color: '#f1f5f9', verticalAlign: 'top' }}>
                        <LivePrice
                          ticker={h.ticker}
                          initialPriceEur={h.current_price}
                          initialPriceUsd={h.current_price_usd}
                        />
                        <LiveQuoteExtendedHint ticker={h.ticker} />
                      </td>
                      <td style={{ padding: '10px', color: '#f1f5f9', fontWeight: 600 }}>
                        <LiveMarketValue
                          ticker={h.ticker}
                          shares={h.shares}
                          fallbackEur={h.value}
                          fallbackUsd={h.value_usd}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <LivePnL
                          ticker={h.ticker}
                          shares={h.shares}
                          avgCostEur={h.avg_cost}
                          fallbackEur={h.pnl}
                          fallbackUsd={h.pnl_usd}
                        />
                        <LivePnLPct
                          ticker={h.ticker}
                          avgCostEur={h.avg_cost}
                          fallbackPct={h.pnl_pct}
                          parens
                          muted
                          style={{ fontSize: 11, marginLeft: 4 }}
                        />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => setModal({ ticker: h.ticker, mode: 'BUY' })}
                            disabled={stockBuyDisabled}
                            title={stockBuyDisabled ? 'Market closed — stocks trade Mon–Fri during exchange hours' : undefined}
                            style={{
                              padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                              background: stockBuyDisabled ? '#0d1117' : '#052e16',
                              border: `1px solid ${stockBuyDisabled ? '#1e293b' : '#166534'}`,
                              color: stockBuyDisabled ? '#334155' : '#22c55e',
                              cursor: stockBuyDisabled ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {t('pt_buy')}
                          </button>
                          <button
                            onClick={() => setModal({ ticker: h.ticker, mode: 'SELL' })}
                            style={{ padding: '4px 12px', background: '#2d0a0a', border: '1px solid #7f1d1d', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                          >
                            {t('pt_sell')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Watchlist */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#94a3b8' }}>{t('pt_watchlist')}</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {filterPill('All', 'all')}
            {filterPill('Stocks', 'stocks')}
            {filterPill('Crypto', 'crypto')}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <input
            value={newTicker}
            onChange={(e) => setNewTicker(e.target.value.toUpperCase())}
            onKeyDown={(e) => { if (e.key === 'Enter') addToWatchlist() }}
            placeholder={t('pt_add_ticker')}
            style={{ flex: 1, padding: '10px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14, outline: 'none' }}
          />
          <button onClick={addToWatchlist} style={{ padding: '10px 20px', background: '#22c55e', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            {t('pt_add')}
          </button>
        </div>

        {filteredWatchlist.length === 0 && (
          <p style={{ color: '#64748b', fontSize: 14 }}>
            {watchlist.length === 0 ? t('pt_no_watch') : `No ${watchFilter === 'stocks' ? 'stock' : 'crypto'} tickers in watchlist.`}
          </p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {filteredWatchlist.map((ticker) => (
            <WatchCard
              key={ticker}
              ticker={ticker}
              heldShares={getHolding(ticker)?.shares}
              marketOpen={marketOpen}
              isActive={detailTicker === ticker}
              onRemove={removeFromWatchlist}
              onTrade={setModal}
              onChart={openDetail}
              labels={{ buy: t('pt_buy'), sell: t('pt_sell') }}
            />
          ))}
        </div>
      </div>

      {detailTicker && (
        <StockDetailModal ticker={detailTicker} onClose={() => setDetailTicker(null)} />
      )}

      {modal && (
        <TradeModal
          ticker={modal.ticker}
          mode={modal.mode}
          heldShares={getHolding(modal.ticker)?.shares ?? 0}
          cashAvailable={currency === 'USD' ? (account?.cash_usd ?? 0) : (account?.cash ?? 0)}
          onClose={() => setModal(null)}
          onDone={() => { setModal(null); loadAccount() }}
        />
      )}

      <ConfirmDialog
        open={resetOpen}
        title={t('pt_reset_title')}
        message={
          <>
            {t('pt_reset_body')}{' '}
            <strong style={{ color: '#f1f5f9' }}>
              {currencySymbol}1,000,000
            </strong>
            . {t('pt_reset_body_tail')}
          </>
        }
        confirmLabel={t('pt_reset_yes')}
        cancelLabel={t('pt_cancel')}
        tone='danger'
        onConfirm={performReset}
        onClose={() => setResetOpen(false)}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// WatchCard
// ---------------------------------------------------------------------------

interface WatchCardProps {
  ticker: string
  heldShares: number | undefined
  marketOpen: boolean
  isActive: boolean
  onRemove: (ticker: string) => void
  onTrade: (m: { ticker: string; mode: 'BUY' | 'SELL' }) => void
  onChart: (ticker: string) => void
  labels: { buy: string; sell: string }
}

const WatchCard = memo(function WatchCard({
  ticker, heldShares, marketOpen, isActive, onRemove, onTrade, onChart, labels,
}: WatchCardProps) {
  const hasHolding = typeof heldShares === 'number' && heldShares > 0
  const crypto = isCrypto(ticker)
  const stockBuyDisabled = !crypto && !marketOpen

  return (
    <div style={{
      background: '#020617',
      border: `1px solid ${isActive ? '#22c55e' : '#1e293b'}`,
      borderRadius: 10,
      padding: 16,
      transition: 'border-color 0.2s',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      minHeight: 0,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <button
          onClick={() => onChart(ticker)}
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 16, fontWeight: 700, color: '#f1f5f9', textAlign: 'left' }}
          title={`View ${ticker} chart`}
        >
          {ticker}
        </button>
        <button
          onClick={() => onRemove(ticker)}
          style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
          aria-label={`Remove ${ticker}`}
        >
          ×
        </button>
      </div>

      <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2 }}>
        <LivePrice ticker={ticker} />
      </div>
      <div style={{ fontSize: 12, marginBottom: 10 }}>
        <LiveDayChange ticker={ticker} />
      </div>
      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8, minHeight: 18, lineHeight: 1.5 }}>
        {hasHolding ? `Held: ${heldShares!.toFixed(4)} shares` : '\u00a0'}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 4 }}>
        <button
          onClick={() => onTrade({ ticker, mode: 'BUY' })}
          disabled={stockBuyDisabled}
          title={stockBuyDisabled ? 'Market closed — stocks trade Mon–Fri during exchange hours' : undefined}
          style={{
            flex: 1, padding: '6px', borderRadius: 6, fontSize: 12, fontWeight: 600,
            background: stockBuyDisabled ? '#0d1117' : '#052e16',
            border: `1px solid ${stockBuyDisabled ? '#1e293b' : '#166534'}`,
            color: stockBuyDisabled ? '#334155' : '#22c55e',
            cursor: stockBuyDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          {labels.buy}
        </button>
        {hasHolding && (
          <button
            onClick={() => onTrade({ ticker, mode: 'SELL' })}
            style={{ flex: 1, padding: '6px', background: '#2d0a0a', border: '1px solid #7f1d1d', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
          >
            {labels.sell}
          </button>
        )}
      </div>
    </div>
  )
})

export default function PaperPage() {
  return <PaperContent />
}
