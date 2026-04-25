'use client'

import { useApp } from '@/contexts/AppContext'
import { usePortfolio, type Holding } from '@/hooks/usePortfolio'
import PortfolioCard from '@/components/dashboard/PortfolioCard'
import MarketStatus from '@/components/ui/MarketStatus'
import Link from 'next/link'

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function DashboardContent() {
  const { t, currency, currencySymbol } = useApp()
  const { holdings, loading, error, refresh } = usePortfolio()

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
          <button onClick={refresh} style={{ padding: '6px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
            {t('db_refresh')}
          </button>
        </div>
      </div>

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
              {totalUnrealized >= 0 ? '+' : ''}{currencySymbol}{Math.abs(totalUnrealized).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {loading && <p style={{ color: '#64748b' }}>{t('db_loading')}</p>}
      {error && <p style={{ color: '#ef4444' }}>{error}</p>}

      {!loading && holdings.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>{t('db_no_positions')}</div>
          <p style={{ marginBottom: 20 }}>{t('db_add_first')}</p>
          <Link href='/transactions' style={{ padding: '10px 22px', background: '#22c55e', borderRadius: 8, color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
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
