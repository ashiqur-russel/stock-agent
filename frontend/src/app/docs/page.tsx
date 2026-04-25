'use client'

import Link from 'next/link'
import { useApp } from '@/contexts/AppContext'

const sections = [
  {
    title: 'Getting Started',
    items: [
      { q: 'How do I create an account?', a: 'Click "Register" on the homepage. Enter your name, email, and password. If email verification is enabled, check your inbox for a confirmation link.' },
      { q: 'What currencies are supported?', a: 'EUR and USD. Toggle between them in the sidebar. The backend returns EUR; USD is converted in real time using live rates.' },
      { q: 'Is this financial advice?', a: 'No. StockAgent is an educational tool. All AI analysis is for informational purposes only. Always do your own research before making investment decisions.' },
    ],
  },
  {
    title: 'Portfolio & Transactions',
    items: [
      { q: 'How is my portfolio calculated?', a: 'Your holdings are computed from the transaction ledger. Every BUY increases your average cost; every SELL realizes P&L against that average. The current price is fetched live from Yahoo Finance.' },
      { q: 'Can I delete a transaction?', a: 'Yes — go to Transactions, click the delete button next to any row. The portfolio recalculates automatically.' },
      { q: 'What tickers are supported?', a: 'Any ticker available on Yahoo Finance: US stocks (AAPL, TSLA), ETFs (SPY, QQQ), crypto (BTC-USD, ETH-USD), and many international exchanges.' },
    ],
  },
  {
    title: 'AI Chat',
    items: [
      { q: 'What AI model powers the chat?', a: 'The chat is powered by the Groq-hosted Llama 4 Scout model (or configurable to Anthropic Claude). It uses live data tools to fetch prices, indicators, and news before answering.' },
      { q: 'What tools does the AI use?', a: 'get_stock_data (OHLCV history), get_technical_indicators (RSI, MACD, Bollinger Bands, EMA), get_portfolio (your holdings), get_news_headlines, and analyze_swing_setup (composite signal).' },
      { q: 'How do I ask about a stock?', a: 'Just type naturally: "Should I buy NVDA?" or "Analyze AAPL for a swing trade". You can also click a ticker in the quick-actions sidebar.' },
    ],
  },
  {
    title: 'Paper Trading',
    items: [
      { q: 'What is paper trading?', a: 'Paper trading lets you buy and sell stocks with a virtual account (€100,000) using real live prices. No real money is involved.' },
      { q: 'Can I reset my paper account?', a: 'Yes — click "Reset Account" at the top of the Paper Trading page. This clears all positions and restores the starting balance.' },
      { q: 'What are the trading hours?', a: 'US stock markets (NYSE/NASDAQ) are open Monday–Friday, 9:30 AM – 4:00 PM ET (15:30 – 22:00 CET/CEST). Crypto trades 24/7.' },
    ],
  },
  {
    title: 'Price Alerts',
    items: [
      { q: 'How do price alerts work?', a: 'Set a ticker, choose "above" or "below", and enter a target price. The backend checks prices every 30 minutes and triggers an alert when your condition is met.' },
      { q: 'Do I get email notifications?', a: 'Yes, if you have enabled email notifications in the Alerts settings and the backend SMTP is configured.' },
    ],
  },
]

export default function DocsPage() {
  const { t } = useApp()

  return (
    <div style={{ minHeight: '100vh', background: '#020617', color: '#f1f5f9', fontFamily: 'var(--font-geist-sans)' }}>
      <nav style={{ borderBottom: '1px solid #1e293b', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href='/' style={{ fontSize: 18, fontWeight: 700, color: '#22c55e', textDecoration: 'none' }}>📈 StockAgent</Link>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link href='/login' style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none' }}>{t('land_signin')}</Link>
          <Link href='/register' style={{ padding: '8px 18px', background: '#22c55e', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>{t('land_get_started')}</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '60px 32px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>Documentation</h1>
        <p style={{ color: '#94a3b8', fontSize: 16, marginBottom: 48, lineHeight: 1.6 }}>
          Everything you need to know about using StockAgent.
        </p>

        {sections.map((section) => (
          <div key={section.title} style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#22c55e', marginBottom: 20, paddingBottom: 8, borderBottom: '1px solid #1e293b' }}>
              {section.title}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {section.items.map((item) => (
                <div key={item.q} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: 6, fontSize: 15 }}>
                    {item.q}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 14, lineHeight: 1.7 }}>
                    {item.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24, textAlign: 'center', marginTop: 20 }}>
          <p style={{ color: '#94a3b8', marginBottom: 16, fontSize: 15 }}>Ready to start tracking your portfolio?</p>
          <Link href='/register' style={{ padding: '12px 28px', background: '#22c55e', borderRadius: 8, color: '#fff', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            {t('land_cta_create')}
          </Link>
        </div>
      </div>
    </div>
  )
}
