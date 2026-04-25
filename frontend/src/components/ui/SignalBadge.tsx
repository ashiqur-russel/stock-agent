'use client'

import { useApp } from '@/contexts/AppContext'
import type { TranslationKey } from '@/lib/i18n'
import type { SwingSignal } from '@/hooks/usePortfolio'

interface Props {
  signal: SwingSignal | null | undefined
  size?: 'sm' | 'md'
}

const STYLES: Record<SwingSignal, { bg: string; border: string; color: string; label: TranslationKey }> = {
  strong_buy: {
    bg: '#052e16',
    border: '#16a34a',
    color: '#4ade80',
    label: 'signal_strong_buy',
  },
  potential_buy: {
    bg: '#0b231a',
    border: '#15803d',
    color: '#86efac',
    label: 'signal_potential_buy',
  },
  hold: {
    bg: '#1e293b',
    border: '#475569',
    color: '#cbd5e1',
    label: 'signal_hold',
  },
  potential_sell: {
    bg: '#2d1410',
    border: '#b91c1c',
    color: '#fca5a5',
    label: 'signal_potential_sell',
  },
  strong_sell: {
    bg: '#3b0a0a',
    border: '#dc2626',
    color: '#f87171',
    label: 'signal_strong_sell',
  },
}

/**
 * Pill-shaped badge that surfaces a swing-trade signal (strong_buy → strong_sell)
 * on portfolio / watchlist cards. Renders nothing when the backend hasn't yet
 * computed a signal for the ticker.
 */
export default function SignalBadge({ signal, size = 'sm' }: Props) {
  const { t } = useApp()
  if (!signal || !STYLES[signal]) return null
  const s = STYLES[signal]
  const padY = size === 'sm' ? 2 : 4
  const padX = size === 'sm' ? 8 : 12
  const fontSize = size === 'sm' ? 10 : 12
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 999,
        color: s.color,
        padding: `${padY}px ${padX}px`,
        fontSize,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        lineHeight: 1.2,
      }}
      title={t(s.label)}
    >
      {t(s.label)}
    </span>
  )
}
