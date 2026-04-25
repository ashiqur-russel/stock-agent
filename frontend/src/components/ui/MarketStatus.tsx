'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/contexts/AppContext'

interface Props {
  type?: 'stock' | 'crypto' | 'both'
  compact?: boolean
}

function isNYSEOpen(): boolean {
  const now = new Date()
  const nyTime = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: 'numeric',
    minute: 'numeric',
    weekday: 'short',
    hour12: false,
  }).formatToParts(now)

  const parts: Record<string, string> = {}
  nyTime.forEach((p) => { parts[p.type] = p.value })

  const day = parts['weekday']
  if (day === 'Sat' || day === 'Sun') return false

  const hours = parseInt(parts['hour'] ?? '0')
  const minutes = parseInt(parts['minute'] ?? '0')
  const totalMinutes = hours * 60 + minutes

  return totalMinutes >= 570 && totalMinutes < 960 // 9:30 to 16:00
}

export default function MarketStatus({ type = 'stock', compact = false }: Props) {
  const { t, lang } = useApp()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(isNYSEOpen())
    const interval = setInterval(() => setOpen(isNYSEOpen()), 30_000)
    return () => clearInterval(interval)
  }, [])

  const hoursText = lang === 'de' ? '15:30 – 22:00 Uhr (MEZ/MESZ)' : '9:30 AM – 4:00 PM ET (3:30 – 10:00 PM CET)'

  if (type === 'crypto') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
        <span style={{ fontSize: compact ? 12 : 13, color: '#94a3b8' }}>
          {t('pt_crypto_always')}
        </span>
      </span>
    )
  }

  if (compact) {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: open ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
        <span style={{ fontSize: 12, color: open ? '#22c55e' : '#ef4444' }}>
          {open ? t('pt_market_open') : t('pt_market_closed')}
        </span>
      </span>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 10, height: 10, borderRadius: '50%', background: open ? '#22c55e' : '#ef4444', display: 'inline-block' }} />
        <span style={{ fontSize: 14, color: open ? '#22c55e' : '#ef4444', fontWeight: 600 }}>
          {open ? t('pt_market_open') : t('pt_market_closed')}
        </span>
      </div>
      {type === 'both' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Crypto 24/7</span>
        </div>
      )}
      <span style={{ fontSize: 12, color: '#64748b' }}>{hoursText}</span>
    </div>
  )
}
