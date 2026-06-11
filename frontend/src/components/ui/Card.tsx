'use client'

import type { CSSProperties, ReactNode } from 'react'

/**
 * Themed surface primitives — the single source of card styling.
 *
 * `raised`  — standard panel on the page background (summary bars, portfolio
 *             cards, settings sections).
 * `sunken`  — inset cell on top of a raised card (the stat cells inside
 *             portfolio cards).
 */
type CardVariant = 'raised' | 'sunken'

const VARIANT_STYLES: Record<CardVariant, CSSProperties> = {
  raised: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border)',
    borderRadius: 12,
  },
  sunken: {
    background: 'var(--color-bg)',
    border: 'none',
    borderRadius: 8,
  },
}

interface CardProps {
  variant?: CardVariant
  padding?: number | string
  style?: CSSProperties
  children: ReactNode
}

export function Card({ variant = 'raised', padding = 20, style, children }: CardProps) {
  return <div style={{ ...VARIANT_STYLES[variant], padding, ...style }}>{children}</div>
}

/** The 11-12px uppercase label that titles every stat cell and summary card. */
export function CardLabel({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: 'var(--color-text-dim)',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/** Label + value cell used inside cards (sunken) and summary bars (raised). */
export function StatCell({
  label,
  variant = 'sunken',
  children,
  valueStyle,
}: {
  label: ReactNode
  variant?: CardVariant
  children: ReactNode
  valueStyle?: CSSProperties
}) {
  const padding = variant === 'sunken' ? '10px 12px' : '16px 20px'
  return (
    <Card variant={variant} padding={padding}>
      <CardLabel style={variant === 'raised' ? { fontSize: 12 } : undefined}>{label}</CardLabel>
      <div style={{ marginTop: variant === 'sunken' ? 2 : 4, ...valueStyle }}>{children}</div>
    </Card>
  )
}
