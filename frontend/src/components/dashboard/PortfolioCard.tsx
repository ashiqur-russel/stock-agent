'use client'

import { useRouter } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import type { Holding } from '@/hooks/usePortfolio'
import SignalBadge from './SignalBadge'
import CandlestickChart from '@/components/charts/CandlestickChart'
import { useState } from 'react'

interface Props {
  holding: Holding
}

function PnlText({ eur, usd, pct }: { eur: number; usd: number; pct: number }) {
  const { currency, currencySymbol } = useApp()
  const val = currency === 'USD' ? usd : eur
  const color = val >= 0 ? '#22c55e' : '#ef4444'
  const sign = val >= 0 ? '+' : ''
  return (
    <span style={{ color, fontWeight: 600, fontSize: 14 }}>
      {sign}{currencySymbol}{Math.abs(val).toFixed(2)} ({pct >= 0 ? '+' : ''}{pct.toFixed(2)}%)
    </span>
  )
}

export default function PortfolioCard({ holding }: Props) {
  const { t, formatPrice, currency, currencySymbol } = useApp()
  const router = useRouter()
  const [showChart, setShowChart] = useState(false)

  const marketValue = currency === 'USD' ? holding.market_value_usd : holding.market_value
  const dayColor = holding.day_change_pct >= 0 ? '#22c55e' : '#ef4444'

  return (
    <div style={{
      background: '#0f172a',
      border: '1px solid #1e293b',
      borderRadius: 12,
      padding: 20,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{holding.ticker}</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            {holding.shares_held.toFixed(4)} {t('pc_shares')}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 18, fontWeight: 600, color: '#f1f5f9' }}>
            {currencySymbol}{marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 13, color: dayColor }}>
            {holding.day_change_pct >= 0 ? '+' : ''}{holding.day_change_pct.toFixed(2)}% today
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div style={{ background: '#020617', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('pc_avg_cost')}</div>
          <div style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 500, marginTop: 2 }}>{formatPrice(holding.avg_cost, holding.avg_cost / 0.91)}</div>
        </div>
        <div style={{ background: '#020617', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('pc_current')}</div>
          <div style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 500, marginTop: 2 }}>{formatPrice(holding.current_price, holding.current_price_usd)}</div>
        </div>
        <div style={{ background: '#020617', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('pc_unrealized')}</div>
          <div style={{ marginTop: 2 }}>
            <PnlText eur={holding.unrealized_pnl} usd={holding.unrealized_pnl_usd} pct={holding.unrealized_pnl_pct} />
          </div>
        </div>
        <div style={{ background: '#020617', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('pc_realized')}</div>
          <div style={{ fontSize: 14, color: holding.realized_pnl >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600, marginTop: 2 }}>
            {holding.realized_pnl >= 0 ? '+' : ''}{currencySymbol}{(currency === 'USD' ? holding.realized_pnl_usd : holding.realized_pnl).toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => router.push(`/chat?ticker=${holding.ticker}`)}
          style={{
            flex: 1, padding: '8px 12px', background: '#1e293b', border: '1px solid #334155',
            borderRadius: 8, color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontWeight: 500,
          }}
        >
          🤖 {t('pc_ask_ai')}
        </button>
        <button
          onClick={() => setShowChart(!showChart)}
          style={{
            padding: '8px 14px', background: '#1e293b', border: '1px solid #334155',
            borderRadius: 8, color: '#94a3b8', fontSize: 13, cursor: 'pointer',
          }}
        >
          {showChart ? '▲' : '📈'}
        </button>
      </div>

      {showChart && (
        <div style={{ marginTop: 4, borderRadius: 8, overflow: 'hidden' }}>
          <CandlestickChart ticker={holding.ticker} height={200} />
        </div>
      )}
    </div>
  )
}
