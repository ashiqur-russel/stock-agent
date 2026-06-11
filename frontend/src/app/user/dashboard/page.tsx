'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { useApp } from '@/contexts/AppContext'
import { usePortfolio, type Holding } from '@/hooks/usePortfolio'
import { useLivePortfolioTotals } from '@/hooks/usePriceStream'
import PortfolioCard from '@/components/dashboard/PortfolioCard'
import PortfolioCardSkeleton from '@/components/dashboard/PortfolioCardSkeleton'
import MarketStatus from '@/components/ui/MarketStatus'
import { StatCell } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { release } from '@/lib/api'

const CARD_GRID: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(min(340px, 100%), 1fr))',
  gap: 20,
}

const fmtMoney = (v: number) =>
  v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

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

  const liveTotals = useLivePortfolioTotals(holdings)
  const totalValue = currency === 'USD' ? liveTotals.totalValueUsd : liveTotals.totalValueEur
  const totalUnrealized = currency === 'USD' ? liveTotals.totalUnrealizedUsd : liveTotals.totalUnrealizedEur

  const initialLoading = loading && holdings.length === 0

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t('nav_dashboard')}</h1>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <MarketStatus type='stock' />
          <span
            style={{
              fontSize: 12,
              color: 'var(--color-brand)',
              background: 'var(--color-surface-active)',
              border: '1px solid var(--color-brand-dark)',
              borderRadius: 10,
              padding: '2px 10px',
            }}
          >
            {t('db_live')}
          </span>
          <Button variant="outline" onClick={refresh} disabled={refreshing}>
            {refreshing && (
              <span
                aria-hidden
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  border: '2px solid var(--color-border-strong)',
                  borderTopColor: 'var(--color-brand)',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
            )}
            {t('db_refresh')}
          </Button>
        </div>
      </div>

      {whatsNewHighlight && (
        <button
          type="button"
          onClick={() => router.push('/user/dashboard?show_whats_new=1')}
          className="sa-focusable"
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
            <Sparkles size={22} color="var(--color-brand-light)" aria-hidden />
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
              <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-text)' }}>{t('dash_whats_new_row')}</span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              {t('whats_new_heading')} — {t('dash_whats_new_sub')}
            </span>
          </div>
          <span style={{ fontSize: 18, color: 'var(--color-text-dim)', flexShrink: 0 }} aria-hidden>
            →
          </span>
        </button>
      )}

      {/* Summary bar */}
      {holdings.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCell
            label={t('db_total_label')}
            variant="raised"
            valueStyle={{
              fontSize: 22,
              fontWeight: 700,
              color: totalValue > 0 ? 'var(--color-text)' : 'var(--color-text-dim)',
            }}
          >
            {totalValue > 0 ? `${currencySymbol}${fmtMoney(totalValue)}` : '—'}
          </StatCell>
          <StatCell
            label={t('db_unrealized_lbl')}
            variant="raised"
            valueStyle={{
              fontSize: 22,
              fontWeight: 700,
              color: totalUnrealized >= 0 ? 'var(--color-brand)' : 'var(--color-accent-red)',
            }}
          >
            {totalUnrealized >= 0 ? '+' : '-'}{currencySymbol}{fmtMoney(Math.abs(totalUnrealized))}
          </StatCell>
        </div>
      )}

      {error && <p style={{ color: 'var(--color-accent-red)' }}>{error}</p>}

      {!loading && holdings.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text-dim)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }} aria-hidden>📭</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 8 }}>{t('db_no_positions')}</div>
          <p style={{ marginBottom: 20 }}>{t('db_add_first')}</p>
          <Link
            href='/user/transactions'
            className="sa-focusable"
            style={{
              padding: '10px 22px',
              background: 'var(--color-brand)',
              borderRadius: 8,
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            {t('db_go_transactions')}
          </Link>
        </div>
      )}

      <div style={CARD_GRID}>
        {initialLoading
          ? Array.from({ length: 6 }, (_, i) => <PortfolioCardSkeleton key={i} />)
          : holdings.map((h: Holding) => <PortfolioCard key={h.ticker} holding={h} />)}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}
