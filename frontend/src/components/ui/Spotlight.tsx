'use client'

import { useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface Props {
  className?: string
  fill?: string
}

export default function Spotlight({ className = '', fill = 'white' }: Props) {
  return (
    <svg
      className={className}
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 3787 2842'
      fill='none'
      style={{ position: 'absolute', pointerEvents: 'none', zIndex: 0 }}
    >
      <g filter='url(#filter)'>
        <ellipse cx='1924.71' cy='273.501' rx='1924.71' ry='273.501' transform='matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)' fill={fill} fillOpacity='0.21' />
      </g>
      <defs>
        <filter id='filter' x='0.860352' y='0.838989' width='3785.16' height='2840.26' filterUnits='userSpaceOnUse' colorInterpolationFilters='sRGB'>
          <feFlood floodOpacity='0' result='BackgroundImageFix' />
          <feBlend mode='normal' in='SourceGraphic' in2='BackgroundImageFix' result='shape' />
          <feGaussianBlur stdDeviation='151' result='effect1_foregroundBlur' />
        </filter>
      </defs>
    </svg>
  )
}

export function SpotlightCard({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const divRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [opacity, setOpacity] = useState(0)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return
    const rect = divRef.current.getBoundingClientRect()
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top })
  }, [])

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => { setIsFocused(true); setOpacity(1) }}
      onMouseLeave={() => { setIsFocused(false); setOpacity(0) }}
      style={{ position: 'relative', overflow: 'hidden', ...style }}
      className={className}
    >
      <div
        style={{
          position: 'absolute',
          inset: -1,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(34,197,94,0.15), transparent 40%)`,
          opacity,
          transition: 'opacity 0.3s',
          pointerEvents: 'none',
          zIndex: 1,
          borderRadius: 'inherit',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(300px circle at ${position.x}px ${position.y}px, rgba(34,197,94,0.06), transparent 40%)`,
          opacity,
          transition: 'opacity 0.3s',
          pointerEvents: 'none',
          zIndex: 2,
          borderRadius: 'inherit',
        }}
      />
      {children}
    </div>
  )
}
