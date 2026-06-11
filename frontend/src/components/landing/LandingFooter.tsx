'use client'

import Link from 'next/link'
import { openCookieSettings } from '@/components/CookieBanner'
import { useApp } from '@/contexts/AppContext'

export default function LandingFooter() {
  const { t } = useApp()

  const links = [
    { href: '/',          label: t('land_nav_home') },
    { href: '/whats-new', label: t('land_nav_whats_new') },
    { href: '/docs',      label: t('land_docs') },
    { href: '/#contact',  label: t('contact_title') },
    { href: '/privacy',   label: t('cookie_privacy_link') },
    { href: '/login',     label: t('land_signin') },
    { href: '/register',  label: t('land_register') },
  ]

  return (
    <footer className='border-t border-white/[0.04] bg-[#040a18] px-8 py-5 flex justify-between items-center flex-wrap gap-4'>
      <span className='text-xs text-text-dim'>{t('land_disclaimer')}</span>
      <nav className='flex items-center gap-6 flex-wrap'>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className='text-xs text-text-dim hover:text-text-muted transition-colors no-underline'>
            {l.label}
          </Link>
        ))}
        <button
          onClick={openCookieSettings}
          className='text-xs text-text-dim hover:text-text-muted transition-colors bg-transparent border-none cursor-pointer p-0'
        >
          🍪 {t('cookie_open_settings')}
        </button>
      </nav>
    </footer>
  )
}
