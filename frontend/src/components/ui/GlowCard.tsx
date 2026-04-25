'use client'

import { useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  glowColor?: string
  style?: React.CSSProperties
  className?: string
}

export default function GlowCard({ children, glowColor = 'rgba(34,197,94,0.15)', style, className }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [hover, setHover] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: '#0a1628',
        border: `1px solid ${hover ? 'rgba(34,197,94,0.3)' : '#0d2040'}`,
        borderRadius: 12,
        transition: 'border-color 0.3s',
        ...style,
      }}
      className={className}
    >
      {hover && (
        <div
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            zIndex: 0,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 60%)`,
            transform: `translate(${pos.x - 150}px, ${pos.y - 150}px)`,
            transition: 'none',
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  )
}
