'use client'

import Link from 'next/link'
import { useApp } from '@/contexts/AppContext'
import { openCookieSettings } from '@/components/CookieBanner'
import { usePublicAuth } from '@/hooks/usePublicAuth'

function LegalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className='text-brand no-underline hover:underline text-[11px] align-middle ml-1'
    >
      [{children} ↗]
    </a>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='mb-12'>
      <h2 className='text-lg font-bold text-foreground mb-1.5'>{title}</h2>
      <div className='w-8 h-[3px] bg-brand rounded-sm mb-4' />
      <div className='text-sm text-text-muted leading-[1.8]'>{children}</div>
    </section>
  )
}

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className='bg-[#0d1a2e] border border-[#1e3050] rounded-xl px-[18px] py-3.5 text-sm text-accent-sky leading-[1.7] mt-2'>
      {children}
    </div>
  )
}

function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div className='bg-[#1c0f00] border border-[#78350f] rounded-xl px-[18px] py-3.5 text-sm text-[#fbbf24] leading-[1.7] mt-2'>
      {children}
    </div>
  )
}

function GreenBox({ children }: { children: React.ReactNode }) {
  return (
    <div className='bg-surface-active border border-brand-dark rounded-xl px-[18px] py-3.5 text-sm text-brand-light leading-[1.7] mt-2'>
      {children}
    </div>
  )
}

export default function PrivacyPage() {
  const { t } = useApp()
  const { user, logout, mounted } = usePublicAuth()

  return (
    <div className='min-h-screen bg-background text-foreground' style={{ fontFamily: 'var(--font-geist-sans)' }}>

      {/* Navbar */}
      <nav className='sticky top-0 z-[100] bg-[rgba(6,14,32,0.95)] backdrop-blur-md border-b border-surface-input px-8 h-[60px] flex items-center justify-between'>
        <Link href='/' className='flex items-center gap-2 no-underline'>
          <span className='text-lg'>📈</span>
          <span className='text-base font-extrabold bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent'>
            StockAgent
          </span>
        </Link>
        <div className='flex gap-5 items-center'>
          <Link href='/docs' className='text-[13px] text-text-dim no-underline hover:text-text-muted'>Docs</Link>
          {mounted && user ? (
            <>
              <Link href='/user/dashboard' className='text-[13px] text-brand no-underline font-semibold'>Dashboard →</Link>
              <button
                onClick={logout}
                className='text-[13px] text-text-muted bg-transparent border border-surface-input rounded-lg px-3 py-1 cursor-pointer hover:border-brand hover:text-brand transition-colors'
              >
                Logout
              </button>
            </>
          ) : (
            <Link href='/login' className='text-[13px] text-text-muted no-underline hover:text-foreground'>Sign In</Link>
          )}
        </div>
      </nav>

      {/* Content */}
      <div className='max-w-[720px] mx-auto px-6 pt-12 pb-20'>

        {/* Page header */}
        <div className='mb-12'>
          <h1 className='text-[32px] font-extrabold mb-1.5'>{t('privacy_title')}</h1>
          <p className='text-[15px] text-[#475569] mb-1'>{t('privacy_subtitle')}</p>
          <p className='text-xs text-[#334155]'>{t('privacy_last_updated')}</p>
        </div>

        {/* 1 — Data Controller */}
        <Section title={t('privacy_controller_title')}>
          <p>
            {t('privacy_controller_body')}{' '}
            <a href='/#contact' className='text-brand no-underline hover:underline text-xs'>Contact form ↗</a>
          </p>
        </Section>

        {/* 2 — What we collect */}
        <Section title={t('privacy_collect_title')}>
          <p>
            {t('privacy_collect_body')}
            <LegalLink href='https://gdpr-info.eu/art-6-gdpr/'>Art. 6(1)(b) GDPR</LegalLink>
          </p>
        </Section>

        {/* 3 — Server data */}
        <Section title={t('privacy_server_title')}>
          <p>{t('privacy_server_body')}</p>
        </Section>

        {/* 4 — Admin access policy */}
        <Section title={t('privacy_access_title')}>
          <InfoBox>{t('privacy_access_body')}</InfoBox>
        </Section>

        {/* 5 — Third parties */}
        <Section title={t('privacy_third_title')}>
          <p className='mb-3'>
            <strong className='text-foreground'>Groq AI</strong> —{' '}
            {t('privacy_third_groq')}{' '}
            <a href='https://groq.com/privacy-policy/' target='_blank' rel='noopener noreferrer' className='text-brand no-underline hover:underline text-xs'>
              [Groq Privacy Policy ↗]
            </a>
          </p>
          <p>
            <strong className='text-foreground'>Yahoo Finance</strong> —{' '}
            {t('privacy_third_yf')}
          </p>
        </Section>

        {/* 6 — Retention */}
        <Section title={t('privacy_retention_title')}>
          <p>{t('privacy_retention_body')}</p>
        </Section>

        {/* 7 — Rights */}
        <Section title={t('privacy_rights_title')}>
          <p className='mb-3'>
            {t('privacy_rights_body')}{' '}
            <a href='/#contact' className='text-brand no-underline hover:underline text-xs'>Contact form ↗</a>
          </p>
          <div className='flex flex-wrap gap-3 text-xs'>
            <a href='https://gdpr-info.eu/art-15-gdpr/' target='_blank' rel='noopener noreferrer' className='text-brand no-underline hover:underline'>Art. 15 — Right of Access ↗</a>
            <a href='https://gdpr-info.eu/art-16-gdpr/' target='_blank' rel='noopener noreferrer' className='text-brand no-underline hover:underline'>Art. 16 — Rectification ↗</a>
            <a href='https://gdpr-info.eu/art-17-gdpr/' target='_blank' rel='noopener noreferrer' className='text-brand no-underline hover:underline'>Art. 17 — Erasure ↗</a>
            <a href='https://gdpr-info.eu/art-20-gdpr/' target='_blank' rel='noopener noreferrer' className='text-brand no-underline hover:underline'>Art. 20 — Portability ↗</a>
            <a href='https://gdpr-info.eu/art-21-gdpr/' target='_blank' rel='noopener noreferrer' className='text-brand no-underline hover:underline'>Art. 21 — Objection ↗</a>
          </div>
        </Section>

        {/* 8 — Cookies */}
        <Section title={t('privacy_cookies_title')}>
          <p className='mb-3'>{t('privacy_cookies_body')}</p>
          <button
            onClick={openCookieSettings}
            className='px-4 py-2 bg-transparent border border-border-strong rounded-lg text-text-muted cursor-pointer text-[13px] hover:border-brand hover:text-brand transition-colors'
          >
            🍪 {t('cookie_open_settings')}
          </button>
        </Section>

        {/* 9 — Disclaimer */}
        <Section title={t('privacy_disclaimer_title')}>
          <WarnBox>{t('privacy_disclaimer_body')}</WarnBox>
        </Section>

        {/* 10 — Hosting notice */}
        <Section title={t('privacy_hosting_title')}>
          <InfoBox>{t('privacy_hosting_body')}</InfoBox>
        </Section>

        {/* 11 — Sponsorship */}
        <Section title={t('privacy_sponsor_title')}>
          <GreenBox>
            {t('privacy_sponsor_body')}{' '}
            <a href='/#contact' className='text-brand-light no-underline hover:underline'>Contact form ↗</a>
            {' · '}
            <a href='https://github.com/ashiqur-russel/stock-agent' target='_blank' rel='noopener noreferrer' className='text-brand-light no-underline hover:underline'>GitHub ↗</a>
          </GreenBox>
        </Section>

        {/* Footer */}
        <div className='border-t border-surface-input pt-6 mt-4 flex justify-between items-center flex-wrap gap-3'>
          <span className='text-xs text-[#334155]'>{t('privacy_last_updated')}</span>
          <div className='flex gap-5'>
            <Link href='/' className='text-[13px] text-text-dim no-underline hover:text-text-muted'>Home</Link>
            <Link href='/docs' className='text-[13px] text-text-dim no-underline hover:text-text-muted'>Docs</Link>
            <button onClick={openCookieSettings} className='text-[13px] text-text-dim bg-transparent border-none cursor-pointer p-0 hover:text-text-muted'>🍪 Cookies</button>
          </div>
        </div>
      </div>
    </div>
  )
}
