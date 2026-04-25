'use client'

import { useApp } from '@/contexts/AppContext'

const EUR_TO_USD = 1 / 0.91

interface AmountProps {
  eur: number
  usd?: number
  decimals?: number
  sign?: boolean
  abs?: boolean
  style?: React.CSSProperties
  className?: string
}

export default function Amount({ eur, usd, decimals = 2, sign = false, abs = false, style, className }: AmountProps) {
  const { currency, currencySymbol } = useApp()
  let val = currency === 'USD' ? (usd ?? eur * EUR_TO_USD) : eur
  if (abs) val = Math.abs(val)
  const prefix = sign && val > 0 ? '+' : ''
  return (
    <span style={style} className={className}>
      {prefix}{currencySymbol}{val.toFixed(decimals)}
    </span>
  )
}

interface AmountLocaleProps {
  eur: number
  usd?: number
  decimals?: number
  sign?: boolean
  style?: React.CSSProperties
  className?: string
}

export function AmountLocale({ eur, usd, decimals = 0, sign = false, style, className }: AmountLocaleProps) {
  const { currency, currencySymbol } = useApp()
  const val = currency === 'USD' ? (usd ?? eur * EUR_TO_USD) : eur
  const absVal = Math.abs(val)
  const prefix = sign ? (val < 0 ? '-' : '+') : val < 0 ? '-' : ''
  const formatted = absVal.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return (
    <span style={style} className={className}>
      {prefix}{currencySymbol}{formatted}
    </span>
  )
}
