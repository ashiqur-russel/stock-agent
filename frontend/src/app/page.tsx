'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { openCookieSettings } from '@/components/CookieBanner'
import { useApp } from '@/contexts/AppContext'
import { fetchPublicLandingQuotes } from '@/lib/api'
import Toggle from '@/components/ui/Toggle'
import GlowCard from '@/components/ui/GlowCard'
import BackgroundBeams from '@/components/ui/BackgroundBeams'
import { SpotlightCard } from '@/components/ui/Spotlight'

// Keep in sync with backend LANDING_TICKERS in `routers/public_landing.py`
const LANDING_ORDER = [
  'AAPL',
  'TSLA',
  'NVDA',
  'MSFT',
  'GOOGL',
  'AMZN',
  'META',
  'BTC-USD',
  'ETH-USD',
  'SPY',
  'QQQ',
  'AMD',
] as const

type LandingRow = {
  sym: string
  eur: number
  usd: number
  chgPct: number
  up: boolean
  ok: boolean
}

// ── fake SVG path data for MacBook charts ─────────────────────────────────
const PATH1 = 'M0,80 L20,72 L40,68 L60,75 L80,58 L100,50 L120,55 L140,42 L160,35 L180,38 L200,28 L220,20 L240,25 L260,15 L280,10'
const PATH2 = 'M0,70 L20,65 L40,72 L60,60 L80,68 L100,55 L120,45 L140,50 L160,40 L180,30 L200,35 L220,22 L240,28 L260,18 L280,12'
const CANDLES = [
  [10,55,45,60,48],[30,42,50,52,40],[50,38,48,50,35],[70,30,42,44,28],
  [90,25,38,40,22],[110,28,35,37,25],[130,20,30,32,18],[150,15,25,27,12],
  [170,18,22,24,15],[190,12,20,22,10],[210,8,15,17,6],[230,10,14,16,8],
]

const features = [
  { icon: '📊', title: 'Portfolio Tracking',   desc: 'Log every buy and sell. Auto-calculated holdings, average cost, and P&L in real time.' },
  { icon: '🤖', title: 'AI Swing Advisor',     desc: 'AI analyzes your stocks with live price data, RSI, MACD, and Bollinger Bands.' },
  { icon: '📈', title: 'Live Charts',           desc: 'Interactive candlestick charts powered by real Yahoo Finance data.' },
  { icon: '📝', title: 'Paper Trading',         desc: 'Practice with a virtual €100k account at real live prices. No risk.' },
  { icon: '🔔', title: 'Price Alerts',          desc: 'WebSocket push + email notifications when a stock hits your target.' },
  { icon: '🌍', title: 'EUR / USD',             desc: 'Instant currency toggle across every view. Rates updated live.' },
]

const steps = [
  { n: '1', title: 'Create your account', desc: 'Sign up free. No credit card required. Email verified in seconds.' },
  { n: '2', title: 'Add your holdings',   desc: 'Log buy and sell transactions. The portfolio calculates itself.' },
  { n: '3', title: 'Ask the AI',          desc: 'Chat about any stock. The AI fetches live data and gives you a swing trading setup.' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0 },
}

export default function Home() {
  const { t, lang, setLang, currency, setCurrency, currencySymbol } = useApp()
  const [tickerRows, setTickerRows] = useState<LandingRow[] | null>(null)

  const loadQuotes = useCallback(() => {
    fetchPublicLandingQuotes()
      .then((data) => {
        setTickerRows(
          data.quotes.map((q) => {
            const chg = typeof q.day_change_pct === 'number' ? q.day_change_pct : 0
            const ok = q.ok === true
            return {
              sym: (q.ticker || '').toUpperCase(),
              eur: q.current_price ?? 0,
              usd: q.current_price_usd ?? 0,
              chgPct: chg,
              up: chg >= 0,
              ok,
            }
          })
        )
      })
      .catch(() => {
        setTickerRows(
          LANDING_ORDER.map((sym) => ({
            sym,
            eur: 0,
            usd: 0,
            chgPct: 0,
            up: true,
            ok: false,
          }))
        )
      })
  }, [])

  useEffect(() => {
    loadQuotes()
    const id = setInterval(loadQuotes, 60_000)
    return () => clearInterval(id)
  }, [loadQuotes])

  // When language changes, auto-switch currency to match region expectation
  const handleLangChange = (v: string) => {
    const l = v.toLowerCase() as 'en' | 'de'
    setLang(l)
    setCurrency(l === 'de' ? 'EUR' : 'USD')
  }

  const formatPair = (eur: number, usd: number) => {
    const val = currency === 'USD' ? usd : eur
    if (val >= 10000) return `${currencySymbol}${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    if (val >= 1000) return `${currencySymbol}${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
    return `${currencySymbol}${val.toFixed(2)}`
  }

  const loadingTickers = tickerRows === null
  const scrollRows = useMemo(() => {
    const base: LandingRow[] =
      tickerRows && tickerRows.length > 0
        ? tickerRows
        : LANDING_ORDER.map((sym) => ({
            sym,
            eur: 0,
            usd: 0,
            chgPct: 0,
            up: true,
            ok: false,
          }))
    return [...base, ...base]
  }, [tickerRows])
  const qAapl = tickerRows?.find((r) => r.sym === 'AAPL')
  const qNvda = tickerRows?.find((r) => r.sym === 'NVDA')

  return (
    <div style={{ minHeight: '100vh', background: '#060e20', color: '#f1f5f9', fontFamily: 'var(--font-geist-sans)', overflowX: 'hidden' }}>

      {/* ── CSS animations ── */}
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-scroll 45s linear infinite;
        }
        .ticker-track:hover { animation-play-state: paused; }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-10px); }
        }
        .macbook-float { animation: float 6s ease-in-out infinite; }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
          50%       { opacity: 0.6; box-shadow: 0 0 0 6px rgba(34,197,94,0); }
        }
        .live-dot { animation: pulse-dot 2s ease-in-out infinite; }

        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shimmer-btn {
          background: linear-gradient(90deg, #16a34a, #22c55e, #4ade80, #22c55e, #16a34a);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(6,14,32,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(34,197,94,0.1)',
        padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20 }}>📈</span>
          <span style={{ fontSize: 17, fontWeight: 800, background: 'linear-gradient(90deg,#22c55e,#4ade80)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            StockAgent
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Toggle options={['EN', 'DE']} value={lang.toUpperCase()} onChange={handleLangChange} activeColor='#3b82f6' />
          <Link href='/docs'     style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>{t('land_docs')}</Link>
          <Link href='/login'    style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none' }}>{t('land_signin')}</Link>
          <Link href='/register' className='shimmer-btn' style={{ padding: '8px 20px', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
            {t('land_get_started')}
          </Link>
        </div>
      </nav>

      {/* ── Ticker Strip (live quotes via public API) ── */}
      <div style={{
        background: 'rgba(4,10,24,0.95)',
        borderBottom: '1px solid rgba(34,197,94,0.08)',
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'stretch',
      }}>
        <div style={{ height: 38, display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
          <div className='ticker-track'>
            {scrollRows.map((tk, i) => (
              <div key={`${tk.sym}-${i}`} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '0 24px',
                borderRight: '1px solid rgba(255,255,255,0.04)',
                whiteSpace: 'nowrap',
              }}>
                <span style={{ fontWeight: 700, fontSize: 12, color: '#e2e8f0', letterSpacing: '0.05em' }}>{tk.sym}</span>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  {loadingTickers
                    ? '…'
                    : tk.ok
                      ? formatPair(tk.eur, tk.usd)
                      : '—'}
                </span>
                <span style={{ fontSize: 11, fontWeight: 600, color: tk.ok ? (tk.up ? '#22c55e' : '#ef4444') : '#334155' }}>
                  {loadingTickers
                    ? '…'
                    : tk.ok
                      ? `${tk.up ? '▲' : '▼'} ${tk.chgPct.toFixed(2)}%`
                      : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 9, color: '#334155', textAlign: 'center', padding: '0 8px 4px' }}>
          {t('land_ticker_source')}
        </div>
      </div>

      {/* ── Hero ── */}
      <section style={{ position: 'relative', textAlign: 'center', padding: '90px 32px 60px', overflow: 'hidden' }}>
        <BackgroundBeams />

        <motion.div
          initial='hidden' animate='show'
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          style={{ position: 'relative', zIndex: 1 }}
        >
          <motion.div variants={fadeUp}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 20, padding: '5px 16px', fontSize: 12, color: '#22c55e', fontWeight: 600, marginBottom: 28, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              <span className='live-dot' style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', display: 'inline-block', flexShrink: 0 }} />
              {t('land_badge')}
            </div>
          </motion.div>

          <motion.h1 variants={fadeUp} style={{ fontSize: 'clamp(34px, 5.5vw, 64px)', fontWeight: 900, margin: '0 0 22px', lineHeight: 1.08, letterSpacing: '-0.02em' }}>
            <span style={{ background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block' }}>
              Smart Stock Portfolio
            </span>
            <span style={{ background: 'linear-gradient(135deg, #22c55e 0%, #4ade80 50%, #22c55e 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'block' }}>
              with AI Advisor
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} style={{ fontSize: 18, color: '#64748b', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.75 }}>
            {t('land_hero_sub')}
          </motion.p>

          <motion.div variants={fadeUp} style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href='/register' className='shimmer-btn' style={{ padding: '14px 34px', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 32px rgba(34,197,94,0.4), 0 0 60px rgba(34,197,94,0.15)', display: 'inline-block' }}>
              {t('land_cta_start')}
            </Link>
            <Link href='/docs' style={{ padding: '14px 34px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: '#94a3b8', fontSize: 15, textDecoration: 'none', backdropFilter: 'blur(4px)', display: 'inline-block' }}>
              {t('land_cta_docs')}
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── MacBook Mockup ── */}
      <section style={{ padding: '0 32px 80px', display: 'flex', justifyContent: 'center' }}>
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
                    <span key={l} style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, background: l === 'Dashboard' ? 'rgba(34,197,94,0.12)' : 'transparent', color: l === 'Dashboard' ? '#22c55e' : '#334155', border: l === 'Dashboard' ? '1px solid rgba(34,197,94,0.2)' : '1px solid transparent' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, padding: 18 }}>
                {/* AAPL */}
                <div style={{ background: 'rgba(4,10,24,0.8)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>AAPL</span>
                      <span style={{ fontSize: 10, color: '#334155', marginLeft: 6 }}>Apple Inc.</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
                        {loadingTickers
                          ? '…'
                          : qAapl?.ok
                            ? formatPair(qAapl.eur, qAapl.usd)
                            : '—'}
                      </div>
                      <div style={{
                        fontSize: 10,
                        color: !qAapl?.ok
                          ? '#334155'
                          : qAapl.up
                            ? '#22c55e'
                            : '#ef4444',
                        fontWeight: 600,
                      }}>
                        {loadingTickers
                          ? '…'
                          : qAapl?.ok
                            ? `${qAapl.up ? '▲' : '▼'} ${qAapl.chgPct >= 0 ? '+' : ''}${qAapl.chgPct.toFixed(2)}%`
                            : '—'}
                      </div>
                    </div>
                  </div>
                  <svg viewBox='0 0 280 90' style={{ width: '100%', height: 90 }}>
                    <defs>
                      <linearGradient id='g1' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='#22c55e' stopOpacity='0.3' />
                        <stop offset='100%' stopColor='#22c55e' stopOpacity='0' />
                      </linearGradient>
                    </defs>
                    <path d={`${PATH1} L280,90 L0,90 Z`} fill='url(#g1)' />
                    <path d={PATH1} fill='none' stroke='#22c55e' strokeWidth='2' strokeLinejoin='round' />
                    {CANDLES.map(([x, open, close, high, low], i) => (
                      <g key={i}>
                        <line x1={x} y1={high} x2={x} y2={low} stroke='#22c55e' strokeWidth='1' opacity='0.5' />
                        <rect x={x-3.5} y={Math.min(open,close)} width={7} height={Math.max(1.5,Math.abs(close-open))} fill={close<open?'#22c55e':'#ef4444'} opacity='0.75' rx='0.5' />
                      </g>
                    ))}
                  </svg>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {[['RSI 58.4','#f59e0b'],['MACD ▲','#22c55e'],['BB MID','#64748b']].map(([label,color]) => (
                      <span key={label as string} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: color as string, fontWeight: 600 }}>{label}</span>
                    ))}
                  </div>
                </div>

                {/* NVDA */}
                <div style={{ background: 'rgba(4,10,24,0.8)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 13, fontWeight: 800, color: '#f1f5f9' }}>NVDA</span>
                      <span style={{ fontSize: 10, color: '#334155', marginLeft: 6 }}>NVIDIA Corp.</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>
                        {loadingTickers
                          ? '…'
                          : qNvda?.ok
                            ? formatPair(qNvda.eur, qNvda.usd)
                            : '—'}
                      </div>
                      <div style={{
                        fontSize: 10,
                        color: !qNvda?.ok
                          ? '#334155'
                          : qNvda.up
                            ? '#22c55e'
                            : '#ef4444',
                        fontWeight: 600,
                      }}>
                        {loadingTickers
                          ? '…'
                          : qNvda?.ok
                            ? `${qNvda.up ? '▲' : '▼'} ${qNvda.chgPct >= 0 ? '+' : ''}${qNvda.chgPct.toFixed(2)}%`
                            : '—'}
                      </div>
                    </div>
                  </div>
                  <svg viewBox='0 0 280 90' style={{ width: '100%', height: 90 }}>
                    <defs>
                      <linearGradient id='g2' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='#3b82f6' stopOpacity='0.3' />
                        <stop offset='100%' stopColor='#3b82f6' stopOpacity='0' />
                      </linearGradient>
                    </defs>
                    <path d={`${PATH2} L280,90 L0,90 Z`} fill='url(#g2)' />
                    <path d={PATH2} fill='none' stroke='#3b82f6' strokeWidth='2' strokeLinejoin='round' />
                    {CANDLES.map(([x, open, close, high, low], i) => (
                      <g key={i}>
                        <line x1={x} y1={high} x2={x} y2={low} stroke='#3b82f6' strokeWidth='1' opacity='0.5' />
                        <rect x={x-3.5} y={Math.min(open,close)} width={7} height={Math.max(1.5,Math.abs(close-open))} fill='#3b82f6' opacity='0.75' rx='0.5' />
                      </g>
                    ))}
                  </svg>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                    {[['RSI 72.1','#ef4444'],['MACD ▲','#22c55e'],['BB HIGH','#f59e0b']].map(([label,color]) => (
                      <span key={label as string} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: color as string, fontWeight: 600 }}>{label}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Chat bar */}
              <div style={{ borderTop: '1px solid rgba(34,197,94,0.08)', padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '7px 14px', fontSize: 10, color: '#334155' }}>
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

      {/* ── Features ── */}
      <section style={{ padding: '60px 32px 80px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.div
          initial='hidden' whileInView='show'
          variants={{ show: { transition: { staggerChildren: 0.08 } } }}
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 52 }}>
            <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>{t('land_what_label')}</div>
            <h2 style={{ fontSize: 34, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>{t('land_what_title')}</h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp}>
                <GlowCard style={{ padding: '22px 24px', height: '100%' }}>
                  <div style={{ fontSize: 30, marginBottom: 12 }}>{f.icon}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 7, color: '#f1f5f9' }}>{f.title}</div>
                  <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.65 }}>{f.desc}</div>
                </GlowCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── How it works ── */}
      <section style={{ padding: '60px 32px', background: 'rgba(4,10,24,0.6)', borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
        <motion.div
          initial='hidden' whileInView='show'
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          viewport={{ once: true, margin: '-80px' }}
          style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}
        >
          <motion.div variants={fadeUp}>
            <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>{t('land_how_label')}</div>
            <h2 style={{ fontSize: 34, fontWeight: 800, margin: '0 0 44px', letterSpacing: '-0.02em' }}>{t('land_how_title')}</h2>
          </motion.div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {steps.map((s) => (
              <motion.div key={s.n} variants={fadeUp}>
                <SpotlightCard style={{ background: '#0a1628', border: '1px solid #0d2040', borderRadius: 14, padding: 22, textAlign: 'left', display: 'flex', gap: 18, alignItems: 'flex-start' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#16a34a,#22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 17, fontWeight: 800, color: '#fff', boxShadow: '0 0 16px rgba(34,197,94,0.4)' }}>
                    {s.n}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 5, color: '#f1f5f9' }}>{s.title}</div>
                    <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                </SpotlightCard>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '90px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, margin: '0 0 14px', letterSpacing: '-0.02em' }}>{t('land_ready')}</h2>
          <p style={{ color: '#475569', marginBottom: 36, fontSize: 16 }}>{t('land_free')}</p>
          <Link href='/register' className='shimmer-btn' style={{ padding: '15px 44px', borderRadius: 12, color: '#fff', fontSize: 16, fontWeight: 700, textDecoration: 'none', boxShadow: '0 0 40px rgba(34,197,94,0.4)', display: 'inline-block' }}>
            {t('land_cta_create')}
          </Link>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '22px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, background: '#040a18' }}>
        <span style={{ fontSize: 12, color: '#1e3050' }}>{t('land_disclaimer')}</span>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {[{ href: '/docs', label: t('land_docs') }, { href: '/privacy', label: t('cookie_privacy_link') }, { href: '/login', label: t('land_signin') }, { href: '/register', label: t('land_register') }].map((l) => (
            <Link key={l.href} href={l.href} style={{ fontSize: 13, color: '#334155', textDecoration: 'none' }}>{l.label}</Link>
          ))}
          <button onClick={openCookieSettings} style={{ fontSize: 13, color: '#334155', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            🍪 {t('cookie_open_settings')}
          </button>
        </div>
      </footer>
    </div>
  )
}
