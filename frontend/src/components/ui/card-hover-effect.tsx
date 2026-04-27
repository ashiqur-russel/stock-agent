'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { cn } from '@/lib/utils'

export type HoverEffectItem = {
  id: string
  title: string
  description: string
  link: string
  icon?: string
}

export function HoverEffect({
  items,
  className,
}: {
  items: HoverEffectItem[]
  className?: string
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div
      className={cn(
        'grid grid-cols-1 py-10 md:grid-cols-2 lg:grid-cols-3',
        className
      )}
    >
      {items.map((item, idx) => (
        <a
          href={item.link}
          key={item.id}
          className='group relative block h-full w-full p-2'
          onMouseEnter={() => setHoveredIndex(idx)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === idx && (
              <motion.span
                className='absolute inset-0 block h-full w-full rounded-3xl bg-emerald-500/[0.12]'
                layoutId='hoverBackground'
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
          <Card>
            {item.icon ? (
              <div className='text-2xl' aria-hidden>
                {item.icon}
              </div>
            ) : null}
            <CardTitle className={item.icon ? '!mt-2' : undefined}>{item.title}</CardTitle>
            <CardDescription>{item.description}</CardDescription>
          </Card>
        </a>
      ))}
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
