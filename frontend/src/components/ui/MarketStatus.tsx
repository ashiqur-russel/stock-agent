'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { isStockMarketOpen } from '@/lib/marketHours'

interface Props {
  type?: 'stock' | 'crypto' | 'both'
  compact?: boolean
}

export default function MarketStatus({ type = 'stock', compact = false }: Props) {
  const { t, marketRegion } = useApp()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const tick = () => setOpen(isStockMarketOpen(marketRegion))
    tick()
    const interval = setInterval(tick, 30_000)
    return () => clearInterval(interval)
  }, [marketRegion])

  const hoursText =
    marketRegion === 'US' ? t('market_hours_us_caption') : t('market_hours_de_caption')

  if (type === 'crypto') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#22c55e',
            display: 'inline-block',
          }}
        />
        <span style={{ fontSize: compact ? 12 : 13, color: '#94a3b8' }}>{t('pt_crypto_always')}</span>
      </span>
    )
  }

  if (compact) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: open ? '#22c55e' : '#ef4444',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontSize: 12,
            color: open ? '#22c55e' : '#ef4444',
            display: 'inline-block',
            minWidth: '20ch',
            whiteSpace: 'nowrap',
          }}
        >
          {open ? t('pt_market_open') : t('pt_market_closed')}
        </span>
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: open ? '#22c55e' : '#ef4444',
            display: 'inline-block',
          }}
        />
        <span
          style={{
            fontSize: 14,
            color: open ? '#22c55e' : '#ef4444',
            fontWeight: 600,
            display: 'inline-block',
            minWidth: '20ch',
            whiteSpace: 'nowrap',
          }}
        >
          {open ? t('pt_market_open') : t('pt_market_closed')}
        </span>
      </div>
      {type === 'both' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: '#22c55e',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Crypto 24/7</span>
        </div>
      )}
      <span
        style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}
        title={t('pt_hours_label')}
      >
        {hoursText}
      </span>
    </div>
  )
}
