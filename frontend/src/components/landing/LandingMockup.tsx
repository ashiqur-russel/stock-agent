'use client'

import { motion } from 'framer-motion'
import type { LandingTickerRow } from '@/lib/landingQuotes'

// ── fake SVG path data for the MacBook charts ──────────────────────────────
// SVG presentation attributes can't resolve CSS var(), so chart colors stay
// literal hex here.
const PATH1 = 'M0,80 L20,72 L40,68 L60,75 L80,58 L100,50 L120,55 L140,42 L160,35 L180,38 L200,28 L220,20 L240,25 L260,15 L280,10'
const PATH2 = 'M0,70 L20,65 L40,72 L60,60 L80,68 L100,55 L120,45 L140,50 L160,40 L180,30 L200,35 L220,22 L240,28 L260,18 L280,12'
const CANDLES = [
  [10,55,45,60,48],[30,42,50,52,40],[50,38,48,50,35],[70,30,42,44,28],
  [90,25,38,40,22],[110,28,35,37,25],[130,20,30,32,18],[150,15,25,27,12],
  [170,18,22,24,15],[190,12,20,22,10],[210,8,15,17,6],[230,10,14,16,8],
]

interface MockChartCardProps {
  sym: string
  name: string
  accent: string
  borderColor: string
  path: string
  gradientId: string
  /** Candle bodies use the accent unless a per-candle red/green split applies. */
  candleFill?: (close: number, open: number) => string
  badges: Array<[label: string, color: string]>
  quote: LandingTickerRow | undefined
  loading: boolean
  formatPair: (eur: number, usd: number) => string
}

function MockChartCard({
  sym,
  name,
  accent,
  borderColor,
  path,
  gradientId,
  candleFill,
  badges,
  quote,
  loading,
  formatPair,
}: MockChartCardProps) {
  return (
    <div style={{ background: 'rgba(4,10,24,0.8)', border: `1px solid ${borderColor}`, borderRadius: 10, padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text)' }}>{sym}</span>
          <span style={{ fontSize: 10, color: 'var(--color-border-strong)', marginLeft: 6 }}>{name}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text)' }}>
            {loading ? '…' : quote?.ok ? formatPair(quote.eur, quote.usd) : '—'}
          </div>
          <div
            style={{
              fontSize: 10,
              color: !quote?.ok
                ? 'var(--color-border-strong)'
                : quote.up
                  ? 'var(--color-brand)'
                  : 'var(--color-accent-red)',
              fontWeight: 600,
            }}
          >
            {loading
              ? '…'
              : quote?.ok
                ? `${quote.up ? '▲' : '▼'} ${quote.chgPct >= 0 ? '+' : ''}${quote.chgPct.toFixed(2)}%`
                : '—'}
          </div>
        </div>
      </div>
      <svg viewBox='0 0 280 90' style={{ width: '100%', height: 90 }}>
        <defs>
          <linearGradient id={gradientId} x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor={accent} stopOpacity='0.3' />
            <stop offset='100%' stopColor={accent} stopOpacity='0' />
          </linearGradient>
        </defs>
        <path d={`${path} L280,90 L0,90 Z`} fill={`url(#${gradientId})`} />
        <path d={path} fill='none' stroke={accent} strokeWidth='2' strokeLinejoin='round' />
        {CANDLES.map(([x, open, close, high, low], i) => (
          <g key={i}>
            <line x1={x} y1={high} x2={x} y2={low} stroke={accent} strokeWidth='1' opacity='0.5' />
            <rect
              x={x - 3.5}
              y={Math.min(open, close)}
              width={7}
              height={Math.max(1.5, Math.abs(close - open))}
              fill={candleFill ? candleFill(close, open) : accent}
              opacity='0.75'
              rx='0.5'
            />
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {badges.map(([label, color]) => (
          <span key={label} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color, fontWeight: 600 }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}

interface LandingMockupProps {
  tickerRows: LandingTickerRow[] | null
  loadingTickers: boolean
  formatPair: (eur: number, usd: number) => string
}

/** Floating MacBook mockup with two live-quote mini chart cards + chat bar. */
export default function LandingMockup({ tickerRows, loadingTickers, formatPair }: LandingMockupProps) {
  const qAapl = tickerRows?.find((r) => r.sym === 'AAPL')
  const qNvda = tickerRows?.find((r) => r.sym === 'NVDA')

  return (
    <section style={{ padding: '0 clamp(16px, 4vw, 32px) clamp(48px, 7vw, 80px)', display: 'flex', justifyContent: 'center' }}>
      {/* home-only float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-10px); }
        }
        .macbook-float { animation: float 6s ease-in-out infinite; }
      `}</style>
      <motion.div
        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        viewport={{ once: true }}
        className='macbook-float'
        style={{ maxWidth: 900, width: '100%' }}
      >
        {/* Screen */}
        <div style={{
          background: 'linear-gradient(145deg,#0d1a2e,#0a1220)',
          border: '1px solid rgba(34,197,94,0.12)',
          borderBottom: 'none',
          borderRadius: '20px 20px 0 0',
          padding: '14px 14px 0',
          boxShadow: '0 0 0 1px #1a2a3a, 0 40px 80px rgba(0,0,0,0.7), 0 0 60px rgba(34,197,94,0.06)',
        }}>
          {/* Camera */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1a2a3a', border: '1px solid #0d2040' }} />
          </div>

          {/* App screen */}
          <div style={{ background: '#060e20', borderRadius: '10px 10px 0 0', overflow: 'hidden', border: '1px solid rgba(34,197,94,0.1)' }}>

            {/* Fake navbar */}
            <div style={{ background: '#040a18', borderBottom: '1px solid rgba(34,197,94,0.08)', padding: '0 20px', height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13 }}>📈</span>
                <span style={{ fontSize: 11, fontWeight: 800, background: 'linear-gradient(90deg,#22c55e,#4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>StockAgent</span>
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['Dashboard', 'Transactions', 'AI Chat'].map((l) => (
                  <span key={l} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, background: l === 'Dashboard' ? 'rgba(34,197,94,0.12)' : 'transparent', color: l === 'Dashboard' ? 'var(--color-brand)' : 'var(--color-border-strong)', border: l === 'Dashboard' ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent' }}>
                    {l}
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#ef4444', '#f59e0b', '#22c55e'].map((c) => (
                  <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c, opacity: 0.8 }} />
                ))}
              </div>
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, padding: 18 }}>
              <MockChartCard
                sym='AAPL'
                name='Apple Inc.'
                accent='#22c55e'
                borderColor='rgba(34,197,94,0.12)'
                path={PATH1}
                gradientId='g1'
                candleFill={(close, open) => (close < open ? '#22c55e' : '#ef4444')}
                badges={[['RSI 58.4', '#f59e0b'], ['MACD ▲', '#22c55e'], ['BB MID', '#64748b']]}
                quote={qAapl}
                loading={loadingTickers}
                formatPair={formatPair}
              />
              <MockChartCard
                sym='NVDA'
                name='NVIDIA Corp.'
                accent='#3b82f6'
                borderColor='rgba(59,130,246,0.15)'
                path={PATH2}
                gradientId='g2'
                badges={[['RSI 72.1', '#ef4444'], ['MACD ▲', '#22c55e'], ['BB HIGH', '#f59e0b']]}
                quote={qNvda}
                loading={loadingTickers}
                formatPair={formatPair}
              />
            </div>

            {/* Chat bar */}
            <div style={{ borderTop: '1px solid rgba(34,197,94,0.08)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '7px 14px', fontSize: 10, color: 'var(--color-border-strong)' }}>
                Analyze AAPL for a swing trade...
              </div>
              <div style={{ background: 'linear-gradient(90deg,#16a34a,#22c55e)', borderRadius: 8, padding: '7px 16px', fontSize: 10, color: '#fff', fontWeight: 700 }}>Send</div>
            </div>
          </div>
        </div>

        {/* Hinge */}
        <div style={{ background: 'linear-gradient(to bottom,#0d1a2e,#070e1c)', height: 5, border: '1px solid #0d1a2e', borderTop: 'none', borderBottom: 'none' }} />

        {/* Base */}
        <div style={{ background: 'linear-gradient(to bottom,#0a1220,#070e1c)', height: 20, borderRadius: '0 0 14px 14px', border: '1px solid #0d1a2e', borderTop: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 70, height: 9, border: '1px solid #0d2040', borderRadius: 3, background: '#070e1c' }} />
        </div>
        <div style={{ height: 4, background: 'radial-gradient(ellipse,rgba(0,0,0,0.6) 0%,transparent 70%)' }} />
      </motion.div>
    </section>
  )
}
