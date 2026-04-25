'use client'

import Link from 'next/link'
import { useApp } from '@/contexts/AppContext'
import Toggle from '@/components/ui/Toggle'

const features = [
  { icon: '📊', titleKey: 'Portfolio Tracking', descKey: 'Log every buy and sell. Auto-calculated holdings, average cost, and P&L.' },
  { icon: '🤖', titleKey: 'AI Swing Advisor', descKey: 'Claude AI analyzes your stocks with live price data and technical indicators.' },
  { icon: '📈', titleKey: 'Live Charts', descKey: 'Candlestick charts powered by real Yahoo Finance data. 3-month view by default.' },
  { icon: '📝', titleKey: 'Paper Trading', descKey: 'Practice with a virtual account before risking real money.' },
  { icon: '🔔', titleKey: 'Price Alerts', descKey: 'Get notified when a stock hits your target price.' },
  { icon: '🌍', titleKey: 'Multi-currency', descKey: 'Switch between EUR and USD any time. All values convert instantly.' },
]

const steps = [
  { n: '1', titleKey: 'Create your account', descKey: 'Sign up for free. No credit card required.' },
  { n: '2', titleKey: 'Add your holdings', descKey: 'Log your buy and sell transactions. The portfolio builds itself.' },
  { n: '3', titleKey: 'Ask the AI', descKey: 'Type any question about a stock. The AI uses live data to give you swing trading advice.' },
]

export default function Home() {
  const { t, lang, setLang } = useApp()

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f1f5f9', fontFamily: 'var(--font-geist-sans)' }}>
      {/* Nav */}
      <nav style={{ borderBottom: '1px solid #1e293b', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#22c55e' }}>📈 StockAgent</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Toggle options={['EN', 'DE']} value={lang.toUpperCase()} onChange={(v) => setLang(v.toLowerCase() as 'en' | 'de')} activeColor='#3b82f6' />
          <Link href='/docs' style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none' }}>{t('land_docs')}</Link>
          <Link href='/login' style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none' }}>{t('land_signin')}</Link>
          <Link href='/register' style={{ padding: '8px 18px', background: '#22c55e', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            {t('land_get_started')}
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '80px 32px 60px' }}>
        <div style={{ display: 'inline-block', background: '#0d2d0d', border: '1px solid #166534', borderRadius: 20, padding: '4px 14px', fontSize: 12, color: '#22c55e', fontWeight: 600, marginBottom: 24, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {t('land_badge')}
        </div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 800, margin: '0 0 20px', lineHeight: 1.15, whiteSpace: 'pre-line' }}>
          {t('land_hero_title')}
        </h1>
        <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 560, margin: '0 auto 36px', lineHeight: 1.7 }}>
          {t('land_hero_sub')}
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href='/register' style={{ padding: '12px 28px', background: '#22c55e', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
            {t('land_cta_start')}
          </Link>
          <Link href='/docs' style={{ padding: '12px 28px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 15, textDecoration: 'none' }}>
            {t('land_cta_docs')}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '60px 32px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{t('land_what_label')}</div>
          <h2 style={{ fontSize: 32, fontWeight: 700, margin: 0 }}>{t('land_what_title')}</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {features.map((f) => (
            <div key={f.titleKey} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '20px 22px' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>{f.titleKey}</div>
              <div style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{f.descKey}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: '60px 32px', background: '#0a0f1e' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>{t('land_how_label')}</div>
          <h2 style={{ fontSize: 32, fontWeight: 700, margin: '0 0 40px' }}>{t('land_how_title')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {steps.map((s) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, textAlign: 'left', background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>{s.titleKey}</div>
                  <div style={{ fontSize: 14, color: '#94a3b8' }}>{s.descKey}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '80px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, margin: '0 0 12px' }}>{t('land_ready')}</h2>
        <p style={{ color: '#94a3b8', marginBottom: 32, fontSize: 16 }}>{t('land_free')}</p>
        <Link href='/register' style={{ padding: '14px 36px', background: '#22c55e', borderRadius: 8, color: '#fff', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>
          {t('land_cta_create')}
        </Link>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid #1e293b', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 13, color: '#64748b' }}>{t('land_disclaimer')}</span>
        <div style={{ display: 'flex', gap: 20 }}>
          {[{ href: '/docs', label: t('land_docs') }, { href: '/login', label: t('land_signin') }, { href: '/register', label: t('land_register') }].map((l) => (
            <Link key={l.href} href={l.href} style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>{l.label}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
