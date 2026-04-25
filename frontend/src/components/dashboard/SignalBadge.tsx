'use client'

type Signal = 'BUY' | 'SELL' | 'HOLD' | null

interface Props {
  signal: Signal
}

const config: Record<NonNullable<Signal>, { bg: string; color: string; label: string }> = {
  BUY: { bg: '#052e16', color: '#22c55e', label: 'BUY' },
  SELL: { bg: '#2d0a0a', color: '#ef4444', label: 'SELL' },
  HOLD: { bg: '#1c1a00', color: '#eab308', label: 'HOLD' },
}

export default function SignalBadge({ signal }: Props) {
  if (!signal) return null
  const { bg, color, label } = config[signal]
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 6,
      background: bg,
      color,
      border: `1px solid ${color}`,
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: '0.05em',
    }}>
      {label}
    </span>
  )
}
