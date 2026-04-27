'use client'

import { useEffect, useRef } from 'react'
import type { IChartApi } from 'lightweight-charts'
import { market } from '@/lib/api'
import { useApp, priceDecimalsForValue } from '@/contexts/AppContext'

interface Props {
  ticker: string
  height?: number
  period?: string
}

interface OHLCVBar {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export default function CandlestickChart({ ticker, height = 300, period = '3mo' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { currency, currencySymbol, t } = useApp()

  useEffect(() => {
    if (!containerRef.current) return

    let chart: IChartApi | null = null
    const sym = currencySymbol

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
        localization: {
          priceFormatter: (p: number) => {
            const d = priceDecimalsForValue(p)
            return `${sym}${p.toLocaleString(undefined, {
              minimumFractionDigits: d,
              maximumFractionDigits: d,
            })}`
          },
        },
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
        const data = (await market.history(ticker, period, currency)) as OHLCVBar[]
        const formatted = data
          .filter((bar) => bar.open && bar.high && bar.low && bar.close)
          .map((bar) => ({
            time: bar.time as unknown as import('lightweight-charts').Time,
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
  }, [ticker, height, period, currency, currencySymbol, t])

  return (
    <div>
      <div ref={containerRef} style={{ width: '100%', height }} />
      <p
        style={{
          margin: '8px 0 0',
          fontSize: 10,
          color: '#64748b',
          lineHeight: 1.4,
        }}
      >
        {t('pc_chart_footnote')}
      </p>
    </div>
  )
}
