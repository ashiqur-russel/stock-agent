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
import { Card, StatCell } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

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
  // Convert the EUR cost basis with the same FX rate the quote shipped with,
  // so the USD figure matches the USD price/value columns.
  const eurRate = num(holding.eur_rate) || 0.91
  const realizedPnl = num(currency === 'USD' ? holding.realized_pnl_usd : holding.realized_pnl)

  return (
    <Card style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <button
          type="button"
          onClick={() => setDetailOpen(true)}
          className="sa-focusable"
          aria-label={`${holding.ticker} — ${t('pc_chart_details')}`}
          style={{
            cursor: 'pointer',
            minWidth: 0,
            background: 'transparent',
            border: 'none',
            padding: 0,
            textAlign: 'left',
            font: 'inherit',
            color: 'inherit',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-text)' }}>{holding.ticker}</span>
            <SignalBadge signal={holding.signal} />
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-dim)', marginTop: 2 }}>
            {shares.toFixed(4)} {t('pc_shares')}
          </div>
        </button>
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
            <span style={{ color: 'var(--color-text-dim)', marginLeft: 4 }}>today</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <StatCell
          label={t('pc_avg_cost')}
          valueStyle={{ fontSize: 14, color: 'var(--color-text)', fontWeight: 500 }}
        >
          {formatPrice(holding.avg_cost, holding.avg_cost / eurRate)}
        </StatCell>
        <StatCell label={t('pc_current')} valueStyle={{ fontSize: 14, fontWeight: 500 }}>
          <LivePrice
            ticker={holding.ticker}
            initialPriceEur={holding.current_price}
            initialPriceUsd={holding.current_price_usd}
          />
          <LiveQuoteExtendedHint ticker={holding.ticker} />
          <LiveUsListingRow ticker={holding.ticker} fallback={holding.us_listing} />
        </StatCell>
        <StatCell
          label={t('pc_unrealized')}
          valueStyle={{ fontSize: 14, display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'baseline' }}
        >
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
        </StatCell>
        <StatCell
          label={t('pc_realized')}
          valueStyle={{
            fontSize: 14,
            fontWeight: 600,
            color: realizedPnl >= 0 ? 'var(--color-brand)' : 'var(--color-accent-red)',
          }}
        >
          {realizedPnl >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(realizedPnl).toFixed(2)}
        </StatCell>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <Button
          variant="outline"
          onClick={() => router.push(`/user/agent?ticker=${holding.ticker}`)}
          style={{ flex: 1 }}
        >
          🤖 {t('pc_ask_ai')}
        </Button>
        <Button
          variant="outline"
          onClick={() => setDetailOpen(true)}
          title={t('pc_chart_details')}
          aria-label={t('pc_chart_details')}
        >
          📈
        </Button>
      </div>

      {detailOpen && (
        <StockDetailModal
          ticker={holding.ticker}
          onClose={() => setDetailOpen(false)}
          usListingFallback={holding.us_listing}
        />
      )}
    </Card>
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
