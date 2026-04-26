'use client'

import { cn } from '@/lib/cn'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors cursor-pointer border-none'

const variants: Record<Variant, string> = {
  primary: 'shimmer-btn text-white',
  secondary: 'bg-transparent border border-brand text-brand hover:bg-brand/10',
  ghost: 'bg-surface-input border border-border-strong text-text-muted hover:border-brand hover:text-brand',
}

const sizes: Record<Size, string> = {
  sm: 'px-4 py-2 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(
        base,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        disabled && 'opacity-60 cursor-not-allowed',
        className,
      )}
    >
      {children}
    </button>
  )
}
