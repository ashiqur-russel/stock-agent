'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import Toggle from '@/components/ui/Toggle'
import FormInput from '@/components/ui/FormInput'
import { market, paper } from '@/lib/api'

interface Quote {
  current_price: number
  current_price_usd: number
  day_change_pct: number
  eur_rate: number
}

interface Props {
  ticker: string
  mode: 'BUY' | 'SELL'
  heldShares?: number
  cashAvailable: number
  onClose: () => void
  onDone: () => void
}

export default function TradeModal({ ticker, mode, heldShares = 0, cashAvailable, onClose, onDone }: Props) {
  const { t, currency, currencySymbol } = useApp()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [inputMode, setInputMode] = useState<'amount' | 'shares'>('shares')
  const [numInput, setNumInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const q = await market.quote(ticker) as Quote
        setQuote(q)
      } catch {
        setError('Failed to fetch price')
      }
    }
    fetchQuote()
    const interval = setInterval(fetchQuote, 30_000)
    return () => clearInterval(interval)
  }, [ticker])

  const eurRate = quote?.eur_rate ?? 0.91
  const priceEur = quote?.current_price ?? 0
  const priceDisplay = quote
    ? (currency === 'USD' ? quote.current_price_usd : priceEur)
    : 0

  const toEur = (val: number) => currency === 'USD' ? val * eurRate : val

  const sharesCalc = (() => {
    const n = parseFloat(numInput) || 0
    if (inputMode === 'shares') return n
    return toEur(n) / (priceEur || 1)
  })()

  const costEur = sharesCalc * priceEur
  const costDisplay = currency === 'USD' ? costEur / eurRate : costEur
  const cashEur = currency === 'USD' ? cashAvailable * eurRate : cashAvailable

  const validate = (): string | null => {
    if (sharesCalc < 0.001) return t('modal_min_shares')
    if (mode === 'BUY' && costEur > cashEur) return t('modal_insufficient')
    if (mode === 'SELL' && sharesCalc > heldShares) return t('modal_more_than_held')
    return null
  }

  const execute = async () => {
    const err = validate()
    if (err) { setError(err); return }
    setLoading(true)
    setError(null)
    try {
      await paper.trade(ticker, mode, sharesCalc)
      onDone()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Trade failed')
    } finally {
      setLoading(false)
    }
  }

  const isBuy = mode === 'BUY'
  const accentColor = isBuy ? '#22c55e' : '#ef4444'

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 28, width: '100%', maxWidth: 400, color: '#f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: accentColor }}>
            {isBuy ? t('modal_buy') : t('modal_sell')} {ticker}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 22, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ background: '#020617', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{t('modal_price')}</div>
          {quote ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9' }}>
                {currencySymbol}{priceDisplay.toFixed(2)}
              </div>
              <div style={{ fontSize: 13, color: quote.day_change_pct >= 0 ? '#22c55e' : '#ef4444' }}>
                {quote.day_change_pct >= 0 ? '+' : ''}{quote.day_change_pct.toFixed(2)}%
              </div>
            </>
          ) : (
            <div style={{ color: '#64748b' }}>{t('modal_fetching')}</div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13, color: '#94a3b8' }}>
          <span>{t('modal_available')}: {currencySymbol}{(currency === 'USD' ? cashAvailable : cashEur).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          {mode === 'SELL' && <span>{t('modal_held')}: {heldShares.toFixed(4)}</span>}
        </div>

        <div style={{ marginBottom: 12 }}>
          <Toggle
            options={[t('modal_input_shares') as string, t('modal_input_amount') as string]}
            value={inputMode === 'shares' ? t('modal_input_shares') as string : t('modal_input_amount') as string}
            onChange={(v) => setInputMode(v === t('modal_input_shares') ? 'shares' : 'amount')}
            activeColor={accentColor}
            style={{ width: '100%' }}
          />
        </div>

        <FormInput
          label={inputMode === 'shares' ? `${t('modal_shares_label')}` : `${t('modal_amount_label')} (${currencySymbol})`}
          type='number'
          min='0'
          step='any'
          value={numInput}
          onChange={(e) => { setNumInput(e.target.value); setError(null) }}
          placeholder={inputMode === 'shares' ? '0.000' : '0.00'}
        />

        {sharesCalc >= 0.001 && (
          <div style={{ marginTop: 12, background: '#020617', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#94a3b8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>{t('modal_shares_label')}</span>
              <span style={{ color: '#f1f5f9' }}>{sharesCalc.toFixed(6)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              <span>{isBuy ? t('modal_cost') : t('modal_proceeds')}</span>
              <span style={{ color: accentColor, fontWeight: 600 }}>{currencySymbol}{costDisplay.toFixed(2)}</span>
            </div>
          </div>
        )}

        {error && <div style={{ marginTop: 10, color: '#ef4444', fontSize: 13 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '10px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>
            {t('modal_cancel')}
          </button>
          <button
            onClick={execute}
            disabled={loading || !quote}
            style={{ flex: 2, padding: '10px', background: accentColor, border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? t('modal_executing') : t('modal_execute')}
          </button>
        </div>
      </div>
    </div>
  )
}
