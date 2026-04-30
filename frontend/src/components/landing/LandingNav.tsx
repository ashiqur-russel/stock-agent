'use client'

import Link from 'next/link'
import { useApp } from '@/contexts/AppContext'
import { usePublicAuth } from '@/hooks/usePublicAuth'
import Toggle from '@/components/ui/Toggle'
import GitHubIcon from '@/components/ui/GitHubIcon'

export type LandingNavActive = 'whats-new' | null

export default function LandingNav({ activePage = null }: { activePage?: LandingNavActive }) {
  const { t, lang, setLang, setCurrency } = useApp()
  const { user: authUser, logout: publicLogout, mounted: authMounted } = usePublicAuth()

  const handleLangChange = (v: string) => {
    const l = v.toLowerCase() as 'en' | 'de'
    setLang(l)
    setCurrency(l === 'de' ? 'EUR' : 'USD')
  }

  const linkWhatsNew = activePage === 'whats-new'

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        background: 'rgba(6,14,32,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(34,197,94,0.1)',
        padding: '0 32px',
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <Link href='/' style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
        <span style={{ fontSize: 20 }}>📈</span>
        <span
          style={{
            fontSize: 17,
            fontWeight: 800,
            background: 'linear-gradient(90deg,#22c55e,#4ade80)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          StockAgent
        </span>
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <Toggle options={['EN', 'DE']} value={lang.toUpperCase()} onChange={handleLangChange} activeColor='#3b82f6' />
        {authMounted && authUser ? (
          <>
            <Link
              href='/whats-new'
              style={{
                color: linkWhatsNew ? '#22c55e' : '#94a3b8',
                fontSize: 14,
                textDecoration: 'none',
                fontWeight: linkWhatsNew ? 600 : undefined,
              }}
            >
              {t('land_nav_whats_new')}
            </Link>
            <Link href='/user/dashboard' style={{ color: '#22c55e', fontSize: 14, textDecoration: 'none', fontWeight: 600 }}>
              Dashboard →
            </Link>
            <button
              type='button'
              onClick={publicLogout}
              style={{
                background: 'transparent',
                border: '1px solid #1e3050',
                borderRadius: 7,
                padding: '5px 14px',
                color: '#94a3b8',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <a
              href='https://github.com/ashiqur-russel/stock-agent'
              target='_blank'
              rel='noopener noreferrer'
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                color: '#94a3b8',
                fontSize: 13,
                textDecoration: 'none',
                border: '1px solid #1e3050',
                borderRadius: 7,
                padding: '5px 11px',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <GitHubIcon size={14} />
              ★ Star
            </a>
            <Link href='/docs' style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>
              {t('land_docs')}
            </Link>
            <Link
              href='/whats-new'
              style={{
                color: linkWhatsNew ? '#22c55e' : '#94a3b8',
                fontSize: 14,
                textDecoration: 'none',
                fontWeight: linkWhatsNew ? 600 : undefined,
              }}
            >
              {t('land_nav_whats_new')}
            </Link>
            <Link href='/login' style={{ color: '#94a3b8', fontSize: 14, textDecoration: 'none' }}>
              {t('land_signin')}
            </Link>
            <Link
              href='/register'
              className='shimmer-btn'
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                color: '#fff',
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                display: 'inline-block',
              }}
            >
              {t('land_get_started')}
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
