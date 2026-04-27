'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { openCookieSettings } from '@/components/CookieBanner'
import { useApp } from '@/contexts/AppContext'
import { release, type ReleasePreviewPayload } from '@/lib/api'
import { setWhatsNewIntent } from '@/lib/whatsNewFunnel'
import { usePublicAuth } from '@/hooks/usePublicAuth'
import Toggle from '@/components/ui/Toggle'
import GitHubIcon from '@/components/ui/GitHubIcon'
import { SpotlightCard } from '@/components/ui/Spotlight'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

export default function WhatsNewPage() {
  const { t, lang, setLang, currency, setCurrency } = useApp()
  const { user: authUser, logout: publicLogout, mounted: authMounted } = usePublicAuth()
  const [preview, setPreview] = useState<ReleasePreviewPayload | null>(null)
  const [previewVer, setPreviewVer] = useState('')

  const handleLangChange = (v: string) => {
    const l = v.toLowerCase() as 'en' | 'de'
    setLang(l)
    setCurrency(l === 'de' ? 'EUR' : 'USD')
  }

  const loadPreview = useCallback(() => {
    release
      .getPreview(lang === 'de' ? 'de' : 'en')
      .then((d) => {
        setPreview(d.release)
        setPreviewVer(d.app_version ?? '')
      })
      .catch(() => {
        setPreview(null)
        setPreviewVer('')
      })
  }, [lang])

  useEffect(() => {
    loadPreview()
  }, [loadPreview])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#060e20',
        color: '#f1f5f9',
        fontFamily: 'var(--font-geist-sans)',
        overflowX: 'hidden',
      }}
    >
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
              <Link href='/' style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>
                {t('land_nav_home')}
              </Link>
              <span style={{ color: '#22c55e', fontSize: 14, fontWeight: 600 }}>{t('land_nav_whats_new')}</span>
              <Link href='/docs' style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>
                {t('land_docs')}
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
              <Link href='/' style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>
                {t('land_nav_home')}
              </Link>
              <span style={{ color: '#22c55e', fontSize: 14, fontWeight: 600 }}>{t('land_nav_whats_new')}</span>
              <Link href='/docs' style={{ color: '#64748b', fontSize: 14, textDecoration: 'none' }}>
                {t('land_docs')}
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

      <section style={{ padding: '56px 32px 40px', maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
        <motion.div initial='hidden' animate='show' variants={{ show: { transition: { staggerChildren: 0.1 } } }}>
          <motion.div variants={fadeUp}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#4ade80',
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              {t('page_whats_new_hero_kicker')}
            </div>
          </motion.div>
          <motion.h1
            variants={fadeUp}
            style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: 800,
              margin: '0 0 18px',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
            }}
          >
            {t('page_whats_new_hero_title')}
          </motion.h1>
          <motion.p variants={fadeUp} style={{ fontSize: 17, color: '#64748b', margin: 0, lineHeight: 1.7 }}>
            {t('page_whats_new_hero_sub')}
          </motion.p>
        </motion.div>
      </section>

      <section style={{ padding: '0 32px 56px', maxWidth: 800, margin: '0 auto' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <SpotlightCard
            style={{
              background: 'rgba(15,23,42,0.75)',
              border: '1px solid rgba(34,197,94,0.18)',
              borderRadius: 16,
              padding: '28px 32px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#4ade80',
                textTransform: 'uppercase',
                marginBottom: 12,
              }}
            >
              {t('page_whats_new_purpose_kicker')}
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 14px', color: '#f8fafc' }}>
              {t('page_whats_new_purpose_title')}
            </h2>
            <p style={{ margin: 0, fontSize: 16, color: '#94a3b8', lineHeight: 1.75 }}>{t('page_whats_new_purpose_body')}</p>
          </SpotlightCard>
        </motion.div>
      </section>

      <section style={{ padding: '0 32px 64px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          <SpotlightCard
            style={{
              background: 'rgba(15,23,42,0.75)',
              border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: 16,
              padding: '24px 26px',
              textAlign: 'left',
              margin: 0,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#38bdf8',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              {t('page_whats_new_inapp_kicker')}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px', color: '#f8fafc' }}>
              {t('page_whats_new_inapp_title')}
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: 15, color: '#94a3b8', lineHeight: 1.65 }}>{t('page_whats_new_inapp_body')}</p>
            {!authMounted || !authUser ? (
              <Link
                href='/register?from=whats_new'
                onClick={() => setWhatsNewIntent()}
                style={{ color: '#38bdf8', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}
              >
                {t('page_whats_new_inapp_cta')} →
              </Link>
            ) : (
              <Link href='/user/dashboard?show_whats_new=1' style={{ color: '#38bdf8', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                {t('land_whats_new_dashboard')} →
              </Link>
            )}
          </SpotlightCard>

          <SpotlightCard
            style={{
              background: 'rgba(15,23,42,0.75)',
              border: '1px solid rgba(34,197,94,0.2)',
              borderRadius: 16,
              padding: '24px 26px',
              textAlign: 'left',
              margin: 0,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: '#4ade80',
                textTransform: 'uppercase',
                marginBottom: 10,
              }}
            >
              {t('page_whats_new_os_kicker')}
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 12px', color: '#f8faffc' }}>
              {t('page_whats_new_os_title')}
            </h2>
            <p style={{ margin: '0 0 18px', fontSize: 15, color: '#94a3b8', lineHeight: 1.65 }}>{t('page_whats_new_os_body')}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <a
                href='https://github.com/ashiqur-russel/stock-agent'
                target='_blank'
                rel='noopener noreferrer'
                style={{ color: '#4ade80', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <GitHubIcon size={16} />
                {t('page_whats_new_os_cta_repo')} →
              </a>
              <Link href='/docs' style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                {t('page_whats_new_os_cta_docs')} →
              </Link>
            </div>
          </SpotlightCard>
        </motion.div>
      </section>

      {preview ? (
        <section style={{ padding: '0 32px 80px', maxWidth: 944, margin: '0 auto', width: '100%' }}>
          <motion.div
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            style={{
              position: 'relative',
              borderRadius: 18,
              border: '1px solid rgba(34,197,94,0.22)',
              background: 'linear-gradient(165deg, rgba(15,23,42,0.96) 0%, rgba(2,6,23,0.99) 100%)',
              overflow: 'hidden',
              boxShadow: '0 24px 48px rgba(0,0,0,0.35)',
            }}
          >
            <div style={{ padding: '28px 28px 112px', position: 'relative', zIndex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  color: '#4ade80',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}
              >
                {t('page_whats_new_release_kicker')}
                {previewVer ? ` · v${previewVer}` : ''}
              </div>
              <h2 style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 700, margin: '0 0 18px', color: '#f8fafc', lineHeight: 1.25 }}>
                {preview.title}
              </h2>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {preview.features_teaser.map((line, i) => (
                  <li
                    key={`${i}-${line.slice(0, 24)}`}
                    style={{
                      fontSize: 15,
                      color: '#cbd5e1',
                      lineHeight: 1.55,
                      paddingLeft: 16,
                      borderLeft: '3px solid rgba(34,197,94,0.45)',
                    }}
                  >
                    {line}
                  </li>
                ))}
              </ul>
              {preview.has_more ? (
                <p style={{ margin: '18px 0 0', fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>{t('land_whats_new_more')}</p>
              ) : null}
            </div>
            <div
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                height: '52%',
                background: 'linear-gradient(180deg, rgba(2,6,23,0) 0%, rgba(2,6,23,0.55) 38%, rgba(2,6,23,0.94) 100%)',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                padding: '22px 24px 26px',
                zIndex: 2,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {authMounted && authUser ? (
                <Link
                  href='/user/dashboard?show_whats_new=1'
                  className='shimmer-btn'
                  style={{
                    padding: '12px 28px',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  {t('land_whats_new_dashboard')}
                </Link>
              ) : (
                <Link
                  href='/register?from=whats_new'
                  onClick={() => setWhatsNewIntent()}
                  className='shimmer-btn'
                  style={{
                    padding: '12px 28px',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-block',
                  }}
                >
                  {t('land_whats_new_cta')}
                </Link>
              )}
            </div>
          </motion.div>
        </section>
      ) : null}

      <footer className='border-t border-white/[0.04] bg-[#040a18] px-8 py-5 flex justify-between items-center flex-wrap gap-4'>
        <span className='text-xs text-text-dim'>{t('land_disclaimer')}</span>
        <nav className='flex items-center gap-6 flex-wrap'>
          {[
            { href: '/', label: t('land_nav_home') },
            { href: '/whats-new', label: t('land_nav_whats_new') },
            { href: '/docs', label: t('land_docs') },
            { href: '/#contact', label: t('contact_title') },
            { href: '/privacy', label: t('cookie_privacy_link') },
            { href: '/login', label: t('land_signin') },
            { href: '/register', label: t('land_register') },
          ].map((l) => (
            <Link key={l.href} href={l.href} className='text-xs text-text-dim hover:text-text-muted transition-colors no-underline'>
              {l.label}
            </Link>
          ))}
          <button
            type='button'
            onClick={openCookieSettings}
            className='text-xs text-text-dim hover:text-text-muted transition-colors bg-transparent border-none cursor-pointer p-0'
          >
            🍪 {t('cookie_open_settings')}
          </button>
        </nav>
      </footer>
    </div>
  )
}
