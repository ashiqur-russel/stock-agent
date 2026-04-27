'use client'

import { useEffect, useRef, useState } from 'react'
import type { CandlestickData, IChartApi, ISeriesApi, Time } from 'lightweight-charts'
import { useApp, priceDecimalsForValue } from '@/contexts/AppContext'

export interface OHLCVBar {
  time: string
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

interface Props {
  ticker: string
  height?: number
  period?: string
  /** Bars from parent (e.g. fetched in parallel with quote). */
  data: OHLCVBar[] | null
  /** True while history request is in flight. */
  loading: boolean
}

function formatBars(data: OHLCVBar[] | null): CandlestickData<Time>[] {
  if (!data?.length) return []
  return data
    .filter((bar) =>
      [bar.open, bar.high, bar.low, bar.close].every((v) => typeof v === 'number' && Number.isFinite(v))
    )
    .map((bar) => ({
      time: bar.time as Time,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      close: bar.close,
    }))
    .sort((a, b) => (String(a.time) > String(b.time) ? 1 : -1))
}

function applySeriesData(
  series: ISeriesApi<'Candlestick'>,
  chart: IChartApi,
  bars: OHLCVBar[] | null
) {
  const formatted = formatBars(bars)
  series.setData(formatted)
  if (formatted.length) chart.timeScale().fitContent()
}

/** Wait until flex layout gives the modal panel a non-zero width (avoids blank charts). */
async function waitForNonZeroWidth(el: HTMLElement, maxFrames = 45): Promise<number> {
  for (let i = 0; i < maxFrames; i++) {
    const w = Math.floor(el.getBoundingClientRect().width)
    if (w > 0) return w
    await new Promise<void>((r) => requestAnimationFrame(() => r()))
  }
  return Math.max(1, Math.floor(el.getBoundingClientRect().width))
}

export default function CandlestickChart({
  ticker,
  height = 300,
  period: _period = '3mo',
  data,
  loading,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const roRef = useRef<ResizeObserver | null>(null)
  const dataRef = useRef<OHLCVBar[] | null>(null)
  dataRef.current = data
  const { currency, currencySymbol, t } = useApp()
  const [chartSessionReady, setChartSessionReady] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    setChartSessionReady(false)
    let alive = true
    const sym = currencySymbol

    ;(async () => {
      const markSessionReady = () => {
        if (alive) setChartSessionReady(true)
      }
      try {
        const { createChart, CandlestickSeries } = await import('lightweight-charts')
        if (!alive || !containerRef.current) {
          markSessionReady()
          return
        }

        container.replaceChildren()

        const width = await waitForNonZeroWidth(container)
        if (!alive || !containerRef.current) {
          markSessionReady()
          return
        }

        const chart = createChart(container, {
          width,
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

        if (!alive) {
          chart.remove()
          return
        }

        const series = chart.addSeries(CandlestickSeries, {
          upColor: '#22c55e',
          downColor: '#ef4444',
          borderUpColor: '#22c55e',
          borderDownColor: '#ef4444',
          wickUpColor: '#22c55e',
          wickDownColor: '#ef4444',
        })

        chartRef.current = chart
        seriesRef.current = series

        applySeriesData(series, chart, dataRef.current)

        const ro = new ResizeObserver(() => {
          if (!alive || !chartRef.current || !containerRef.current) return
          const w = Math.floor(containerRef.current.getBoundingClientRect().width)
          if (w > 0) chart.resize(w, height)
        })
        ro.observe(container)
        roRef.current = ro
        markSessionReady()
      } catch {
        markSessionReady()
      }
    })()

    return () => {
      alive = false
      roRef.current?.disconnect()
      roRef.current = null
      chartRef.current?.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [ticker, height, currency, currencySymbol])

  useEffect(() => {
    const chart = chartRef.current
    const series = seriesRef.current
    if (!chart || !series) return
    applySeriesData(series, chart, data)
  }, [data])

  const formatted = formatBars(data)
  const showLoader = loading || !chartSessionReady
  const showEmptyHint = chartSessionReady && !loading && formatted.length === 0

  return (
    <div>
      <div style={{ position: 'relative', isolation: 'isolate', width: '100%', height }}>
        <div ref={containerRef} style={{ width: '100%', height, position: 'relative', zIndex: 0 }} />
        {showEmptyHint && (
          <div className="sa-chart-empty-panel">{t('pc_chart_empty')}</div>
        )}
        {showLoader && (
          <div
            className="sa-chart-loader-panel"
            role="status"
            aria-live="polite"
            aria-label={t('pc_chart_loading')}
          >
            <div className="sa-chart-spinner" aria-hidden />
            <span>{t('pc_chart_loading')}</span>
          </div>
        )}
      </div>
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
