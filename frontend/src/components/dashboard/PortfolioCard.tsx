'use client'

import { memo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import type { Holding } from '@/hooks/usePortfolio'
import {
  LivePrice,
  LiveDayChange,
  LiveMarketValue,
  LivePnL,
  LivePnLPct,
  LiveQuoteExtendedHint,
  LiveUsListingRow,
} from '@/components/ui/LivePrice'
import SignalBadge from '@/components/ui/SignalBadge'
import StockDetailModal from '@/components/stock/StockDetailModal'

interface Props {
  holding: Holding
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function PortfolioCardImpl({ holding }: Props) {
  const { t, formatPrice, currency, currencySymbol } = useApp()
  const router = useRouter()
  const [detailOpen, setDetailOpen] = useState(false)

  const shares = num(holding.shares_held)
  const marketValueEur = num(holding.market_value)
  const marketValueUsd = num(holding.market_value_usd)

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
        <div
          role="button"
          tabIndex={0}
          onClick={() => setDetailOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setDetailOpen(true)
            }
          }}
          style={{ cursor: 'pointer', minWidth: 0 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9' }}>{holding.ticker}</span>
            <SignalBadge signal={holding.signal} />
          </div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
            {shares.toFixed(4)} {t('pc_shares')}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {/* Market value uses the latest live price × shares so it ticks with
              the price stream rather than only updating on the slow 30s portfolio
              refresh. */}
          <div style={{ fontSize: 18, fontWeight: 600 }}>
            <LiveMarketValue
              ticker={holding.ticker}
              shares={shares}
              fallbackEur={marketValueEur}
              fallbackUsd={marketValueUsd}
            />
          </div>
          <div style={{ fontSize: 13, marginTop: 2 }}>
            <LiveDayChange ticker={holding.ticker} initialPct={num(holding.day_change_pct)} />
            <span style={{ color: '#64748b', marginLeft: 4 }}>today</span>
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
          <div style={{ fontSize: 14, fontWeight: 500, marginTop: 2 }}>
            <LivePrice
              ticker={holding.ticker}
              initialPriceEur={holding.current_price}
              initialPriceUsd={holding.current_price_usd}
            />
            <LiveQuoteExtendedHint ticker={holding.ticker} />
            <LiveUsListingRow ticker={holding.ticker} fallback={holding.us_listing} />
          </div>
        </div>
        <div style={{ background: '#020617', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('pc_unrealized')}</div>
          <div style={{ marginTop: 2, fontSize: 14, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'baseline' }}>
            <LivePnL
              ticker={holding.ticker}
              shares={shares}
              avgCostEur={num(holding.avg_cost)}
              fallbackEur={num(holding.unrealized_pnl)}
              fallbackUsd={num(holding.unrealized_pnl_usd)}
            />
            <LivePnLPct
              ticker={holding.ticker}
              avgCostEur={num(holding.avg_cost)}
              fallbackPct={num(holding.unrealized_pnl_pct)}
              parens
              muted
              style={{ fontSize: 12 }}
            />
          </div>
        </div>
        <div style={{ background: '#020617', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('pc_realized')}</div>
          <div style={{ fontSize: 14, color: num(holding.realized_pnl) >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600, marginTop: 2 }}>
            {num(holding.realized_pnl) >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(num(currency === 'USD' ? holding.realized_pnl_usd : holding.realized_pnl)).toFixed(2)}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => router.push(`/user/agent?ticker=${holding.ticker}`)}
          style={{
            flex: 1, padding: '8px 12px', background: '#1e293b', border: '1px solid #334155',
            borderRadius: 8, color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontWeight: 500,
          }}
        >
          🤖 {t('pc_ask_ai')}
        </button>
        <button
          onClick={() => setDetailOpen(true)}
          style={{
            padding: '8px 14px', background: '#1e293b', border: '1px solid #334155',
            borderRadius: 8, color: '#94a3b8', fontSize: 13, cursor: 'pointer',
          }}
          title="Chart & details"
        >
          📈
        </button>
      </div>

      {detailOpen && (
        <StockDetailModal
          ticker={holding.ticker}
          onClose={() => setDetailOpen(false)}
          usListingFallback={holding.us_listing}
        />
      )}
    </div>
  )
}

// Memoize so the 30s silent portfolio refresh doesn't re-render every card. As
// long as the persisted holding fields didn't actually change (e.g. shares,
// realized PnL), only the LivePrice / LiveDayChange children re-render.
function shallowHoldingEqual(a: Holding, b: Holding): boolean {
  return (
    a.ticker === b.ticker &&
    a.shares_held === b.shares_held &&
    a.avg_cost === b.avg_cost &&
    a.realized_pnl === b.realized_pnl &&
    a.realized_pnl_usd === b.realized_pnl_usd &&
    a.signal === b.signal
  )
}

const PortfolioCard = memo(PortfolioCardImpl, (prev, next) => shallowHoldingEqual(prev.holding, next.holding))
export default PortfolioCard
