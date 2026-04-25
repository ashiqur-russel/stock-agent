'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/contexts/AppContext'
import FormInput from '@/components/ui/FormInput'
import { AmountLocale } from '@/components/ui/Amount'
import { portfolio } from '@/lib/api'

interface Transaction {
  id: number
  ticker: string
  type: 'BUY' | 'SELL'
  shares: number
  price: number
  executed_at: string
  notes: string
  total: number
}

function TransactionsContent() {
  const { t, currencySymbol } = useApp()
  const [txType, setTxType] = useState<'BUY' | 'SELL'>('BUY')
  const [ticker, setTicker] = useState('')
  const [shares, setShares] = useState('')
  const [price, setPrice] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const loadTransactions = useCallback(async () => {
    try {
      const data = await portfolio.getTransactions()
      setTransactions((data as Transaction[]).sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()))
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTransactions() }, [loadTransactions])

  const handleAdd = async () => {
    if (!ticker.trim() || !shares || !price || !date) {
      setFormError(t('tx_fill_all'))
      return
    }
    setSubmitting(true)
    setFormError(null)
    try {
      await portfolio.addTransaction({
        ticker: ticker.trim().toUpperCase(),
        type: txType,
        shares: parseFloat(shares),
        price: parseFloat(price),
        executed_at: date,
        notes: notes.trim() || undefined,
      })
      setTicker('')
      setShares('')
      setPrice('')
      setNotes('')
      await loadTransactions()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to add transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('tx_delete_confirm'))) return
    try {
      await portfolio.deleteTransaction(id)
      await loadTransactions()
    } catch {
      // ignore
    }
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 28px', fontSize: 24, fontWeight: 700 }}>{t('nav_transactions')}</h1>

      {/* Add form */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24, marginBottom: 32 }}>
        <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>{t('tx_log')}</h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['BUY', 'SELL'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTxType(type)}
              style={{
                padding: '8px 22px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', border: 'none',
                background: txType === type ? (type === 'BUY' ? '#22c55e' : '#ef4444') : '#1e293b',
                color: txType === type ? '#fff' : '#94a3b8',
              }}
            >
              {type === 'BUY' ? t('tx_buy') : t('tx_sell')}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          <FormInput label={t('tx_ticker_lbl')} value={ticker} onChange={(e) => { setTicker(e.target.value.toUpperCase()); setFormError(null) }} placeholder='AAPL' />
          <FormInput label={t('tx_shares_lbl')} type='number' min='0' step='any' value={shares} onChange={(e) => { setShares(e.target.value); setFormError(null) }} placeholder='10' />
          <FormInput label={`${t('tx_price_lbl')} (${currencySymbol})`} type='number' min='0' step='any' value={price} onChange={(e) => { setPrice(e.target.value); setFormError(null) }} placeholder='185.50' />
          <FormInput label={t('tx_date_lbl')} type='date' value={date} onChange={(e) => { setDate(e.target.value); setFormError(null) }} />
          <div style={{ gridColumn: '1 / -1' }}>
            <FormInput label={t('tx_notes_lbl')} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder='Optional notes…' />
          </div>
        </div>

        {formError && <div style={{ color: '#ef4444', fontSize: 13, marginTop: 10 }}>{formError}</div>}

        <button
          onClick={handleAdd}
          disabled={submitting}
          style={{ marginTop: 16, padding: '10px 24px', background: txType === 'BUY' ? '#22c55e' : '#ef4444', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}
        >
          {submitting ? t('tx_adding') : t('tx_add')}
        </button>
      </div>

      {/* Transaction list */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24 }}>
        <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>{t('tx_history')}</h2>

        {loading && <p style={{ color: '#64748b' }}>{t('common_loading')}</p>}

        {!loading && transactions.length === 0 && (
          <p style={{ color: '#64748b', fontSize: 14 }}>{t('tx_empty')}</p>
        )}

        {!loading && transactions.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  {[t('col_date'), t('col_ticker'), t('col_type'), t('col_shares'), t('col_price'), t('col_total'), t('col_notes'), ''].map((h) => (
                    <th key={h} style={{ padding: '8px 10px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: '1px solid #0d1117' }}>
                    <td style={{ padding: '10px', color: '#94a3b8' }}>{tx.executed_at}</td>
                    <td style={{ padding: '10px', color: '#f1f5f9', fontWeight: 600 }}>{tx.ticker}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ background: tx.type === 'BUY' ? '#052e16' : '#2d0a0a', color: tx.type === 'BUY' ? '#22c55e' : '#ef4444', padding: '2px 8px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ padding: '10px', color: '#f1f5f9' }}>{tx.shares.toFixed(4)}</td>
                    <td style={{ padding: '10px', color: '#f1f5f9' }}>
                      <AmountLocale eur={tx.price} decimals={2} />
                    </td>
                    <td style={{ padding: '10px', color: '#f1f5f9', fontWeight: 600 }}>
                      <AmountLocale eur={tx.price * tx.shares} decimals={2} />
                    </td>
                    <td style={{ padding: '10px', color: '#64748b', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tx.notes}</td>
                    <td style={{ padding: '10px' }}>
                      <button onClick={() => handleDelete(tx.id)} style={{ background: 'none', border: '1px solid #334155', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 12, padding: '3px 10px' }}>
                        {t('common_delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function TransactionsPage() {
  return <TransactionsContent />
}
