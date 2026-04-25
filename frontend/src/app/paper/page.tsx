'use client'

import { useState, useEffect, useCallback } from 'react'
import AuthGuard from '@/components/layout/AuthGuard'
import { useApp } from '@/contexts/AppContext'
import { AmountLocale } from '@/components/ui/Amount'
import MarketStatus from '@/components/ui/MarketStatus'
import TradeModal from '@/components/paper/TradeModal'
import { paper as paperApi, market as marketApi } from '@/lib/api'

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

interface Quote {
  current_price: number
  current_price_usd: number
  day_change_pct: number
  eur_rate: number
}

interface WatchItem {
  ticker: string
  quote: Quote | null
  loading: boolean
}

function PaperContent() {
  const { t, currency, currencySymbol } = useApp()
  const [account, setAccount] = useState<Account | null>(null)
  const [watchlist, setWatchlist] = useState<WatchItem[]>([])
  const [newTicker, setNewTicker] = useState('')
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<{ ticker: string; mode: 'BUY' | 'SELL' } | null>(null)

  const loadAccount = useCallback(async () => {
    try {
      const data = await paperApi.getAccount() as Account
      setAccount(data)
      // sync holdings into watchlist
      setWatchlist((prev) => {
        const existing = new Set(prev.map((w) => w.ticker))
        const newItems: WatchItem[] = data.holdings
          .filter((h) => !existing.has(h.ticker))
          .map((h) => ({ ticker: h.ticker, quote: null, loading: false }))
        return [...prev, ...newItems]
      })
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchQuote = useCallback(async (ticker: string) => {
    setWatchlist((prev) => prev.map((w) => w.ticker === ticker ? { ...w, loading: true } : w))
    try {
      const q = await marketApi.quote(ticker) as Quote
      setWatchlist((prev) => prev.map((w) => w.ticker === ticker ? { ...w, quote: q, loading: false } : w))
    } catch {
      setWatchlist((prev) => prev.map((w) => w.ticker === ticker ? { ...w, loading: false } : w))
    }
  }, [])

  useEffect(() => {
    loadAccount()
  }, [loadAccount])

  // Refresh all quotes every 30s
  useEffect(() => {
    if (watchlist.length === 0) return
    watchlist.forEach((w) => fetchQuote(w.ticker))
    const interval = setInterval(() => watchlist.forEach((w) => fetchQuote(w.ticker)), 30_000)
    return () => clearInterval(interval)
  }, [watchlist.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const normalizeTicker = (input: string): string => {
    const CRYPTO = new Set(['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'MATIC', 'LTC', 'LINK', 'UNI', 'ATOM', 'XLM', 'TRX', 'ETC', 'FIL', 'HBAR', 'ICP', 'APT', 'ARB', 'OP', 'NEAR', 'ALGO', 'VET', 'SAND', 'MANA', 'AXS', 'SHIB', 'PEPE'])
    if (CRYPTO.has(input) && !input.includes('-')) return `${input}-USD`
    return input
  }

  const addToWatchlist = () => {
    const raw = newTicker.trim().toUpperCase()
    if (!raw) { setNewTicker(''); return }
    const ticker = normalizeTicker(raw)
    if (watchlist.some((w) => w.ticker === ticker)) { setNewTicker(''); return }
    setWatchlist((prev) => [...prev, { ticker, quote: null, loading: true }])
    setNewTicker('')
    fetchQuote(ticker)
  }

  const removeFromWatchlist = (ticker: string) => {
    setWatchlist((prev) => prev.filter((w) => w.ticker !== ticker))
  }

  const resetAccount = async () => {
    const resetAmount = currency === 'USD' ? '$109,890' : '€100,000'
    if (!confirm(`${t('pt_reset_confirm')} ${resetAmount} ${t('pt_reset_confirm2')}`)) return
    await paperApi.reset()
    await loadAccount()
  }

  const getHolding = (ticker: string) => account?.holdings.find((h) => h.ticker === ticker)

  const totalEur = (account?.cash ?? 0) + (account?.portfolio_value ?? 0)
  const totalUsd = (account?.cash_usd ?? 0) + (account?.portfolio_value_usd ?? 0)
  const cashDisplay = currency === 'USD' ? (account?.cash_usd ?? 0) : (account?.cash ?? 0)
  const portfolioDisplay = currency === 'USD' ? (account?.portfolio_value_usd ?? 0) : (account?.portfolio_value ?? 0)
  const totalDisplay = currency === 'USD' ? totalUsd : totalEur

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t('pt_title')}</h1>
        <button onClick={resetAccount} style={{ padding: '6px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#ef4444', cursor: 'pointer', fontSize: 13 }}>
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
                  const pnlVal = currency === 'USD' ? h.pnl_usd : h.pnl
                  return (
                    <tr key={h.ticker} style={{ borderBottom: '1px solid #0d1117' }}>
                      <td style={{ padding: '10px', fontWeight: 700, color: '#f1f5f9' }}>{h.ticker}</td>
                      <td style={{ padding: '10px', color: '#f1f5f9' }}>{h.shares.toFixed(4)}</td>
                      <td style={{ padding: '10px', color: '#94a3b8' }}>
                        <AmountLocale eur={h.avg_cost} usd={h.avg_cost / 0.91} decimals={2} />
                      </td>
                      <td style={{ padding: '10px', color: '#f1f5f9' }}>
                        <AmountLocale eur={h.current_price} usd={h.current_price_usd} decimals={2} />
                      </td>
                      <td style={{ padding: '10px', color: '#f1f5f9', fontWeight: 600 }}>
                        <AmountLocale eur={h.value} usd={h.value_usd} decimals={2} />
                      </td>
                      <td style={{ padding: '10px', fontWeight: 600, color: pnlVal >= 0 ? '#22c55e' : '#ef4444' }}>
                        {pnlVal >= 0 ? '+' : ''}{currencySymbol}{Math.abs(pnlVal).toFixed(2)}
                        <span style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>({h.pnl_pct >= 0 ? '+' : ''}{h.pnl_pct.toFixed(1)}%)</span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => setModal({ ticker: h.ticker, mode: 'BUY' })} style={{ padding: '4px 12px', background: '#052e16', border: '1px solid #166534', borderRadius: 6, color: '#22c55e', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                            {t('pt_buy')}
                          </button>
                          <button onClick={() => setModal({ ticker: h.ticker, mode: 'SELL' })} style={{ padding: '4px 12px', background: '#2d0a0a', border: '1px solid #7f1d1d', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
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
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#94a3b8' }}>{t('pt_watchlist')}</h2>
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

        {watchlist.length === 0 && <p style={{ color: '#64748b', fontSize: 14 }}>{t('pt_no_watch')}</p>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {watchlist.map((w) => {
            const holding = getHolding(w.ticker)
            const price = w.quote ? (currency === 'USD' ? w.quote.current_price_usd : w.quote.current_price) : null
            const dayChange = w.quote?.day_change_pct ?? 0
            return (
              <div key={w.ticker} style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 10, padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{w.ticker}</span>
                  <button onClick={() => removeFromWatchlist(w.ticker)} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>×</button>
                </div>
                {w.loading ? (
                  <div style={{ color: '#64748b', fontSize: 13 }}>Loading…</div>
                ) : price !== null ? (
                  <>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginBottom: 2 }}>
                      {currencySymbol}{price.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 12, color: dayChange >= 0 ? '#22c55e' : '#ef4444', marginBottom: 10 }}>
                      {dayChange >= 0 ? '+' : ''}{dayChange.toFixed(2)}%
                    </div>
                    {holding && (
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                        Held: {holding.shares.toFixed(4)} shares
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => setModal({ ticker: w.ticker, mode: 'BUY' })} style={{ flex: 1, padding: '6px', background: '#052e16', border: '1px solid #166534', borderRadius: 6, color: '#22c55e', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                        {t('pt_buy')}
                      </button>
                      {holding && (
                        <button onClick={() => setModal({ ticker: w.ticker, mode: 'SELL' })} style={{ flex: 1, padding: '6px', background: '#2d0a0a', border: '1px solid #7f1d1d', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                          {t('pt_sell')}
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ color: '#64748b', fontSize: 13 }}>Not found</div>
                )}
              </div>
            )
          })}
        </div>
      </div>

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
    </div>
  )
}

export default function PaperPage() {
  return <AuthGuard><PaperContent /></AuthGuard>
}
