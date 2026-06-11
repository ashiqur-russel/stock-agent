'use client'

import type { CSSProperties } from 'react'

/**
 * Pulsing placeholder block (animation defined as .sa-skeleton in globals.css).
 * Size it like the content it stands in for to avoid layout shift.
 */
export default function Skeleton({
  width = '100%',
  height = 14,
  radius = 6,
  style,
}: {
  width?: number | string
  height?: number | string
  radius?: number
  style?: CSSProperties
}) {
  return (
    <span
      aria-hidden
      className="sa-skeleton"
      style={{ display: 'block', width, height, borderRadius: radius, ...style }}
    />
  )
}
