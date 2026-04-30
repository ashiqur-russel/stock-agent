'use client'

import { useApp } from '@/contexts/AppContext'
import type { LandingTickerRow } from '@/lib/landingQuotes'

type Props = {
  scrollRows: LandingTickerRow[]
  loadingTickers: boolean
  formatPair: (eur: number, usd: number) => string
}

export default function LandingTicker({ scrollRows, loadingTickers, formatPair }: Props) {
  const { t } = useApp()

  return (
    <div
      style={{
        background: 'rgba(4,10,24,0.95)',
        borderBottom: '1px solid rgba(34,197,94,0.08)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      }}
    >
      <div style={{ height: 38, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div className='ticker-track'>
          {scrollRows.map((tk, i) => (
            <div
              key={`${tk.sym}-${i}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 24px',
                borderRight: '1px solid rgba(255,255,255,0.04)',
                whiteSpace: 'nowrap',
              }}
            >
              <span style={{ fontWeight: 700, fontSize: 12, color: '#e2e8f0', letterSpacing: '0.05em' }}>{tk.sym}</span>
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {loadingTickers ? '…' : tk.ok ? formatPair(tk.eur, tk.usd) : '—'}
              </span>
              <span style={{ fontSize: 11, fontWeight: 600, color: tk.ok ? (tk.up ? '#22c55e' : '#ef4444') : '#334155' }}>
                {loadingTickers ? '…' : tk.ok ? `${tk.up ? '▲' : '▼'} ${tk.chgPct.toFixed(2)}%` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ fontSize: 9, color: '#334155', textAlign: 'center', padding: '0 8px 4px' }}>{t('land_ticker_source')}</div>
    </div>
  )
}
