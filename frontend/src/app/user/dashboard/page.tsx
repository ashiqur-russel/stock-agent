'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { usePortfolio, type Holding } from '@/hooks/usePortfolio'
import PortfolioCard from '@/components/dashboard/PortfolioCard'
import MarketStatus from '@/components/ui/MarketStatus'
import { release } from '@/lib/api'

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function DashboardContent() {
  const { t, currency, currencySymbol, lang } = useApp()
  const router = useRouter()
  const { holdings, loading, refreshing, error, refresh } = usePortfolio()
  const [whatsNewHighlight, setWhatsNewHighlight] = useState(false)

  const refreshWhatsNew = useCallback(async () => {
    try {
      const data = await release.getWhatsNew(lang === 'de' ? 'de' : 'en')
      setWhatsNewHighlight(Boolean(data.should_show && data.release))
    } catch {
      setWhatsNewHighlight(false)
    }
  }, [lang])

  useEffect(() => {
    refreshWhatsNew()
  }, [refreshWhatsNew])

  useEffect(() => {
    const onUpd = () => {
      refreshWhatsNew()
    }
    window.addEventListener('stock-agent-whats-new-updated', onUpd)
    return () => window.removeEventListener('stock-agent-whats-new-updated', onUpd)
  }, [refreshWhatsNew])

  const totalValueEur = holdings.reduce((s, h) => s + num(h.market_value), 0)
  const totalUnrealizedEur = holdings.reduce((s, h) => s + num(h.unrealized_pnl), 0)
  const totalValueUsd = holdings.reduce((s, h) => s + num(h.market_value_usd), 0)
  const totalUnrealizedUsd = holdings.reduce((s, h) => s + num(h.unrealized_pnl_usd), 0)

  const totalValue = currency === 'USD' ? totalValueUsd : totalValueEur
  const totalUnrealized = currency === 'USD' ? totalUnrealizedUsd : totalUnrealizedEur

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t('nav_dashboard')}</h1>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <MarketStatus type='stock' />
          <span style={{ fontSize: 12, color: '#22c55e', background: '#0d2d0d', border: '1px solid #166534', borderRadius: 10, padding: '2px 10px' }}>
            {t('db_live')}
          </span>
          <button
            type="button"
            onClick={refresh}
            style={{
              padding: '6px 14px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 10,
                height: 10,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {refreshing ? (
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    border: '2px solid #334155',
                    borderTopColor: '#22c55e',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
              ) : null}
            </span>
            {t('db_refresh')}
          </button>
        </div>
      </div>

      {whatsNewHighlight && (
        <button
          type="button"
          onClick={() => router.push('/user/dashboard?show_whats_new=1')}
          style={{
            width: '100%',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '16px 20px',
            textAlign: 'left',
            cursor: 'pointer',
            borderRadius: 12,
            border: '1px solid rgba(34, 197, 94, 0.35)',
            background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.35) 0%, rgba(15, 23, 42, 0.9) 55%)',
            color: '#e2e8f0',
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(34, 197, 94, 0.15)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Sparkles size={22} color="#4ade80" aria-hidden />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: '#86efac',
                  background: 'rgba(34, 197, 94, 0.2)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  padding: '2px 8px',
                  borderRadius: 6,
                }}
              >
                {t('dash_whats_new_badge')}
              </span>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#f8fafc' }}>{t('dash_whats_new_row')}</span>
            </div>
            <span style={{ fontSize: 13, color: '#94a3b8' }}>
              {t('whats_new_heading')} — {t('dash_whats_new_sub')}
            </span>
          </div>
          <span style={{ fontSize: 18, color: '#64748b', flexShrink: 0 }} aria-hidden>
            →
          </span>
        </button>
      )}

      {/* Summary bar */}
      {holdings.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('db_total_label')}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', marginTop: 4 }}>
              {currencySymbol}{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('db_unrealized_lbl')}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: totalUnrealized >= 0 ? '#22c55e' : '#ef4444', marginTop: 4 }}>
              {totalUnrealized >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(totalUnrealized).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {loading && holdings.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', padding: '24px 0' }}>
          <span style={{
            display: 'inline-block', width: 16, height: 16, borderRadius: '50%',
            border: '2px solid #1e293b', borderTopColor: '#22c55e',
            animation: 'spin 0.7s linear infinite',
          }} />
          {t('db_loading')}
        </div>
      )}
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      {!loading && holdings.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>{t('db_no_positions')}</div>
          <p style={{ marginBottom: 20 }}>{t('db_add_first')}</p>
          <Link href='/user/transactions' style={{ padding: '10px 22px', background: '#22c55e', borderRadius: 8, color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
            {t('db_go_transactions')}
          </Link>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {holdings.map((h: Holding) => (
          <PortfolioCard key={h.ticker} holding={h} />
        ))}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}
