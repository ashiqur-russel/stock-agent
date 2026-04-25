'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
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

const EMPTY_FORM = {
  txType: 'BUY' as 'BUY' | 'SELL',
  ticker: '',
  shares: '',
  price: '',
  date: new Date().toISOString().slice(0, 10),
  notes: '',
}

export default function TransactionsPage() {
  const { t, currencySymbol } = useApp()

  // Form state — used for both "add new" and "edit existing".
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)

  const formRef = useRef<HTMLDivElement | null>(null)

  const loadTransactions = useCallback(async () => {
    try {
      const data = await portfolio.getTransactions()
      setTransactions(
        (data as Transaction[]).sort(
          (a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime(),
        ),
      )
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) })
    setEditingId(null)
    setFormError(null)
  }

  const startEdit = (tx: Transaction) => {
    setEditingId(tx.id)
    setFormError(null)
    setForm({
      txType: tx.type,
      ticker: tx.ticker,
      shares: String(tx.shares),
      price: String(tx.price),
      date: tx.executed_at.slice(0, 10),
      notes: tx.notes ?? '',
    })
    // Scroll the form into view so the user actually sees the edit happening.
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleSubmit = async () => {
    if (!form.ticker.trim() || !form.shares || !form.price || !form.date) {
      setFormError(t('tx_fill_all'))
      return
    }
    setSubmitting(true)
    setFormError(null)
    const body = {
      ticker: form.ticker.trim().toUpperCase(),
      type: form.txType,
      shares: parseFloat(form.shares),
      price: parseFloat(form.price),
      executed_at: form.date,
      notes: form.notes.trim() || undefined,
    }
    try {
      if (editingId !== null) {
        await portfolio.updateTransaction(editingId, body)
      } else {
        await portfolio.addTransaction(body)
      }
      resetForm()
      await loadTransactions()
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to save transaction')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm(t('tx_delete_confirm'))) return
    try {
      await portfolio.deleteTransaction(id)
      if (editingId === id) resetForm()
      await loadTransactions()
    } catch {
      // ignore
    }
  }

  const isEditing = editingId !== null
  const accent = form.txType === 'BUY' ? '#22c55e' : '#ef4444'

  return (
    <div>
      <h1 style={{ margin: '0 0 28px', fontSize: 24, fontWeight: 700 }}>{t('nav_transactions')}</h1>

      {/* Add / edit form */}
      <div
        ref={formRef}
        style={{
          background: '#0f172a',
          border: `1px solid ${isEditing ? '#334155' : '#1e293b'}`,
          borderRadius: 12,
          padding: 24,
          marginBottom: 32,
          boxShadow: isEditing ? '0 0 0 1px #334155' : undefined,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 18,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>
            {isEditing ? `${t('tx_edit_log')} #${editingId}` : t('tx_log')}
          </h2>
          {isEditing && (
            <button
              onClick={resetForm}
              style={{
                background: 'none',
                border: '1px solid #334155',
                borderRadius: 6,
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: 12,
                padding: '4px 12px',
              }}
            >
              {t('tx_cancel')}
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['BUY', 'SELL'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setForm((f) => ({ ...f, txType: type }))}
              style={{
                padding: '8px 22px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                border: 'none',
                background:
                  form.txType === type ? (type === 'BUY' ? '#22c55e' : '#ef4444') : '#1e293b',
                color: form.txType === type ? '#fff' : '#94a3b8',
              }}
            >
              {type === 'BUY' ? t('tx_buy') : t('tx_sell')}
            </button>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 14,
          }}
        >
          <FormInput
            label={t('tx_ticker_lbl')}
            value={form.ticker}
            onChange={(e) => {
              setForm((f) => ({ ...f, ticker: e.target.value.toUpperCase() }))
              setFormError(null)
            }}
            placeholder="AAPL"
          />
          <FormInput
            label={t('tx_shares_lbl')}
            type="number"
            min="0"
            step="any"
            value={form.shares}
            onChange={(e) => {
              setForm((f) => ({ ...f, shares: e.target.value }))
              setFormError(null)
            }}
            placeholder="10"
          />
          <FormInput
            label={`${t('tx_price_lbl')} (${currencySymbol})`}
            type="number"
            min="0"
            step="any"
            value={form.price}
            onChange={(e) => {
              setForm((f) => ({ ...f, price: e.target.value }))
              setFormError(null)
            }}
            placeholder="185.50"
          />
          <FormInput
            label={t('tx_date_lbl')}
            type="date"
            value={form.date}
            onChange={(e) => {
              setForm((f) => ({ ...f, date: e.target.value }))
              setFormError(null)
            }}
          />
          <div style={{ gridColumn: '1 / -1' }}>
            <FormInput
              label={t('tx_notes_lbl')}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Optional notes…"
            />
          </div>
        </div>

        {formError && (
          <div style={{ color: '#ef4444', fontSize: 13, marginTop: 10 }}>{formError}</div>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: '10px 24px',
              background: accent,
              border: 'none',
              borderRadius: 8,
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: submitting ? 'wait' : 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting
              ? isEditing
                ? t('tx_saving')
                : t('tx_adding')
              : isEditing
                ? t('tx_save')
                : t('tx_add')}
          </button>
          {isEditing && (
            <button
              onClick={resetForm}
              disabled={submitting}
              style={{
                padding: '10px 20px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#94a3b8',
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {t('tx_cancel')}
            </button>
          )}
        </div>
      </div>

      {/* Transaction list */}
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 12,
          padding: 24,
        }}
      >
        <h2 style={{ margin: '0 0 18px', fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>
          {t('tx_history')}
        </h2>

        {loading && <p style={{ color: '#64748b' }}>{t('common_loading')}</p>}

        {!loading && transactions.length === 0 && (
          <p style={{ color: '#64748b', fontSize: 14 }}>{t('tx_empty')}</p>
        )}

        {!loading && transactions.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  {[
                    t('col_date'),
                    t('col_ticker'),
                    t('col_type'),
                    t('col_shares'),
                    t('col_price'),
                    t('col_total'),
                    t('col_notes'),
                    '',
                  ].map((h, i) => (
                    <th
                      key={`${h}-${i}`}
                      style={{
                        padding: '8px 10px',
                        textAlign: 'left',
                        color: '#64748b',
                        fontWeight: 600,
                        fontSize: 12,
                        textTransform: 'uppercase',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isRowEditing = editingId === tx.id
                  return (
                    <tr
                      key={tx.id}
                      style={{
                        borderBottom: '1px solid #0d1117',
                        background: isRowEditing ? '#0d1f3d' : undefined,
                      }}
                    >
                      <td style={{ padding: '10px', color: '#94a3b8' }}>{tx.executed_at}</td>
                      <td style={{ padding: '10px', color: '#f1f5f9', fontWeight: 600 }}>
                        {tx.ticker}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span
                          style={{
                            background: tx.type === 'BUY' ? '#052e16' : '#2d0a0a',
                            color: tx.type === 'BUY' ? '#22c55e' : '#ef4444',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
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
                      <td
                        style={{
                          padding: '10px',
                          color: '#64748b',
                          maxWidth: 140,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tx.notes}
                      </td>
                      <td style={{ padding: '10px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => startEdit(tx)}
                            style={{
                              background: 'none',
                              border: '1px solid #334155',
                              borderRadius: 6,
                              color: '#60a5fa',
                              cursor: 'pointer',
                              fontSize: 12,
                              padding: '3px 10px',
                            }}
                          >
                            {t('tx_edit')}
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            style={{
                              background: 'none',
                              border: '1px solid #334155',
                              borderRadius: 6,
                              color: '#ef4444',
                              cursor: 'pointer',
                              fontSize: 12,
                              padding: '3px 10px',
                            }}
                          >
                            {t('common_delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
