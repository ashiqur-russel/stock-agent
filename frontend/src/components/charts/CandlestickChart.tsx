'use client'

import { useEffect, useRef } from 'react'
import type { IChartApi } from 'lightweight-charts'
import { market } from '@/lib/api'

interface Props {
  ticker: string
  height?: number
  period?: string
}

interface OHLCVBar {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export default function CandlestickChart({ ticker, height = 300, period = '3mo' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let chart: IChartApi | null = null

    const init = async () => {
      const { createChart, CandlestickSeries } = await import('lightweight-charts')

      if (!containerRef.current) return

      chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height,
        layout: { background: { color: '#020617' }, textColor: '#94a3b8' },
        grid: { vertLines: { color: '#1e293b' }, horzLines: { color: '#1e293b' } },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: '#1e293b' },
        timeScale: { borderColor: '#1e293b', timeVisible: true },
      })

      const series = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderUpColor: '#22c55e',
        borderDownColor: '#ef4444',
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      })

      try {
        const data = await market.history(ticker, period) as OHLCVBar[]
        const formatted = data
          .filter((bar) => bar.open && bar.high && bar.low && bar.close)
          .map((bar) => ({
            time: bar.date as unknown as import('lightweight-charts').Time,
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
          }))
          .sort((a, b) => (a.time > b.time ? 1 : -1))

        series.setData(formatted)
        chart.timeScale().fitContent()
      } catch {
        // silently fail if ticker not found
      }
    }

    init()

    return () => {
      chart?.remove()
    }
  }, [ticker, height, period])

  return <div ref={containerRef} style={{ width: '100%', height }} />
}
