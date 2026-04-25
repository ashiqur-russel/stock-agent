'use client'

import { useEffect, useRef } from 'react'

export default function BackgroundBeams({ className = '' }: { className?: string }) {
  return (
    <div
      className={className}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}
    >
      <svg
        viewBox='0 0 1440 900'
        xmlns='http://www.w3.org/2000/svg'
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <defs>
          <radialGradient id='beam-center' cx='50%' cy='30%' r='50%'>
            <stop offset='0%' stopColor='rgba(34,197,94,0.12)' />
            <stop offset='100%' stopColor='transparent' />
          </radialGradient>
          <filter id='beam-blur'>
            <feGaussianBlur stdDeviation='2' />
          </filter>
        </defs>
        <ellipse cx='720' cy='200' rx='600' ry='200' fill='url(#beam-center)' />
        {/* beam lines */}
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * Math.PI - Math.PI / 2
          const x2 = 720 + Math.cos(angle) * 900
          const y2 = 200 + Math.sin(angle) * 900
          return (
            <line
              key={i}
              x1='720' y1='200'
              x2={x2} y2={y2}
              stroke={`rgba(34,197,94,${0.03 + (i % 3) * 0.015})`}
              strokeWidth={i % 4 === 0 ? '1.5' : '0.5'}
              filter='url(#beam-blur)'
            />
          )
        })}
      </svg>
    </div>
  )
}
