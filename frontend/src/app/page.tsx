'use client'

import Link from 'next/link'
import { useApp } from '@/contexts/AppContext'
import Toggle from '@/components/ui/Toggle'

// ── ticker data (static – public page, no auth required) ──────────────────
const TICKERS = [
  { sym: 'AAPL',  price: '195.20', chg: '+1.24%', up: true  },
  { sym: 'TSLA',  price: '178.80', chg: '-2.31%', up: false },
  { sym: 'NVDA',  price: '875.40', chg: '+3.05%', up: true  },
  { sym: 'MSFT',  price: '420.60', chg: '+0.87%', up: true  },
  { sym: 'GOOGL', price: '172.30', chg: '-0.45%', up: false },
  { sym: 'AMZN',  price: '185.90', chg: '+1.60%', up: true  },
  { sym: 'META',  price: '510.20', chg: '+2.18%', up: true  },
  { sym: 'BTC-USD', price: '67,420', chg: '+4.32%', up: true },
  { sym: 'ETH-USD', price: '3,520',  chg: '+3.10%', up: true },
  { sym: 'SPY',   price: '528.10', chg: '+0.62%', up: true  },
  { sym: 'QQQ',   price: '446.70', chg: '+0.95%', up: true  },
  { sym: 'AMD',   price: '162.40', chg: '-1.20%', up: false },
]

// ── fake SVG chart paths for MacBook mockup ───────────────────────────────
const CHART_PATH_1 = 'M0,80 L20,72 L40,68 L60,75 L80,58 L100,50 L120,55 L140,42 L160,35 L180,38 L200,28 L220,20 L240,25 L260,15 L280,10'
const CHART_PATH_2 = 'M0,70 L20,65 L40,72 L60,60 L80,68 L100,55 L120,45 L140,50 L160,40 L180,30 L200,35 L220,22 L240,28 L260,18 L280,12'
const CANDLES = [
  [10,55,45,60,48],[30,42,50,52,40],[50,38,48,50,35],[70,30,42,44,28],
  [90,25,38,40,22],[110,28,35,37,25],[130,20,30,32,18],[150,15,25,27,12],
  [170,18,22,24,15],[190,12,20,22,10],[210,8,15,17,6],[230,10,14,16,8],
  [250,6,12,14,4],[270,4,10,12,2],
]

const features = [
  { icon: '📊', title: 'Portfolio Tracking',  desc: 'Log every buy and sell. Auto-calculated holdings, average cost, and P&L.' },
  { icon: '🤖', title: 'AI Swing Advisor',    desc: 'AI analyzes your stocks with live price data and technical indicators.' },
  { icon: '📈', title: 'Live Charts',          desc: 'Candlestick charts powered by real Yahoo Finance data.' },
  { icon: '📝', title: 'Paper Trading',        desc: 'Practice with a virtual €100k account before risking real money.' },
  { icon: '🔔', title: 'Price Alerts',         desc: 'WebSocket push + email when a stock hits your target price.' },
  { icon: '🌍', title: 'Multi-currency',       desc: 'Switch between EUR and USD instantly. All values convert in real time.' },
]

const steps = [
  { n: '1', title: 'Create your account', desc: 'Sign up for free. No credit card required.' },
  { n: '2', title: 'Add your holdings',   desc: 'Log your buy and sell transactions. The portfolio builds itself.' },
  { n: '3', title: 'Ask the AI',          desc: 'Type any question about a stock. The AI uses live data to give you swing trading advice.' },
]

export default function Home() {
  const { t, lang, setLang } = useApp()
  // Duplicate ticker list so the CSS loop is seamless
  const tickerRow = [...TICKERS, ...TICKERS]

  return (
    <div style={{ minHeight: '100vh', background: '#060e20', color: '#f1f5f9', fontFamily: 'var(--font-geist-sans)', overflowX: 'hidden' }}>

      {/* ── CSS animations ─────────────────────────────────────────── */}
      <style>{`
        @keyframes ticker-scroll {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          width: max-content;
          animation: ticker-scroll 40s linear infinite;
        }
        .ticker-track:hover { animation-play-state: paused; }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        .macbook-float { animation: float 5s ease-in-out infinite; }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
        .live-dot { animation: pulse-dot 1.5s ease-in-out infinite; }
      `}</style>

      {/* ── Navbar ──────────────────────────────────────────────────── */}
      <nav style={{
        padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid #0d2040',
        background: 'rgba(6,14,32,0.95)',
        position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(8px)',
      }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>📈 StockAgent</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Toggle options={['EN', 'DE']} value={lang.toUpperCase()} onChange={(v) => setLang(v.toLowerCase() as 'en' | 'de')} activeColor='#3b82f6' />
          <Link href='/docs'     style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none' }}>{t('land_docs')}</Link>
          <Link href='/login'    style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none' }}>{t('land_signin')}</Link>
          <Link href='/register' style={{ padding: '8px 18px', background: '#22c55e', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            {t('land_get_started')}
          </Link>
        </div>
      </nav>

      {/* ── Ticker Strip ────────────────────────────────────────────── */}
      <div style={{
        background: '#080f1e',
        borderBottom: '1px solid #0d2040',
        overflow: 'hidden',
        height: 36,
        display: 'flex',
        alignItems: 'center',
      }}>
        <div className='ticker-track'>
          {tickerRow.map((tk, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '0 28px',
              borderRight: '1px solid #0d2040',
              whiteSpace: 'nowrap',
            }}>
              <span style={{ fontWeight: 700, fontSize: 12, color: '#f1f5f9', letterSpacing: '0.04em' }}>
                {tk.sym}
              </span>
              <span style={{ fontSize: 12, color: '#94a3b8' }}>${tk.price}</span>
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: tk.up ? '#22c55e' : '#ef4444',
              }}>
                {tk.up ? '▲' : '▼'} {tk.chg}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section style={{ textAlign: 'center', padding: '80px 32px 60px', position: 'relative' }}>
        {/* background glow */}
        <div style={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 600, height: 300, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(34,197,94,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#0d2d0d', border: '1px solid #166534', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#22c55e', fontWeight: 600, marginBottom: 24, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          <span className='live-dot' style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
          {t('land_badge')}
        </div>

        <h1 style={{ fontSize: 'clamp(32px, 5vw, 60px)', fontWeight: 800, margin: '0 0 20px', lineHeight: 1.1, whiteSpace: 'pre-line' }}>
          {t('land_hero_title')}
        </h1>
        <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.7 }}>
          {t('land_hero_sub')}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href='/register' style={{ padding: '13px 30px', background: '#22c55e', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none', boxShadow: '0 0 24px rgba(34,197,94,0.3)' }}>
            {t('land_cta_start')}
          </Link>
          <Link href='/docs' style={{ padding: '13px 30px', background: 'transparent', border: '1px solid #1e3050', borderRadius: 8, color: '#f1f5f9', fontSize: 15, textDecoration: 'none' }}>
            {t('land_cta_docs')}
          </Link>
        </div>
      </section>

      {/* ── MacBook Mockup ───────────────────────────────────────────── */}
      <section style={{ padding: '20px 32px 80px', display: 'flex', justifyContent: 'center' }}>
        <div className='macbook-float' style={{ maxWidth: 880, width: '100%' }}>

          {/* Screen */}
          <div style={{
            background: '#0a1628',
            border: '8px solid #1a2a3a',
            borderBottom: 'none',
            borderRadius: '16px 16px 0 0',
            padding: '20px 20px 0',
            boxShadow: '0 0 60px rgba(34,197,94,0.08), 0 40px 80px rgba(0,0,0,0.6)',
            position: 'relative',
          }}>
            {/* Camera dot */}
            <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: '#1e3050' }} />

            {/* Fake app UI inside screen */}
            <div style={{ background: '#060e20', borderRadius: '8px 8px 0 0', overflow: 'hidden', border: '1px solid #0d2040' }}>

              {/* Fake nav bar */}
              <div style={{ background: '#080f1e', borderBottom: '1px solid #0d2040', padding: '0 16px', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e' }}>📈 StockAgent</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['Dashboard', 'Transactions', 'AI Chat'].map((l) => (
                    <span key={l} style={{ fontSize: 9, padding: '2px 8px', borderRadius: 4, background: l === 'Dashboard' ? '#0d2a1a' : 'transparent', color: l === 'Dashboard' ? '#22c55e' : '#475569' }}>{l}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 5 }}>
                  {['#ef4444','#eab308','#22c55e'].map((c) => (
                    <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
                  ))}
                </div>
              </div>

              {/* Two charts side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: 16 }}>
                {/* Chart 1 — AAPL */}
                <div style={{ background: '#080f1e', border: '1px solid #0d2040', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#f1f5f9' }}>AAPL</span>
                      <span style={{ fontSize: 9, color: '#64748b', marginLeft: 6 }}>Apple Inc.</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#f1f5f9' }}>$195.20</div>
                      <div style={{ fontSize: 9, color: '#22c55e' }}>▲ +1.24%</div>
                    </div>
                  </div>
                  {/* SVG line chart */}
                  <svg viewBox='0 0 280 90' style={{ width: '100%', height: 90 }}>
                    <defs>
                      <linearGradient id='g1' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='#22c55e' stopOpacity='0.25' />
                        <stop offset='100%' stopColor='#22c55e' stopOpacity='0' />
                      </linearGradient>
                    </defs>
                    <path d={`${CHART_PATH_1} L280,90 L0,90 Z`} fill='url(#g1)' />
                    <path d={CHART_PATH_1} fill='none' stroke='#22c55e' strokeWidth='1.5' />
                    {/* Candles */}
                    {CANDLES.map(([x, open, close, high, low], i) => (
                      <g key={i}>
                        <line x1={x} y1={high} x2={x} y2={low} stroke={close < open ? '#22c55e' : '#ef4444'} strokeWidth='0.8' opacity='0.4' />
                        <rect x={x - 3} y={Math.min(open, close)} width={6} height={Math.max(1, Math.abs(close - open))} fill={close < open ? '#22c55e' : '#ef4444'} opacity='0.5' />
                      </g>
                    ))}
                  </svg>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    {[['RSI', '58.4', '#f59e0b'], ['MACD', '▲', '#22c55e'], ['BB', 'MID', '#94a3b8']].map(([label, val, color]) => (
                      <div key={label as string} style={{ fontSize: 8, background: '#0d2040', borderRadius: 4, padding: '2px 6px', color: color as string }}>
                        {label} {val}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Chart 2 — NVDA */}
                <div style={{ background: '#080f1e', border: '1px solid #0d2040', borderRadius: 8, padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#f1f5f9' }}>NVDA</span>
                      <span style={{ fontSize: 9, color: '#64748b', marginLeft: 6 }}>NVIDIA Corp.</span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#f1f5f9' }}>$875.40</div>
                      <div style={{ fontSize: 9, color: '#22c55e' }}>▲ +3.05%</div>
                    </div>
                  </div>
                  {/* SVG line chart */}
                  <svg viewBox='0 0 280 90' style={{ width: '100%', height: 90 }}>
                    <defs>
                      <linearGradient id='g2' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='0%' stopColor='#3b82f6' stopOpacity='0.25' />
                        <stop offset='100%' stopColor='#3b82f6' stopOpacity='0' />
                      </linearGradient>
                    </defs>
                    <path d={`${CHART_PATH_2} L280,90 L0,90 Z`} fill='url(#g2)' />
                    <path d={CHART_PATH_2} fill='none' stroke='#3b82f6' strokeWidth='1.5' />
                    {CANDLES.map(([x, open, close, high, low], i) => (
                      <g key={i}>
                        <line x1={x} y1={high} x2={x} y2={low} stroke='#3b82f6' strokeWidth='0.8' opacity='0.4' />
                        <rect x={x - 3} y={Math.min(open, close)} width={6} height={Math.max(1, Math.abs(close - open))} fill='#3b82f6' opacity='0.5' />
                      </g>
                    ))}
                  </svg>
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    {[['RSI', '72.1', '#ef4444'], ['MACD', '▲', '#22c55e'], ['BB', 'HIGH', '#f59e0b']].map(([label, val, color]) => (
                      <div key={label as string} style={{ fontSize: 8, background: '#0d2040', borderRadius: 4, padding: '2px 6px', color: color as string }}>
                        {label} {val}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI chat preview strip */}
              <div style={{ borderTop: '1px solid #0d2040', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, background: '#0d2040', borderRadius: 6, padding: '6px 12px', fontSize: 9, color: '#64748b' }}>
                  Analyze AAPL for a swing trade...
                </div>
                <div style={{ background: '#22c55e', borderRadius: 6, padding: '6px 12px', fontSize: 9, color: '#fff', fontWeight: 700 }}>Send</div>
              </div>
            </div>
          </div>

          {/* Hinge */}
          <div style={{
            background: 'linear-gradient(to bottom, #1a2a3a, #0d1a2a)',
            height: 6, borderRadius: '0 0 2px 2px',
            border: '1px solid #0d2040', borderTop: 'none',
          }} />

          {/* Base */}
          <div style={{
            background: 'linear-gradient(to bottom, #111c2e, #0a1220)',
            height: 22, borderRadius: '0 0 12px 12px',
            border: '1px solid #0d2040', borderTop: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {/* Trackpad hint */}
            <div style={{ width: 80, height: 10, border: '1px solid #0d2040', borderRadius: 3, background: '#0d1a2a' }} />
          </div>
          {/* Stand shadow */}
          <div style={{ height: 4, background: 'radial-gradient(ellipse, rgba(0,0,0,0.5) 0%, transparent 70%)', marginTop: 2 }} />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────── */}
      <section style={{ padding: '60px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{t('land_what_label')}</div>
          <h2 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>{t('land_what_title')}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {features.map((f) => (
            <div key={f.title} style={{ background: '#0a1628', border: '1px solid #0d2040', borderRadius: 12, padding: '20px 22px', transition: 'border-color 0.2s' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section style={{ padding: '60px 32px', background: '#040a18' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{t('land_how_label')}</div>
          <h2 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 40px' }}>{t('land_how_title')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {steps.map((s) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, textAlign: 'left', background: '#0a1628', border: '1px solid #0d2040', borderRadius: 12, padding: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{s.title}</div>
                  <div style={{ fontSize: 14, color: '#64748b' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '80px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(34,197,94,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <h2 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 12px' }}>{t('land_ready')}</h2>
        <p style={{ color: '#64748b', marginBottom: 32, fontSize: 16 }}>{t('land_free')}</p>
        <Link href='/register' style={{ padding: '14px 40px', background: '#22c55e', borderRadius: 8, color: '#fff', fontSize: 16, fontWeight: 600, textDecoration: 'none', boxShadow: '0 0 32px rgba(34,197,94,0.35)' }}>
          {t('land_cta_create')}
        </Link>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #0d2040', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, background: '#040a18' }}>
        <span style={{ fontSize: 13, color: '#334155' }}>{t('land_disclaimer')}</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {[{ href: '/docs', label: t('land_docs') }, { href: '/login', label: t('land_signin') }, { href: '/register', label: t('land_register') }].map((l) => (
            <Link key={l.href} href={l.href} style={{ fontSize: 13, color: '#475569', textDecoration: 'none' }}>{l.label}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
