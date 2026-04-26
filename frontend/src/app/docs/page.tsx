'use client'

import { useEffect, useLayoutEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useApp } from '@/contexts/AppContext'
import { getToken, getStoredUser } from '@/hooks/useAuth'
import { AUTH_SESSION_EVENT } from '@/lib/authEvents'
import { openCookieSettings } from '@/components/CookieBanner'

// ── sidebar structure ───────────────────────────────────────────────────────
const NAV = [
  {
    group: 'Introduction',
    items: [
      { id: 'overview', label: 'Overview' },
      { id: 'stack', label: 'Tech Stack' },
    ],
  },
  {
    group: 'Getting Started',
    items: [
      { id: 'prerequisites', label: 'Prerequisites' },
      { id: 'installation', label: 'Installation' },
      { id: 'env-vars', label: 'Environment Variables' },
      { id: 'running', label: 'Running Locally' },
      { id: 'open-source', label: 'Open source' },
      { id: 'dev-db', label: 'Database Management (dev)' },
      { id: 'realtime-data', label: 'Real-Time Data & Polling' },
    ],
  },
  {
    group: 'Project Structure',
    items: [
      { id: 'structure-backend', label: 'Backend Layout' },
      { id: 'structure-frontend', label: 'Frontend Layout' },
    ],
  },
  {
    group: 'User Guide',
    items: [
      { id: 'guide-auth', label: 'Registration & Login' },
      { id: 'guide-portfolio', label: 'Portfolio & Transactions' },
      { id: 'guide-paper', label: 'Paper Trading' },
      { id: 'guide-chat', label: 'AI Chat' },
      { id: 'guide-alerts', label: 'Price Alerts' },
    ],
  },
  {
    group: 'API Reference',
    items: [
      { id: 'api-auth', label: 'Authentication' },
      { id: 'api-portfolio', label: 'Portfolio' },
      { id: 'api-market', label: 'Market Data' },
      { id: 'api-indicators', label: 'Indicators' },
      { id: 'api-paper', label: 'Paper Trading' },
      { id: 'api-alerts', label: 'Alerts' },
      { id: 'api-push', label: 'Browser Push' },
      { id: 'api-chat', label: 'AI Chat (SSE)' },
      { id: 'api-ws', label: 'WebSocket' },
    ],
  },
  {
    group: 'Deployment',
    items: [
      { id: 'deploy-docker', label: 'Docker' },
      { id: 'deploy-env', label: 'Production Env' },
    ],
  },
]

// ── helper components ────────────────────────────────────────────────────────
const METHODS: Record<string, string> = {
  GET: '#1d4ed8',
  POST: '#15803d',
  DELETE: '#b91c1c',
  PATCH: '#92400e',
  PUT: '#6b21a8',
  WS: '#0e7490',
}

function Badge({ method }: { method: string }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: 4,
      background: METHODS[method] ?? '#334155', color: '#fff',
      fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', marginRight: 8,
      verticalAlign: 'middle',
    }}>
      {method}
    </span>
  )
}

function Code({ children, block }: { children: string; block?: boolean }) {
  if (!block) {
    return (
      <code style={{ background: '#1e293b', color: '#67e8f9', padding: '2px 6px', borderRadius: 4, fontSize: 13, fontFamily: 'monospace' }}>
        {children}
      </code>
    )
  }
  return (
    <pre style={{
      background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8,
      padding: '16px 20px', overflowX: 'auto', fontSize: 13,
      fontFamily: 'ui-monospace, monospace', lineHeight: 1.7, color: '#e2e8f0',
      margin: '12px 0',
    }}>
      <code>{children}</code>
    </pre>
  )
}

function Endpoint({ method, path, auth, desc }: { method: string; path: string; auth?: boolean; desc: string }) {
  return (
    <div style={{ background: '#0d1117', border: '1px solid #1e293b', borderRadius: 8, padding: '14px 18px', margin: '10px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <Badge method={method} />
        <code style={{ color: '#67e8f9', fontSize: 14, fontFamily: 'monospace' }}>{path}</code>
        {auth && <span style={{ fontSize: 11, color: '#f59e0b', border: '1px solid #78350f', background: '#1c1100', borderRadius: 4, padding: '1px 6px' }}>🔒 JWT</span>}
      </div>
      <p style={{ margin: '8px 0 0', fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>{desc}</p>
    </div>
  )
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 64, scrollMarginTop: 80 }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px', paddingTop: 4 }}>{title}</h2>
      <div style={{ width: 40, height: 3, background: '#22c55e', borderRadius: 2, marginBottom: 20 }} />
      <div style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.8 }}>{children}</div>
    </section>
  )
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', margin: '24px 0 10px' }}>{children}</h3>
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '8px 0', lineHeight: 1.8 }}>{children}</p>
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#0f2433', border: '1px solid #1e4d6b', borderRadius: 8, padding: '12px 16px', margin: '12px 0', fontSize: 13, color: '#7dd3fc' }}>
      ℹ️ {children}
    </div>
  )
}

function Warn({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#1c1100', border: '1px solid #78350f', borderRadius: 8, padding: '12px 16px', margin: '12px 0', fontSize: 13, color: '#fbbf24' }}>
      ⚠️ {children}
    </div>
  )
}

// ── main page ────────────────────────────────────────────────────────────────
export default function DocsPage() {
  const { t } = useApp()
  const [active, setActive] = useState('overview')
  const [hasSession, setHasSession] = useState(false)
  const [sessionLabel, setSessionLabel] = useState<string | null>(null)

  const refreshSession = useCallback(() => {
    setHasSession(Boolean(getToken()))
    const u = getStoredUser()
    setSessionLabel(u?.name ?? u?.email ?? null)
  }, [])

  useLayoutEffect(() => {
    refreshSession()
  }, [refreshSession])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.addEventListener(AUTH_SESSION_EVENT, refreshSession)
    return () => window.removeEventListener(AUTH_SESSION_EVENT, refreshSession)
  }, [refreshSession])

  useEffect(() => {
    const ids = NAV.flatMap((g) => g.items.map((i) => i.id))
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setActive(e.target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    )
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#060e20', color: '#f1f5f9', fontFamily: 'var(--font-geist-sans)' }}>

      {/* Top nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(6,14,32,0.95)', backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1e293b', padding: '0 32px',
        height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href='/' style={{ fontSize: 18, fontWeight: 700, color: '#22c55e', textDecoration: 'none' }}>
            📈 StockAgent
          </Link>
          <span style={{ color: '#1e293b' }}>|</span>
          <span style={{ fontSize: 14, color: '#64748b' }}>Documentation</span>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {hasSession ? (
            <>
              {sessionLabel ? (
                <span style={{ fontSize: 13, color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {sessionLabel}
                </span>
              ) : null}
              <Link
                href='/user/dashboard'
                style={{ padding: '7px 16px', background: '#22c55e', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
              >
                {t('docs_nav_back')}
              </Link>
            </>
          ) : (
            <>
              <Link href='/login' style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none' }}>{t('land_signin')}</Link>
              <Link href='/register' style={{ padding: '7px 16px', background: '#22c55e', borderRadius: 8, color: '#fff', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                {t('land_get_started')}
              </Link>
            </>
          )}
        </div>
      </nav>

      <div style={{ display: 'flex', maxWidth: 1200, margin: '0 auto' }}>

        {/* Sidebar */}
        <aside style={{
          width: 240, flexShrink: 0,
          position: 'sticky', top: 60, height: 'calc(100vh - 60px)',
          overflowY: 'auto', padding: '28px 0',
          borderRight: '1px solid #1e293b',
        }}>
          {NAV.map((group) => (
            <div key={group.group} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 20px 6px' }}>
                {group.group}
              </div>
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '6px 20px 6px 24px', fontSize: 13,
                    background: active === item.id ? '#0d2a1a' : 'transparent',
                    color: active === item.id ? '#22c55e' : '#94a3b8',
                    borderLeft: active === item.id ? '2px solid #22c55e' : '2px solid transparent',
                    border: 'none', cursor: 'pointer',
                    transition: 'all 0.1s',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: '40px 48px 80px', minWidth: 0 }}>

          {/* ── Overview ── */}
          <Section id='overview' title='Overview'>
            <P>
              <strong style={{ color: '#f1f5f9' }}>StockAgent</strong> is a self-hosted, multi-user stock portfolio tracker with an AI-powered swing trading advisor.
              Users can register their own accounts, log every buy and sell transaction, watch live prices, paper trade with a virtual account, and get AI analysis of any stock.
            </P>
            <P>The AI advisor uses real-time market data (Yahoo Finance), technical indicators (RSI, MACD, Bollinger Bands, EMA), and news headlines to provide structured swing trading analysis.</P>
            <Note>StockAgent is an educational tool. Nothing here constitutes financial advice.</Note>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12, marginTop: 20 }}>
              {[
                { icon: '📊', t: 'Live Portfolio', d: 'Real-time holdings with P&L calculated from transactions' },
                { icon: '🤖', t: 'AI Advisor', d: 'Streaming analysis using live data tools' },
                { icon: '📝', t: 'Paper Trading', d: 'Virtual €100k account with live prices' },
                { icon: '🔔', t: 'Price Alerts', d: 'WebSocket push + email notifications' },
                { icon: '🌍', t: 'EUR / USD', d: 'Instant currency toggle across all views' },
                { icon: '🔒', t: 'Auth + JWT', d: 'Email verification, bcrypt, 30-day tokens' },
              ].map((f) => (
                <div key={f.t} style={{ background: '#0d1a33', border: '1px solid #1e3050', borderRadius: 8, padding: '14px 16px' }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{f.icon}</div>
                  <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14, marginBottom: 4 }}>{f.t}</div>
                  <div style={{ fontSize: 13, color: '#64748b' }}>{f.d}</div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── Stack ── */}
          <Section id='stack' title='Tech Stack'>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { side: 'Backend', items: ['Python 3.12 + FastAPI', 'SQLite (stdlib) or PostgreSQL (psycopg2)', 'Groq SDK (Llama 4 Scout)', 'yfinance + pandas-ta', 'python-jose (JWT) + bcrypt', 'APScheduler (alert scans)', 'smtplib (SMTP)'] },
                { side: 'Frontend', items: ['Next.js 14 App Router + TypeScript', 'Tailwind CSS v3', 'lightweight-charts v5 (TradingView)', 'react-markdown', 'SSE for AI streaming', 'WebSocket for live alerts', 'AppContext (lang + currency)'] },
              ].map(({ side, items }) => (
                <div key={side} style={{ background: '#0d1a33', border: '1px solid #1e3050', borderRadius: 8, padding: 18 }}>
                  <div style={{ fontWeight: 700, color: '#22c55e', marginBottom: 10, fontSize: 15 }}>{side}</div>
                  {items.map((i) => (
                    <div key={i} style={{ fontSize: 13, color: '#94a3b8', padding: '3px 0', display: 'flex', gap: 8 }}>
                      <span style={{ color: '#22c55e' }}>•</span> {i}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Section>

          {/* ── Prerequisites ── */}
          <Section id='prerequisites' title='Prerequisites'>
            <P>Before setting up the project, make sure you have the following installed:</P>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '12px 0' }}>
              {[
                ['Python 3.12+', 'python --version'],
                ['Node.js 18+', 'node --version'],
                ['npm 9+', 'npm --version'],
                ['Git', 'git --version'],
              ].map(([label, cmd]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#0d1a33', border: '1px solid #1e3050', borderRadius: 8, padding: '10px 16px' }}>
                  <span style={{ minWidth: 120, color: '#f1f5f9', fontSize: 14, fontWeight: 500 }}>{label}</span>
                  <Code>{cmd}</Code>
                </div>
              ))}
            </div>
            <P>You also need a <strong style={{ color: '#f1f5f9' }}>Groq API key</strong> (free at <code style={{ color: '#67e8f9' }}>console.groq.com</code>) to power the AI chat.</P>
            <P>Optional: a Gmail App Password for email verification and price alert emails.</P>
            <Note>
              Open source contributors: see <strong style={{ color: '#f1f5f9' }}>CONTRIBUTING.md</strong> in the repository root for <Code>pre-commit</Code> setup, branch names (e.g. <Code>feature/SA-42-description</Code>), commit subjects (<Code>[SA-42] fix: short summary</Code>), and pull request expectations.
            </Note>
          </Section>

          {/* ── Installation ── */}
          <Section id='installation' title='Installation'>
            <H3>1. Clone the repository</H3>
            <Code block>{`git clone https://github.com/<your-fork-or-org>/stock-agent.git
cd stock-agent`}</Code>

            <H3>2. Set up the backend</H3>
            <Code block>{`cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt`}</Code>

            <H3>3. Set up the frontend</H3>
            <Code block>{`cd ../frontend
npm install`}</Code>

            <H3>4. Configure environment variables</H3>
            <P>See the <button onClick={() => scrollTo('env-vars')} style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer', textDecoration: 'underline', fontSize: 14, padding: 0 }}>Environment Variables</button> section below.</P>

            <H3>5. Run the database migration</H3>
            <P>The database is created automatically on first startup — no manual migration needed. The backend calls <Code>init_db()</Code> on startup: with the default <strong style={{ color: '#f1f5f9' }}>SQLite</strong> setup it runs <Code>schema.sql</Code>; if <Code>DATABASE_URL</Code> is set to a <strong style={{ color: '#f1f5f9' }}>PostgreSQL</strong> URL (e.g. Supabase), it runs <Code>schema.postgres.sql</Code> instead.</P>
          </Section>

          {/* ── Env vars ── */}
          <Section id='env-vars' title='Environment Variables'>
            <H3>backend/.env</H3>
            <Code block>{`# App
APP_HOST=0.0.0.0
APP_PORT=8000

# Database — SQLite by default; or Postgres (Supabase *pooler* URI if direct db:5432 fails with IPv6)
DATABASE_PATH=./portfolio.db
# DATABASE_URL=postgresql://...pooler...:6543/postgres?sslmode=require

# Auth (JWT lifetime: 30 days in code — see auth/service.py)
JWT_SECRET=your-random-secret-here-min-32-chars

# Groq (AI)
GROQ_API_KEY=gsk_...

# CORS
CORS_ORIGINS=http://localhost:3000

# Public frontend URL (no trailing slash) — verification & password-reset links
FRONTEND_URL=http://localhost:3000

# Email / SMTP (optional — if blank, verification/reset URLs print in the backend terminal)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx   # 16-char Gmail App Password
# SMTP_FROM_NAME=Stock Agent

# Alert scanner interval
ALERT_INTERVAL_MINUTES=30`}</Code>

            <Warn>If you copy a Gmail App Password, paste it carefully — some editors insert non-breaking spaces (U+00A0) between groups that will cause authentication to fail. The app strips them automatically but verify the raw value.</Warn>

            <H3>frontend/.env.local</H3>
            <Code block>{`NEXT_PUBLIC_API_URL=http://localhost:8000`}</Code>

            <Note>In production, point <Code>NEXT_PUBLIC_API_URL</Code> to your backend&apos;s public URL (e.g. <Code>https://api.yourdomain.com</Code>).</Note>
          </Section>

          {/* ── Running ── */}
          <Section id='running' title='Running Locally'>
            <H3>Start the backend</H3>
            <Code block>{`cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000`}</Code>
            <P>The API is now running at <Code>http://localhost:8000</Code>. Interactive Swagger UI is available at <Code>http://localhost:8000/docs</Code>.</P>

            <H3>Start the frontend</H3>
            <Code block>{`cd frontend
npm run dev`}</Code>
            <P>The app is available at <Code>http://localhost:3000</Code>.</P>

            <H3>Verify</H3>
            <Code block>{`curl http://localhost:8000/api/v1/health
# → {"status":"ok"}`}</Code>

            <H3>Python dependencies</H3>
            <P>After pulling changes, run <Code>pip install -r requirements.txt</Code> again (e.g. <Code>psycopg2-binary</Code> is required for imports even if you only use SQLite).</P>
          </Section>

          {/* ── Open source ── */}
          <Section id='open-source' title='Open source'>
            <P>
              Full contributor workflow — <Code>pre-commit</Code>, branch names (<Code>feature/SA-42-…</Code>), commit subjects (<Code>[SA-42] type: summary</Code>), tests, and troubleshooting — is in the repo root file{' '}
              <strong style={{ color: '#f1f5f9' }}>CONTRIBUTING.md</strong>. The root <strong style={{ color: '#f1f5f9' }}>README.md</strong> covers deploy pitfalls and Supabase connectivity.
            </P>
            <Note>
              Pull requests: use titles like <Code>[SA-7] Fix/Auth Password Reset UX</Code> (see <strong style={{ color: '#f1f5f9' }}>CONTRIBUTING.md</strong>), include screenshots for UI changes, and document what you tested. GitHub loads the template from <Code>.github/pull_request_template.md</Code>.
            </Note>
          </Section>

          {/* ── Database management (dev) ── */}
          <Section id='dev-db' title='Database Management (Dev)'>
            <P><strong style={{ color: '#f1f5f9' }}>Default (local):</strong> a single SQLite file at <Code>backend/portfolio.db</Code>. The schema is created on first startup from <Code>backend/schema.sql</Code>, so you can delete the file and it will be re-created for a clean slate.</P>
            <H3>Production: PostgreSQL (e.g. Supabase)</H3>
            <P>When you set <Code>DATABASE_URL</Code> to a connection string that starts with <Code>postgres</Code> (common with Supabase, Neon, Railway), the API uses that database. Tables are created automatically from <Code>backend/schema.postgres.sql</Code> on startup. Inspect data in the host&apos;s console (e.g. Supabase <strong>Table Editor</strong> → schema <Code>public</Code>). <strong style={{ color: '#f1f5f9' }}>This does not migrate data</strong> from an existing <Code>portfolio.db</Code>—switching is a new empty database unless you export/import yourself.</P>

            <P><strong style={{ color: '#f1f5f9' }}>SQLite (local) commands below</strong> — skip if you use Postgres only.</P>

            <H3>List all users</H3>
            <Code block>{`sqlite3 -header -column backend/portfolio.db \\
  "SELECT id, email, name, is_verified, created_at FROM users ORDER BY id;"`}</Code>

            <H3>Check if a specific email is registered</H3>
            <P>Useful before wiping — if the user already exists, you might just want to re-verify or resend the verification email instead.</P>
            <Code block>{`sqlite3 backend/portfolio.db \\
  "SELECT id, is_verified FROM users WHERE email='you@example.com';"`}</Code>

            <H3>Inspect any table</H3>
            <Code block>{`# All tables
sqlite3 backend/portfolio.db ".tables"

# Schema for one table
sqlite3 backend/portfolio.db ".schema transactions"

# Recent transactions
sqlite3 -header -column backend/portfolio.db \\
  "SELECT * FROM transactions ORDER BY id DESC LIMIT 10;"`}</Code>

            <H3>Delete a single user (cascades to all their data)</H3>
            <Code block>{`sqlite3 backend/portfolio.db \\
  "PRAGMA foreign_keys=ON; DELETE FROM users WHERE email='you@example.com';"`}</Code>
            <Warn>The <Code>PRAGMA foreign_keys=ON</Code> is required. The sqlite3 CLI defaults to foreign keys <strong>OFF</strong>, even though the app turns them on inside <Code>get_connection()</Code>. Without it, the user row is deleted but transactions / alerts / paper_account / paper_watchlist rows are left orphaned.</Warn>

            <H3>Wipe data but keep tables</H3>
            <P>Useful when you want to reset state but skip the &quot;backend creates schema&quot; step.</P>
            <Code block>{`sqlite3 backend/portfolio.db <<'SQL'
PRAGMA foreign_keys = ON;
DELETE FROM users;             -- cascades to all per-user tables
DELETE FROM email_verifications;
SQL`}</Code>

            <H3>Full nuke (recommended for &quot;restart app&quot;)</H3>
            <Code block>{`# 1. Stop uvicorn  (Ctrl+C in the backend terminal)
# 2. Delete the DB file
rm backend/portfolio.db
# 3. Start uvicorn again — schema is auto-created from schema.sql
cd backend && uvicorn main:app --reload --port 8000`}</Code>
            <Warn>After a full wipe, also clear the frontend&apos;s saved JWT or you&apos;ll keep getting <Code>401 Unauthorized</Code> with a token that points at a non-existent user. In the browser DevTools: <strong>Application → Local Storage → http://localhost:3000</strong> → delete <Code>stock_agent_token</Code> and <Code>stock_agent_user</Code>, then hard-refresh (<Code>Cmd+Shift+R</Code>) and register again.</Warn>

            <H3>One-liner: wipe DB + clear my own user (no CLI)</H3>
            <P>If you just want to reset your own paper-trading account without nuking the whole DB, use the in-app button on the Paper Trading page (<Code>POST /api/v1/paper/reset</Code>) — it clears positions and restores the €100,000 starting balance without touching your login.</P>
          </Section>

          {/* ── Real-time data & polling ── */}
          <Section id='realtime-data' title='Real-Time Data & Polling'>
            <P>StockAgent uses <strong style={{ color: '#f1f5f9' }}>yfinance</strong> for all market data — quotes, OHLCV history, news. yfinance is free, requires no API key, and works out of the box, which is why it&apos;s the default for development. <strong style={{ color: '#f1f5f9' }}>It is not a real-time tick feed</strong>, and that has consequences for how often we can poll.</P>

            <H3>Why we poll every 30s (and not every 1s)</H3>
            <P>Two hard limits force the cadence:</P>
            <ul style={{ margin: '8px 0 12px 20px', lineHeight: 1.8 }}>
              <li><strong style={{ color: '#f1f5f9' }}>yfinance refresh rate.</strong> Yahoo&apos;s public endpoint only updates the quote roughly every <strong>10–20 seconds</strong>. Polling faster than that gives you the same number repeatedly — wasted requests.</li>
              <li><strong style={{ color: '#f1f5f9' }}>Rate limiting.</strong> yfinance is unofficial scraping. Sustained &gt;1 req/sec from one IP triggers <Code>429 Too Many Requests</Code> and eventually a soft IP block (15–60 min). With multiple users × multiple tickers this happens fast.</li>
            </ul>
            <P>So in <Code>backend/routers/ws.py</Code>:</P>
            <Code block>{`MARKET_HOURS_INTERVAL = 30    # /ws/alerts cadence during US market hours
OFF_HOURS_INTERVAL    = 300   # /ws/alerts cadence after hours

PRICES_TICK_INTERVAL_OPEN   = 3   # /ws/prices cadence when something is "live"
PRICES_TICK_INTERVAL_CLOSED = 30  # /ws/prices cadence when nothing is live`}</Code>
            <Note>The <Code>/ws/prices</Code> stream uses a tighter 3s tick because it&apos;s the visible UI flicker — even though yfinance only refreshes every ~15s, polling every 3s catches the change as soon as it happens. <Code>/ws/alerts</Code> uses 30s because alert messages are user-facing notifications, not pixel-level updates.</Note>
            <Warn>These intervals are tuned for <strong>development with a single user</strong>. With 50+ concurrent users you will get rate-limited; either share a per-ticker quote cache across all sockets, or switch to a paid provider (below).</Warn>

            <H3>Adding true real-time data (paid providers)</H3>
            <P>If you want sub-second tick-by-tick prices like Webull, Robinhood, or TradingView, you need a real WebSocket feed from a market data vendor. Here are the realistic options ranked by best-fit for this project:</P>

            <div style={{ overflowX: 'auto', margin: '12px 0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#0d1117', color: '#f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: 10, border: '1px solid #1e293b' }}>Provider</th>
                    <th style={{ padding: 10, border: '1px solid #1e293b' }}>Free tier</th>
                    <th style={{ padding: 10, border: '1px solid #1e293b' }}>Paid</th>
                    <th style={{ padding: 10, border: '1px solid #1e293b' }}>WebSocket?</th>
                    <th style={{ padding: 10, border: '1px solid #1e293b' }}>Best for</th>
                  </tr>
                </thead>
                <tbody style={{ color: '#cbd5e1' }}>
                  <tr>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}><strong style={{ color: '#22c55e' }}>Finnhub</strong></td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>60 req/min, WS for US stocks</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>$25/mo (Starter) → $99/mo</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>✅ even on free tier</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>Best free option for stocks. Drop-in replacement.</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}><strong style={{ color: '#22c55e' }}>Binance</strong></td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>Unlimited public WS</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>$0 (no auth needed)</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>✅ true tick stream</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>Crypto only — but the gold standard for it.</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}><strong style={{ color: '#f1f5f9' }}>Polygon.io</strong></td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>5 req/min, no WS</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>$29/mo (delayed) → $199/mo (real-time)</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>✅ on paid tiers</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>Production-grade, broad coverage (stocks, options, FX, crypto).</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}><strong style={{ color: '#f1f5f9' }}>Tradier</strong></td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>—</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>$10/mo (Sandbox real-time)</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>✅</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>Cheapest real-time stocks, US-only, also brokerage API.</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}><strong style={{ color: '#f1f5f9' }}>Alpaca</strong></td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>15-min delayed WS, IEX feed</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>$99/mo (SIP real-time)</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>✅</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>Free 15-min delayed IEX is enough for most swing trading.</td>
                  </tr>
                  <tr>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}><strong style={{ color: '#64748b' }}>Alpha Vantage</strong></td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>5 req/min, 500/day</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>$49.99/mo+</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>❌ HTTP only</td>
                    <td style={{ padding: 10, border: '1px solid #1e293b' }}>Avoid — no streaming, generous tier is too slow.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <P><strong style={{ color: '#22c55e' }}>Recommendation:</strong> use <strong>Finnhub free tier for stocks</strong> + <strong>Binance public WS for crypto</strong>. Zero cost, real WebSocket, covers 95% of the use case. Upgrade to Polygon $99 only when you have paying users.</P>

            <H3>What changes when you swap to a real WS feed</H3>
            <ol style={{ margin: '8px 0 12px 20px', lineHeight: 1.8, color: '#cbd5e1' }}>
              <li>Add a per-process subscription manager (one upstream WS per provider, fan-out to N connected browser clients) in <Code>backend/services/market_data.py</Code>.</li>
              <li>Replace <Code>fetch_quote(t)</Code> calls inside <Code>_broadcast_prices()</Code> and <Code>ws_alerts</Code> with reads from an in-memory <Code>last_quote</Code> dict that the upstream WS keeps fresh.</li>
              <li>Drop <Code>PRICES_TICK_INTERVAL_OPEN</Code> to ~1s (or push on every upstream tick — even better).</li>
              <li>Drop <Code>MARKET_HOURS_INTERVAL</Code> to ~5s and use ticks for <Code>price_alert</Code> detection too.</li>
              <li>Cache the historical OHLCV (used for support/resistance and indicators) once per minute — those don&apos;t need real-time and the paid endpoints have monthly request quotas.</li>
            </ol>
            <Note>The current architecture (separate <Code>/ws/prices</Code> and <Code>/ws/alerts</Code> sockets, both polling yfinance independently) is wasteful but isolated; consolidating onto a shared per-ticker quote cache is the right time to do it. See <Code>backend/routers/ws.py</Code> for the seams.</Note>
          </Section>

          {/* ── Backend structure ── */}
          <Section id='structure-backend' title='Backend Layout'>
            <Code block>{`backend/
├── main.py                    # FastAPI app factory, CORS, routers, scheduler
├── config.py                  # .env loader — all settings
├── database.py                # SQLite + Postgres (psycopg2), get_connection(), init_db()
├── schema.sql                 # SQLite DDL
├── schema.postgres.sql        # PostgreSQL DDL
├── requirements.txt
├── auth/
│   ├── models.py              # Pydantic: RegisterRequest, LoginRequest, TokenResponse
│   ├── service.py             # hash_password, verify_password, create_jwt, decode_jwt
│   └── router.py              # register, login, verify, resend, forgot/reset password
├── middleware/
│   └── auth.py                # get_current_user() — JWT dependency
├── routers/
│   ├── portfolio.py           # GET/POST/DELETE portfolio & transactions
│   ├── market.py              # GET quote / history / news
│   ├── indicators.py          # GET RSI, MACD, BB, EMA, swing signal
│   ├── paper.py               # GET account, POST trade, POST reset
│   ├── alerts.py              # CRUD alerts + notification settings
│   ├── chat.py                # POST /api/v1/chat → SSE stream
│   └── ws.py                  # WebSockets: /api/v1/ws/alerts, /api/v1/ws/prices
└── services/
    ├── market_data.py         # fetch_quote(), fetch_ohlcv(), fetch_news() via yfinance
    ├── technical.py           # compute_indicators(), run_swing_analysis()
    ├── portfolio_service.py   # get_portfolio_for_user(), add/delete transaction
    ├── agent_service.py       # system prompt, tool dispatcher, stream_agent_response()
    └── alert_service.py       # check_all_portfolios() — runs every 30 min`}</Code>
          </Section>

          {/* ── Frontend structure ── */}
          <Section id='structure-frontend' title='Frontend Layout'>
            <Code block>{`frontend/src/
├── app/
│   ├── layout.tsx             # Root layout — Providers + CookieBanner
│   ├── page.tsx               # Landing page
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── verify/page.tsx        # Email verification (Suspense-wrapped)
│   ├── forgot-password/page.tsx
│   ├── reset-password/page.tsx
│   ├── user/dashboard/page.tsx    # /user/dashboard — portfolio overview
│   ├── user/transactions/page.tsx # /user/transactions — trade log
│   ├── user/alerts/page.tsx       # /user/alerts — swing signal alerts
│   ├── user/paper/page.tsx        # /user/paper — paper trading
│   ├── user/agent/page.tsx        # /user/agent — AI chat (SSE streaming)
│   ├── (app)/…                    # Legacy paths — all redirect to /user/*
│   └── docs/page.tsx          # This page
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx        # Nav + language + currency toggles
│   │   ├── AuthGuard.tsx      # JWT check → redirect, wraps WebSocket listener
│   │   └── LiveAlertToast.tsx # Bottom-right toast notifications
│   ├── ui/
│   │   ├── Amount.tsx         # EUR↔USD money display
│   │   ├── Toggle.tsx         # Two-option toggle button
│   │   ├── FormInput.tsx      # Labelled input
│   │   └── MarketStatus.tsx   # Open/closed by DE (Berlin) or US (NYSE) user toggle
│   ├── dashboard/
│   │   ├── PortfolioCard.tsx  # Per-ticker card with P&L + chart
│   │   └── SignalBadge.tsx    # BUY/SELL/HOLD badge
│   ├── charts/
│   │   └── CandlestickChart.tsx  # lightweight-charts v5
│   ├── paper/
│   │   └── TradeModal.tsx     # Buy/Sell modal with live price
│   ├── CookieBanner.tsx       # GDPR cookie consent
│   └── Providers.tsx          # AppContext provider wrapper
├── contexts/
│   └── AppContext.tsx         # lang, currency, formatPrice, t()
├── hooks/
│   ├── useAuth.ts             # login, register, logout
│   ├── usePortfolio.ts        # fetch + 30s auto-refresh
│   ├── useChat.ts             # SSE streaming hook
│   └── useAlertWS.ts          # WebSocket reconnect hook
├── lib/
│   ├── api.ts                 # apiFetch + all route namespaces
│   └── i18n.ts                # EN/DE translation dictionary
└── types/
    └── css.d.ts`}</Code>
          </Section>

          {/* ── Guide: Auth ── */}
          <Section id='guide-auth' title='Registration & Login'>
            <P>Go to <Code>/register</Code> and fill in your name, email and password.</P>

            <H3>With SMTP configured</H3>
            <P>After submitting, you receive a verification email. Click the link to open <Code>/verify</Code> and receive a JWT, then use the app. The verification link expires after <strong style={{ color: '#f1f5f9' }}>24 hours</strong>. Use the Resend control if it expires.</P>

            <H3>Without SMTP (local dev)</H3>
            <P>
              The API still creates an <strong style={{ color: '#f1f5f9' }}>unverified</strong> account and returns a &quot;check your email&quot; style response — it does <strong style={{ color: '#f1f5f9' }}>not</strong> return a JWT until you complete verification. Copy the URL printed in the <strong style={{ color: '#f1f5f9' }}>backend terminal</strong> (uvicorn) and open it in the browser, or paste the token into <Code>/verify?token=…</Code>.
            </P>

            <H3>Forgot password</H3>
            <P>
              Use <Code>/forgot-password</Code> to request a link. With SMTP off, the reset URL is printed in the backend log. After a successful <Code>POST /auth/reset-password</Code>, your password is updated and your email is treated as <strong style={{ color: '#f1f5f9' }}>verified</strong> (inbox access was proven), so you can sign in without a separate verification step.
            </P>

            <H3>JWT storage</H3>
            <P>The access token is stored in <Code>localStorage</Code> under the key <Code>stock_agent_token</Code> and sent as an <Code>Authorization: Bearer &lt;token&gt;</Code> header on every API request. Tokens are valid for <strong style={{ color: '#f1f5f9' }}>30 days</strong> (see <Code>ACCESS_TOKEN_EXPIRE_DAYS</Code> in <Code>backend/auth/service.py</Code>).</P>
          </Section>

          {/* ── Guide: Portfolio ── */}
          <Section id='guide-portfolio' title='Portfolio & Transactions'>
            <P>Navigate to <strong style={{ color: '#f1f5f9' }}>Transactions</strong> (<Code>/user/transactions</Code>) to log trades. Every entry requires a ticker, type (BUY or SELL), number of shares, price per share, and the date the trade was executed. Old paths like <Code>/transactions</Code> and <Code>/dashboard/transactions</Code> now redirect here automatically.</P>

            <H3>How portfolio is calculated</H3>
            <P>There is no stored portfolio table. Holdings are always computed live from the transaction ledger:</P>
            <Code block>{`BUY  → new_avg = (shares_held × avg_cost + buy_shares × buy_price) / new_total_shares
SELL → realized_pnl += (sell_price − avg_cost) × sell_shares
       shares_held   -= sell_shares   (avg_cost stays unchanged)

unrealized_pnl     = (live_price − avg_cost) × shares_held
unrealized_pnl_pct = unrealized_pnl / (avg_cost × shares_held) × 100`}</Code>
            <P>Live prices are fetched from Yahoo Finance. Deleting a transaction fully recalculates the portfolio.</P>

            <H3>Supported tickers</H3>
            <P>Any Yahoo Finance symbol: <Code>AAPL</Code>, <Code>TSLA</Code>, <Code>SPY</Code>, <Code>BTC-USD</Code>, <Code>ETH-USD</Code>, <Code>IWDA.AS</Code>, etc.</P>
          </Section>

          {/* ── Guide: Paper ── */}
          <Section id='guide-paper' title='Paper Trading'>
            <P>Paper trading gives you a virtual <strong style={{ color: '#f1f5f9' }}>€100,000</strong> account to practise trading with real live prices. No real money is involved.</P>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '12px 0' }}>
              {[
                ['Add to watchlist', 'Type any ticker in the Watchlist panel and press Add. The card fetches the live price and refreshes every 30 seconds.'],
                ['Buy', 'Click Buy on a watchlist card or holdings row. Enter shares or amount. The modal shows the live price and calculates cost.'],
                ['Sell', 'Only available if you hold that ticker. Enter shares to sell. Proceeds are added to your cash balance.'],
                ['Reset account', 'Clears all positions and restores the €100,000 starting balance. Requires confirmation.'],
              ].map(([title, desc]) => (
                <div key={title as string} style={{ background: '#0d1a33', border: '1px solid #1e3050', borderRadius: 8, padding: '12px 16px' }}>
                  <span style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14 }}>{title}</span>
                  <span style={{ color: '#64748b' }}> — </span>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{desc}</span>
                </div>
              ))}
            </div>
            <H3>Trading Hours indicator</H3>
            <P>The header shows whether the US stock market (NYSE/NASDAQ) is currently open. Hours are <strong style={{ color: '#f1f5f9' }}>9:30 AM – 4:00 PM ET</strong>, which is <strong style={{ color: '#f1f5f9' }}>15:30 – 22:00 CET/CEST</strong>. Crypto markets are always open (24/7).</P>
          </Section>

          {/* ── Guide: Chat ── */}
          <Section id='guide-chat' title='AI Chat'>
            <P>The chat page connects to a Groq-hosted <strong style={{ color: '#f1f5f9' }}>Llama 4 Scout</strong> model with five built-in tools for real-time data.</P>
            <H3>Available tools</H3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '12px 0' }}>
              {[
                ['get_stock_data', 'OHLCV candlestick history (ticker, period, interval)'],
                ['get_technical_indicators', 'RSI-14, MACD, Bollinger Bands, 20 EMA, 50 EMA'],
                ['get_portfolio', "Current user's holdings with live P&L"],
                ['get_news_headlines', 'Top Yahoo Finance headlines for a ticker'],
                ['analyze_swing_setup', 'Composite signal: support/resistance, MACD, BB, swing quality score'],
              ].map(([name, desc]) => (
                <div key={name as string} style={{ display: 'flex', gap: 12, background: '#0d1a33', border: '1px solid #1e3050', borderRadius: 8, padding: '10px 14px' }}>
                  <Code>{name as string}</Code>
                  <span style={{ fontSize: 13, color: '#94a3b8' }}>{desc}</span>
                </div>
              ))}
            </div>
            <H3>Streaming</H3>
            <P>Responses stream via <strong style={{ color: '#f1f5f9' }}>Server-Sent Events (SSE)</strong>. Text tokens appear in real time. Tool calls are shown as pill badges. The stream auto-scrolls to the latest message.</P>
            <H3>Quick actions</H3>
            <P>When you have holdings, the sidebar shows one button per ticker (e.g. &quot;📈 AAPL&quot;). Clicking pre-fills the input with <em>&quot;Analyze AAPL for a swing trade&quot;</em>.</P>
          </Section>

          {/* ── Guide: Alerts ── */}
          <Section id='guide-alerts' title='Price Alerts'>
            <P>Set alerts on any ticker. Choose <strong style={{ color: '#f1f5f9' }}>above</strong> or <strong style={{ color: '#f1f5f9' }}>below</strong> a target price. The backend scans all user portfolios every <Code>ALERT_INTERVAL_MINUTES</Code> (default: 30 minutes).</P>
            <P>When triggered, the alert is stored in the database, the unread counter in the sidebar increments, and if email notifications are enabled, an email is sent to the address in your notification settings.</P>
            <P>Live alerts also push in real time through the WebSocket connection (<Code>/api/v1/ws/alerts</Code>) as toast notifications.</P>
          </Section>

          {/* ──────────────────────── API REFERENCE ──────────────────────── */}

          {/* ── API: Auth ── */}
          <Section id='api-auth' title='API — Authentication'>
            <P>All endpoints except the auth routes require a JWT in the <Code>Authorization: Bearer &lt;token&gt;</Code> header.</P>

            <Endpoint method='POST' path='/auth/register' desc='Register a new user. Always returns a pending message; use GET /auth/verify with the token (from email or backend log if SMTP is off).' />
            <H3>Request body</H3>
            <Code block>{`{
  "email": "user@example.com",
  "name": "Jane Doe",
  "password": "mypassword"
}`}</Code>
            <H3>Response</H3>
            <Code block>{`{
  "email": "user@example.com",
  "message": "Check your email to verify your account"
}`}</Code>
            <Note>SMTP only controls whether an email is <em>sent</em>. Without SMTP, the same response shape applies; copy the verify URL from the uvicorn console.</Note>

            <Endpoint method='GET' path='/auth/verify?token=<token>' desc='Consumes the email verification token. Returns a JWT on success.' />

            <Endpoint method='POST' path='/auth/resend-verification' desc='Creates a new verification token and sends email (or logs the link if SMTP is off).' />
            <Code block>{`{ "email": "user@example.com" }`}</Code>

            <Endpoint method='POST' path='/auth/forgot-password' desc='If the email exists, creates a password-reset token (404 if unknown email). Sends email or prints reset URL when SMTP is off.' />
            <Code block>{`{ "email": "user@example.com" }`}</Code>

            <Endpoint method='POST' path='/auth/reset-password' desc='Sets a new password from a valid reset token; marks the account verified. Token expires in 2 hours.' />
            <Code block>{`{
  "token": "<token-from-email-or-log>",
  "password": "newpassword8chars+"
}`}</Code>

            <Endpoint method='POST' path='/auth/login' desc='Log in with email and password. Returns a JWT. Responds 403 if the password is correct but the email is not verified yet.' />
            <Code block>{`// Request
{ "email": "user@example.com", "password": "mypassword" }

// Response
{
  "access_token": "eyJ...",
  "user_id": 1,
  "name": "Jane Doe",
  "email": "user@example.com"
}`}</Code>
          </Section>

          {/* ── API: Portfolio ── */}
          <Section id='api-portfolio' title='API — Portfolio'>
            <Endpoint method='GET' path='/api/v1/portfolio' auth desc='Returns all holdings calculated from transactions, enriched with live prices and P&L.' />
            <H3>Response</H3>
            <Code block>{`[
  {
    "ticker": "AAPL",
    "shares_held": 10.0,
    "avg_cost": 185.50,
    "current_price": 195.20,       // EUR
    "current_price_usd": 214.35,
    "market_value": 1952.00,       // EUR
    "market_value_usd": 2143.52,
    "unrealized_pnl": 97.00,
    "unrealized_pnl_usd": 106.59,
    "unrealized_pnl_pct": 5.23,
    "realized_pnl": 0.00,
    "realized_pnl_usd": 0.00,
    "day_change_pct": 1.20,
    "eur_rate": 0.91
  }
]`}</Code>

            <Endpoint method='GET' path='/api/v1/portfolio/transactions' auth desc='Returns the full transaction history for the authenticated user, newest first.' />
            <Code block>{`[
  {
    "id": 42,
    "ticker": "AAPL",
    "type": "BUY",
    "shares": 10.0,
    "price": 185.50,
    "executed_at": "2025-04-20",
    "notes": "bought on earnings dip",
    "created_at": "2025-04-20T14:22:00"
  }
]`}</Code>

            <Endpoint method='POST' path='/api/v1/portfolio/transaction' auth desc='Log a BUY or SELL transaction. Returns the created transaction object.' />
            <Code block>{`// Request
{
  "ticker": "AAPL",
  "type": "BUY",           // "BUY" | "SELL"
  "shares": 10,
  "price": 185.50,
  "executed_at": "2025-04-20",
  "notes": "optional"
}

// Response
{ "id": 42, "ticker": "AAPL", ... }`}</Code>

            <Endpoint method='PUT' path='/api/v1/portfolio/transaction/{id}' auth desc='Updates an existing transaction (same body shape as POST). Returns 404 if the id does not belong to the user.' />
            <Code block>{`// Request — same fields as POST /transaction
{
  "ticker": "AAPL",
  "type": "BUY",
  "shares": 10,
  "price": 186.00,
  "executed_at": "2025-04-20",
  "notes": "corrected fill"
}

// Response
{ "updated": true }`}</Code>

            <Endpoint method='DELETE' path='/api/v1/portfolio/transaction/{id}' auth desc='Deletes a transaction by ID. Only the owning user can delete.' />
            <Code block>{`{ "deleted": true }`}</Code>
          </Section>

          {/* ── API: Market ── */}
          <Section id='api-market' title='API — Market Data'>
            <Note>All market data comes from Yahoo Finance via <Code>yfinance</Code>. Data is live — not cached.</Note>

            <Endpoint method='GET' path='/api/v1/market/quote/{ticker}' auth desc='Current price, day change %, and EUR/USD rate for a ticker.' />
            <Code block>{`{
  "ticker": "AAPL",
  "current_price": 195.20,       // EUR
  "current_price_usd": 214.35,
  "day_change_pct": 1.20,
  "eur_rate": 0.91
}`}</Code>

            <Endpoint method='GET' path='/api/v1/market/history/{ticker}?period=3mo&interval=1d' auth desc='OHLCV candlestick data. period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y. interval: 1m, 5m, 1h, 1d, 1wk.' />
            <Code block>{`[
  {
    "date": "2025-01-15",
    "open": 182.10,
    "high": 185.80,
    "low": 181.50,
    "close": 184.20,
    "volume": 58234100
  }
]`}</Code>

            <Endpoint method='GET' path='/api/v1/market/news/{ticker}' auth desc='Top 10 Yahoo Finance news headlines for the ticker.' />
            <Code block>{`[
  {
    "title": "Apple beats earnings estimates",
    "published": "2025-04-20T18:00:00",
    "url": "https://..."
  }
]`}</Code>
          </Section>

          {/* ── API: Indicators ── */}
          <Section id='api-indicators' title='API — Technical Indicators'>
            <Endpoint method='GET' path='/api/v1/indicators/{ticker}' auth desc='Computes RSI-14, MACD, Bollinger Bands (20,2), 20 EMA, and 50 EMA from daily OHLCV data.' />
            <Code block>{`{
  "ticker": "AAPL",
  "rsi": 58.4,
  "macd": 1.23,
  "macd_signal": 0.87,
  "macd_hist": 0.36,
  "bb_upper": 198.50,
  "bb_middle": 190.20,
  "bb_lower": 181.90,
  "bb_pct": 0.72,          // 0=at lower band, 1=at upper band
  "ema20": 191.30,
  "ema50": 186.40
}`}</Code>

            <Endpoint method='GET' path='/api/v1/indicators/{ticker}/swing' auth desc='Composite swing setup analysis combining indicators, key levels, and news.' />
            <Code block>{`{
  "ticker": "AAPL",
  "swing_setup_quality": "GOOD",    // EXCELLENT | GOOD | FAIR | POOR
  "signal": "BUY",                  // BUY | SELL | HOLD
  "key_support": 188.00,
  "key_resistance": 200.00,
  "macd_signal": "bullish_crossover",
  "bb_position": "middle",
  "rsi": 58.4,
  "summary": "AAPL is trading above both EMAs with a bullish MACD crossover..."
}`}</Code>
          </Section>

          {/* ── API: Paper ── */}
          <Section id='api-paper' title='API — Paper Trading'>
            <Endpoint method='GET' path='/api/v1/paper/account' auth desc='Returns the full paper trading account: cash balance, holdings with live P&L, and recent transactions.' />
            <Code block>{`{
  "balance_eur": 87234.50,
  "total_value": 102450.00,
  "pnl": 2450.00,
  "pnl_pct": 2.45,
  "holdings": [
    {
      "ticker": "NVDA",
      "shares": 5.0,
      "avg_cost": 830.00,
      "current_price": 875.20,
      "market_value": 4376.00,
      "unrealized_pnl": 226.00,
      "unrealized_pnl_pct": 5.45,
      "day_change_pct": 2.10
    }
  ],
  "transactions": [ ... ]
}`}</Code>

            <Endpoint method='POST' path='/api/v1/paper/trade' auth desc='Execute a paper BUY or SELL at the current live price. Returns the trade result and new cash balance.' />
            <Code block>{`// Request
{
  "ticker": "NVDA",
  "type": "BUY",     // "BUY" | "SELL"
  "shares": 2.5,
  "notes": ""
}

// Response
{
  "ok": true,
  "ticker": "NVDA",
  "type": "BUY",
  "shares": 2.5,
  "price_eur": 875.20,
  "total": 2188.00,
  "new_balance": 85046.50
}`}</Code>

            <Endpoint method='POST' path='/api/v1/paper/reset' auth desc='Resets the paper account to €100,000. All positions and transaction history are deleted.' />
            <Code block>{`{ "ok": true, "balance_eur": 100000.0 }`}</Code>
          </Section>

          {/* ── API: Alerts ── */}
          <Section id='api-alerts' title='API — Alerts'>
            <Endpoint method='GET' path='/api/v1/alerts' auth desc='List all alerts for the authenticated user, newest first (max 50).' />
            <Code block>{`[
  {
    "id": 7,
    "ticker": "AAPL",
    "condition": "above",
    "target_price": 200.00,
    "is_active": true,
    "triggered_at": null,
    "is_read": false,
    "created_at": "2025-04-20T10:00:00"
  }
]`}</Code>

            <Endpoint method='GET' path='/api/v1/alerts/unread-count' auth desc='Returns the count of unread alert notifications.' />
            <Code block>{`{ "count": 3 }`}</Code>

            <Endpoint method='PATCH' path='/api/v1/alerts/read-all' auth desc='Marks all alerts as read.' />
            <Endpoint method='PATCH' path='/api/v1/alerts/{id}/read' auth desc='Marks a single alert as read.' />

            <Endpoint method='GET' path='/api/v1/settings/notifications' auth desc='Get notification settings for the current user.' />
            <Code block>{`{
  "notify_email": "user@example.com",
  "email_alerts": true
}`}</Code>

            <Endpoint method='PUT' path='/api/v1/settings/notifications' auth desc='Update notification settings.' />
            <Code block>{`{
  "notify_email": "user@example.com",
  "email_alerts": true
}`}</Code>

            <Endpoint method='GET' path='/api/v1/settings/preferences' auth desc='User UI preferences (reference market for open/close hours, stored per account).' />
            <Code block>{`{ "market_region": "DE" }`}</Code>

            <Endpoint method='PUT' path='/api/v1/settings/preferences' auth desc='Update UI preferences. `market_region` is `DE` (Europe/Berlin hours) or `US` (NYSE hours) for the Market Open/Closed indicator.' />
            <Code block>{`{ "market_region": "US" }`}</Code>
          </Section>

          {/* ── API: Push ── */}
          <Section id='api-push' title='API — Browser Push Notifications'>
            <P>Web Push notifications are sent to the browser whenever a swing signal changes on a held position. They work even when the tab is closed, via a registered service worker (<Code>public/sw.js</Code>). VAPID keys must be configured in <Code>backend/.env</Code> — see <em>Environment Variables</em> above. If VAPID is not configured, email and WebSocket toast alerts still work normally.</P>
            <Endpoint method='GET' path='/api/v1/push/vapid-public-key' desc='Returns the server VAPID public key needed by the browser to subscribe. No auth required — the key is public.' />
            <Code block>{`{ "public_key": "BNx8...base64url..." }`}</Code>

            <Endpoint method='POST' path='/api/v1/push/subscribe' auth desc='Saves a browser push subscription for the authenticated user.' />
            <Code block>{`{
  "endpoint": "https://fcm.googleapis.com/fcm/send/...",
  "keys": {
    "p256dh": "...",
    "auth": "..."
  }
}`}</Code>

            <Endpoint method='DELETE' path='/api/v1/push/unsubscribe' auth desc='Removes a push subscription by endpoint.' />
            <Code block>{`{ "endpoint": "https://fcm.googleapis.com/fcm/send/..." }`}</Code>

            <Endpoint method='GET' path='/api/v1/push/status' auth desc='Returns whether the server has VAPID configured and whether the current user has an active subscription.' />
            <Code block>{`{ "server_enabled": true, "subscribed": false }`}</Code>

            <H3>Setup</H3>
            <Code block>{`# 1. Generate VAPID keys (run once)
cd stock-agent/backend
python tools/generate_vapid_keys.py

# 2. Paste the output into backend/.env
VAPID_PRIVATE_KEY=<key>
VAPID_PUBLIC_KEY=<key>
VAPID_SUBJECT=mailto:your@email.com

# 3. Restart the backend — push notifications are now active`}</Code>
            <P>The frontend <Code>usePushNotifications</Code> hook handles service worker registration, permission requests, subscription management, and syncing the subscription with the backend automatically.</P>
          </Section>

          {/* ── API: Chat ── */}
          <Section id='api-chat' title='API — AI Chat (SSE)'>
            <Endpoint method='POST' path='/api/v1/chat' auth desc='Starts the agentic loop and streams the response as Server-Sent Events.' />
            <H3>Request</H3>
            <Code block>{`{
  "messages": [
    { "role": "user", "content": "Analyze AAPL for a swing trade" }
  ],
  "currency": "EUR"
}`}</Code>
            <P>Optional <Code>currency</Code> <Code>EUR</Code> or <Code>USD</Code> (default <Code>EUR</Code>) — must match the in-app currency toggle. Tool results and the system prompt are normalized so the model answers in that currency.</P>
            <H3>SSE event types</H3>
            <Code block>{`// Text token
data: {"type": "text_delta", "text": "AAPL is currently..."}

// Tool being called
data: {"type": "tool_call", "name": "analyze_swing_setup"}

// Stream finished
data: {"type": "done"}`}</Code>
            <H3>Frontend usage</H3>
            <Code block>{`const res = await fetch('/api/v1/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': \`Bearer \${token}\` },
  body: JSON.stringify({ messages, currency: 'EUR' }),
})
const reader = res.body.getReader()
// read lines, parse JSON after "data: " prefix`}</Code>
          </Section>

          {/* ── API: WS ── */}
          <Section id='api-ws' title='API — WebSocket'>
            <Endpoint method='WS' path='/api/v1/ws/alerts?token=<jwt>' desc='Real-time alert push channel. Connect with the JWT as a query parameter. The server pushes a JSON object whenever an alert is triggered.' />
            <Endpoint method='WS' path='/api/v1/ws/prices?token=<jwt>' desc='Live price stream. Send {action:"subscribe"|"unsubscribe"|"set", tickers:[...]} to manage the subscription. Server pushes {type:"prices", quotes:[...]} on a 3s cadence when any subscribed ticker is live, 30s otherwise.' />
            <H3>Message format</H3>
            <Code block>{`{
  "id": "alert-42",
  "ticker": "AAPL",
  "condition": "above",
  "target_price": 200.00,
  "current_price": 201.35,
  "message": "AAPL crossed above €200.00 (now €201.35)",
  "timestamp": "2025-04-20T18:30:00Z"
}`}</Code>
            <H3>Reconnection</H3>
            <P>The frontend <Code>useAlertWS</Code> hook reconnects automatically after <strong style={{ color: '#f1f5f9' }}>10 seconds</strong> if the connection drops.</P>
          </Section>

          {/* ── Deploy: Docker ── */}
          <Section id='deploy-docker' title='Deployment — Docker'>
            <P>Both services have Dockerfiles. Use the root <Code>docker-compose.yml</Code> to run everything together.</P>
            <H3>Build and start</H3>
            <Code block>{`# from the stock-agent/ root
docker compose up --build -d`}</Code>
            <H3>docker-compose.yml overview</H3>
            <Code block>{`services:
  backend:
    build: ./backend
    ports: ["8000:8000"]
    env_file: ./backend/.env
    volumes: ["./data:/app/data"]   # persists the SQLite DB

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    environment:
      NEXT_PUBLIC_API_URL: http://backend:8000`}</Code>
            <H3>Frontend Dockerfile</H3>
            <Code block>{`FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]`}</Code>
          </Section>

          {/* ── Deploy: Env ── */}
          <Section id='deploy-env' title='Deployment — Production Env'>
            <Warn>Never commit <Code>.env</Code> files with real secrets to version control.</Warn>
            <P>For production deployments (Render, VPS, etc.) set these environment variables on the server — use <strong style={{ color: '#f1f5f9' }}>either</strong> <Code>DATABASE_PATH</Code> (SQLite on a persistent volume) <strong style={{ color: '#f1f5f9' }}>or</strong> <Code>DATABASE_URL</Code> (PostgreSQL, e.g. Supabase), not both as primary stores:</P>
            <Code block>{`# backend
JWT_SECRET=<cryptographically random 64-char string>
CORS_ORIGINS=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com
# SQLite (single instance + persistent disk), OR:
DATABASE_PATH=/app/data/portfolio.db
# PostgreSQL (recommended for serverless / multi-instance), e.g. Supabase:
# DATABASE_URL=postgresql://postgres:xxx@...pooler...:5432/postgres?sslmode=require
GROQ_API_KEY=gsk_...
SMTP_USER=alerts@yourdomain.com
SMTP_PASSWORD=<app password>

# frontend (build-time)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com`}</Code>
            <Warn>
              <strong style={{ color: '#f1f5f9' }}>Render + Supabase:</strong> if the API crashes at startup with
              <Code>Network is unreachable</Code> to <Code>db.*.supabase.co</Code>, the <strong>Direct</strong> connection
              (port 5432) may be using <strong>IPv6</strong>, which some hosts cannot reach. In Supabase →{' '}
              <strong>Project Settings → Database</strong>, use the <strong>Session</strong> or <strong>Transaction
              pooler</strong> connection string (pooler host; often port 6543 for transaction mode) as{' '}
              <Code>DATABASE_URL</Code>, not only the direct URI, then redeploy.
            </Warn>
            <H3>Generate a secure JWT secret</H3>
            <Code block>{`python3 -c "import secrets; print(secrets.token_hex(32))"`}</Code>
            <H3>Health check</H3>
            <Code block>{`curl https://api.yourdomain.com/api/v1/health
# → {"status":"ok"}`}</Code>
          </Section>

          {/* Footer */}
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: 32, marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#475569' }}>Not financial advice. For educational purposes only.</span>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <Link href='/' style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>Home</Link>
              <Link href='/privacy' style={{ fontSize: 13, color: '#64748b', textDecoration: 'none' }}>Privacy</Link>
              <button onClick={openCookieSettings} style={{ fontSize: 13, color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>🍪 Cookies</button>
              <Link href='/register' style={{ fontSize: 13, color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}>Get Started →</Link>
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}
