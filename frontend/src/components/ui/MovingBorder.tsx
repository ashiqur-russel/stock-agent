'use client'

import { useRef } from 'react'
import { motion, useAnimationFrame, useMotionTemplate, useMotionValue, useTransform } from 'framer-motion'

interface Props {
  children: React.ReactNode
  duration?: number
  rx?: string
  ry?: string
  style?: React.CSSProperties
  className?: string
  borderColor?: string
}

export default function MovingBorder({ children, duration = 2500, rx = '30%', ry = '30%', style, className, borderColor = 'rgba(34,197,94,0.8)' }: Props) {
  const pathRef = useRef<SVGRectElement>(null)
  const progress = useMotionValue<number>(0)

  useAnimationFrame((time) => {
    const length = pathRef.current?.getTotalLength()
    if (length) {
      const pxPerMs = length / duration
      progress.set((time * pxPerMs) % length)
    }
  })

  const x = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val)?.x ?? 0)
  const y = useTransform(progress, (val) => pathRef.current?.getPointAtLength(val)?.y ?? 0)
  const transform = useMotionTemplate`translateX(${x}px) translateY(${y}px) translateX(-50%) translateY(-50%)`

  return (
    <div style={{ position: 'relative', ...style }} className={className}>
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: 'inherit',
        overflow: 'hidden',
        padding: 1,
      }}>
        <svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='none' style={{ position: 'absolute', inset: 0, height: '100%', width: '100%' }}>
          <rect fill='none' width='100%' height='100%' rx={rx} ry={ry} ref={pathRef} />
        </svg>
        <motion.div
          style={{
            position: 'absolute',
            top: 0, left: 0,
            width: 80, height: 80,
            transform,
            background: `radial-gradient(circle, ${borderColor} 0%, transparent 60%)`,
          }}
        />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  )
}
