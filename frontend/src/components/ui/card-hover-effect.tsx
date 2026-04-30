'use client'

import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { cn } from '@/lib/utils'

export type HoverEffectItem = {
  id: string
  title: string
  description: string
  link: string
  icon?: string
  /** Optional handler (e.g. funnel intent) — runs on card click in addition to navigation */
  onClick?: () => void
}

function itemCellClass(idx: number, total: number, breakpoint: 'md' | 'lg'): string {
  if (breakpoint === 'lg') {
    const rem = total % 3
    const isLast = idx === total - 1
    const isSecondLast = idx === total - 2
    if (rem === 1 && isLast) {
      return 'lg:col-span-6 lg:flex lg:justify-center lg:px-2'
    }
    if (rem === 2 && (isSecondLast || isLast)) {
      return 'lg:col-span-3'
    }
    return 'lg:col-span-2'
  }
  const rem = total % 2
  const isLast = idx === total - 1
  if (rem === 1 && isLast) {
    return 'md:col-span-2 md:flex md:justify-center md:px-2'
  }
  return ''
}

export type HoverEffectVariant = 'default' | 'balanced4'

export function HoverEffect({
  items,
  className,
  variant = 'default',
}: {
  items: HoverEffectItem[]
  className?: string
  /** `balanced4`: 2×2 grid for exactly four items (wider cells, less “tall narrow” columns). */
  variant?: HoverEffectVariant
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  /** Unique per mount so `layoutId` never collides across pages / HMR (avoids FM runtime issues). */
  const hoverLayoutScope = useId().replace(/:/g, '')
  const n = items.length
  const balanced = variant === 'balanced4' && n === 4

  return (
    <div
      className={cn(
        balanced
          ? 'grid grid-cols-1 gap-3 py-4 sm:grid-cols-2 sm:gap-4'
          : 'grid grid-cols-1 py-10 md:grid-cols-2 lg:grid-cols-6',
        className
      )}
    >
      {items.map((item, idx) => {
        const isLgSingleOrphan = !balanced && n % 3 === 1 && idx === n - 1
        const isMdSingleOrphan = !balanced && n % 2 === 1 && idx === n - 1
        return (
          <a
            href={item.link}
            key={item.id}
            className={cn(
              'group relative block h-full w-full p-2',
              !balanced && itemCellClass(idx, n, 'md'),
              !balanced && itemCellClass(idx, n, 'lg')
            )}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            onClick={() => {
              try {
                item.onClick?.()
              } catch (err) {
                console.error('[HoverEffect] onClick', err)
              }
            }}
          >
            <AnimatePresence>
              {hoveredIndex === idx && (
                <motion.span
                  className='absolute inset-0 block h-full w-full rounded-3xl bg-emerald-500/[0.12]'
                  layoutId={`${hoverLayoutScope}-hover-bg`}
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: 1,
                    transition: { duration: 0.15 },
                  }}
                  exit={{
                    opacity: 0,
                    transition: { duration: 0.15, delay: 0.2 },
                  }}
                />
              )}
            </AnimatePresence>
            <Card
              className={cn(
                balanced && 'h-full',
                isLgSingleOrphan && 'w-full max-w-xl',
                isMdSingleOrphan &&
                  !isLgSingleOrphan &&
                  'w-full md:max-w-xl lg:max-w-none'
              )}
            >
              {item.icon ? (
                <div className='text-2xl' aria-hidden>
                  {item.icon}
                </div>
              ) : null}
              <CardTitle className={cn(item.icon && '!mt-2', balanced && '!mt-2 text-base leading-snug')}>{item.title}</CardTitle>
              <CardDescription className={balanced ? '!mt-3 text-sm leading-relaxed' : undefined}>
                {item.description}
              </CardDescription>
            </Card>
          </a>
        )
      })}
    </div>
  )
}

export function Card({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'relative z-20 h-full w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#060e20] group-hover:border-emerald-500/25',
        className
      )}
    >
      <div className='relative z-50 p-6'>{children}</div>
    </div>
  )
}

export function CardTitle({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <h4 className={cn('mt-4 font-bold tracking-wide text-slate-100', className)}>
      {children}
    </h4>
  )
}

export function CardDescription({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <p
      className={cn(
        'mt-6 text-sm font-normal leading-relaxed tracking-wide text-slate-400',
        className
      )}
    >
      {children}
    </p>
  )
}
