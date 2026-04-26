'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import Toggle from '@/components/ui/Toggle'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import { alerts as alertsApi } from '@/lib/api'

const links = [
  { href: '/user/dashboard', labelKey: 'nav_dashboard' as const, icon: '📊' },
  { href: '/user/transactions', labelKey: 'nav_transactions' as const, icon: '📋' },
  { href: '/user/paper', labelKey: 'nav_paper' as const, icon: '📝' },
  { href: '/user/agent', labelKey: 'nav_chat' as const, icon: '🤖' },
  { href: '/user/alerts', labelKey: 'nav_alerts' as const, icon: '🔔' },
  { href: '/docs', labelKey: 'nav_docs' as const, icon: '📚' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { t, lang, setLang, currency, setCurrency, marketRegion, setMarketRegion } = useApp()
  const { logout } = useAuth()
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await alertsApi.unreadCount()
        setUnread(data.count ?? 0)
      } catch {
        // ignore
      }
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 60_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <nav style={{
      width: 220,
      minHeight: '100vh',
      background: '#0f172a',
      borderRight: '1px solid #1e293b',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 0',
      position: 'fixed',
      top: 0,
      left: 0,
    }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #1e293b' }}>
        <img src='/logo.svg' alt='StockAgent' style={{ height: 32, display: 'block' }} />
      </div>

      <div style={{ flex: 1, padding: '12px 0' }}>
        {links.map(({ href, labelKey, icon }) => {
          const isActive =
            href === '/user/dashboard'
              ? pathname === '/user/dashboard'
              : pathname === href || pathname.startsWith(`${href}/`)
          const isAlerts = href === '/user/alerts'
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? '#22c55e' : '#94a3b8',
                background: isActive ? '#0d1f17' : 'transparent',
                textDecoration: 'none',
                borderLeft: isActive ? '3px solid #22c55e' : '3px solid transparent',
                transition: 'all 0.15s',
                position: 'relative',
              }}
            >
              <span>{icon}</span>
              <span>{t(labelKey)}</span>
              {isAlerts && unread > 0 && (
                <span style={{
                  marginLeft: 'auto',
                  background: '#ef4444',
                  color: '#fff',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '1px 7px',
                  minWidth: 20,
                  textAlign: 'center',
                }}>
                  {unread}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid #1e293b', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Toggle
          options={['EN', 'DE']}
          value={lang.toUpperCase()}
          onChange={(v) => setLang(v.toLowerCase() as 'en' | 'de')}
          activeColor='#3b82f6'
        />
        <Toggle
          options={['EUR', 'USD']}
          value={currency}
          onChange={(v) => setCurrency(v as 'EUR' | 'USD')}
          activeColor='#22c55e'
        />
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{t('pt_hours_label')}</div>
        <Toggle
          options={['DE', 'US']}
          value={marketRegion}
          onChange={(v) => setMarketRegion(v as 'DE' | 'US')}
          activeColor='#0ea5e9'
        />
        <button
          onClick={logout}
          style={{
            marginTop: 4,
            padding: '8px 12px',
            background: 'transparent',
            border: '1px solid #334155',
            borderRadius: 8,
            color: '#94a3b8',
            fontSize: 13,
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          🚪 {t('nav_logout')}
        </button>
      </div>
    </nav>
  )
}
