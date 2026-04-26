'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/contexts/AppContext'

const CONSENT_KEY = 'cookie_consent_v1'

type Consent = { essential: true; preferences: boolean }
type ExpandRow = 'server' | 'third' | 'rights' | null

function parseConsent(raw: string | null): Consent | null {
  if (!raw) return null
  if (raw === 'accepted') return { essential: true, preferences: true }
  if (raw === 'declined') return { essential: true, preferences: false }
  try { return JSON.parse(raw) } catch { return null }
}

function saveConsent(preferences: boolean) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify({ essential: true, preferences }))
}

export function openCookieSettings() {
  window.dispatchEvent(new CustomEvent('cookie:open-settings'))
}

function ExpandableRow({ open, onToggle, title, children }: {
  open: boolean
  onToggle: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <div className='border-b border-surface-input'>
      <button
        onClick={onToggle}
        className='w-full flex items-center gap-3 py-3.5 bg-transparent border-none cursor-pointer text-foreground text-left'
      >
        <span className='text-text-dim text-base w-3.5 shrink-0'>{open ? '−' : '+'}</span>
        <span className='text-sm font-semibold'>{title}</span>
      </button>
      {open && (
        <div className='pb-3.5 pl-6 text-xs text-text-dim leading-relaxed'>
          {children}
        </div>
      )}
    </div>
  )
}

export default function CookieBanner() {
  const { t } = useApp()
  const [consent, setConsent] = useState<Consent | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [prefEnabled, setPrefEnabled] = useState(true)
  const [expanded, setExpanded] = useState<ExpandRow>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const raw = localStorage.getItem(CONSENT_KEY)
    const c = parseConsent(raw)
    setConsent(c)
    if (!c) setShowModal(true)
    else setPrefEnabled(c.preferences)
  }, [])

  useEffect(() => {
    const handler = () => setShowModal(true)
    window.addEventListener('cookie:open-settings', handler)
    return () => window.removeEventListener('cookie:open-settings', handler)
  }, [])

  const toggle = (row: ExpandRow) => setExpanded(prev => prev === row ? null : row)

  const allowAll = () => {
    saveConsent(true)
    setConsent({ essential: true, preferences: true })
    setPrefEnabled(true)
    setShowModal(false)
  }

  const rejectAll = () => {
    saveConsent(false)
    setConsent({ essential: true, preferences: false })
    setPrefEnabled(false)
    setShowModal(false)
  }

  const submitChoices = () => {
    saveConsent(prefEnabled)
    setConsent({ essential: true, preferences: prefEnabled })
    setShowModal(false)
  }

  if (!mounted) return null

  return (
    <>
      {/* Floating cookie button */}
      {consent && !showModal && (
        <button
          onClick={() => setShowModal(true)}
          title={t('cookie_open_settings')}
          className='fixed bottom-5 right-5 z-[998] w-11 h-11 rounded-full bg-surface border border-surface-input text-xl cursor-pointer flex items-center justify-center shadow-lg transition-colors hover:border-brand'
        >
          🍪
        </button>
      )}

      {/* Modal overlay */}
      {showModal && (
        <div
          className='fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center p-4'
          onClick={e => { if (e.target === e.currentTarget && consent) setShowModal(false) }}
        >
          <div className='bg-surface border border-surface-input rounded-2xl px-7 pt-7 pb-6 max-w-[520px] w-full max-h-[88vh] overflow-y-auto text-foreground'>

            {/* Header */}
            <h2 className='text-xl font-bold mb-3'>{t('cookie_about_privacy')}</h2>
            <p className='text-sm text-text-muted leading-relaxed mb-5'>{t('cookie_privacy_desc')}</p>

            {/* Allow all */}
            <button
              onClick={allowAll}
              className='px-6 py-2.5 bg-brand rounded-full text-white font-bold text-sm cursor-pointer border-none mb-6'
            >
              {t('cookie_allow_all')}
            </button>

            {/* Category section */}
            <div className='border-t border-surface-input pt-5 mb-1'>
              <h3 className='text-[15px] font-bold mb-1'>{t('cookie_manage_prefs')}</h3>

              {/* Strictly Necessary */}
              <div className='flex items-start justify-between gap-4 py-3.5 border-b border-surface-input'>
                <div className='flex gap-3'>
                  <span className='text-text-dim text-base leading-snug w-3.5 shrink-0'>+</span>
                  <div>
                    <div className='text-sm font-semibold'>{t('cookie_necessary_title')}</div>
                    <div className='text-xs text-text-dim mt-1 leading-relaxed'>{t('cookie_necessary_desc')}</div>
                  </div>
                </div>
                <span className='text-xs text-brand font-semibold whitespace-nowrap pt-0.5'>
                  {t('cookie_always_active')}
                </span>
              </div>

              {/* Preferences with toggle */}
              <div className='flex items-start justify-between gap-4 py-3.5 border-b border-surface-input'>
                <div className='flex gap-3'>
                  <span className='text-text-dim text-base leading-snug w-3.5 shrink-0'>+</span>
                  <div>
                    <div className='text-sm font-semibold'>{t('cookie_prefs_title')}</div>
                    <div className='text-xs text-text-dim mt-1 leading-relaxed'>{t('cookie_prefs_desc')}</div>
                  </div>
                </div>
                <button
                  role='switch'
                  aria-checked={prefEnabled}
                  onClick={() => setPrefEnabled(v => !v)}
                  className='shrink-0 w-[46px] h-[26px] rounded-full border-none cursor-pointer relative mt-0.5 transition-colors duration-200'
                  style={{ background: prefEnabled ? '#22c55e' : '#334155' }}
                >
                  <span
                    className='absolute top-[3px] w-5 h-5 rounded-full bg-white transition-all duration-200 block'
                    style={{ left: prefEnabled ? 23 : 3 }}
                  />
                </button>
              </div>

              {/* Account & Server Data */}
              <ExpandableRow open={expanded === 'server'} onToggle={() => toggle('server')} title={t('cookie_server_title')}>
                {t('cookie_server_desc')}
              </ExpandableRow>

              {/* Third-Party Services */}
              <ExpandableRow open={expanded === 'third'} onToggle={() => toggle('third')} title={t('cookie_third_title')}>
                <p className='mb-2'>{t('cookie_third_groq')}</p>
                <p className='mb-2'>{t('cookie_third_yf')}</p>
                <a href='https://groq.com/privacy-policy/' target='_blank' rel='noopener noreferrer' className='text-brand no-underline hover:underline'>
                  Groq Privacy Policy ↗
                </a>
              </ExpandableRow>

              {/* Your Rights */}
              <ExpandableRow open={expanded === 'rights'} onToggle={() => toggle('rights')} title={t('cookie_rights_full_title')}>
                <p className='mb-2'>{t('cookie_rights_full_desc')}</p>
                <div className='flex gap-4 flex-wrap'>
                  <a href='https://gdpr-info.eu/art-15-gdpr/' target='_blank' rel='noopener noreferrer' className='text-brand no-underline hover:underline'>Art. 15 (Access) ↗</a>
                  <a href='https://gdpr-info.eu/art-17-gdpr/' target='_blank' rel='noopener noreferrer' className='text-brand no-underline hover:underline'>Art. 17 (Erasure) ↗</a>
                  <Link href='/privacy' className='text-brand no-underline hover:underline'>{t('cookie_privacy_link')} →</Link>
                </div>
              </ExpandableRow>
            </div>

            {/* Action buttons */}
            <div className='flex gap-2.5 mt-5 flex-wrap'>
              <button
                onClick={rejectAll}
                className='flex-1 py-2.5 px-4 bg-surface-input border border-border-strong rounded-full text-foreground font-semibold cursor-pointer text-sm'
              >
                {t('cookie_reject_all')}
              </button>
              <button
                onClick={submitChoices}
                className='flex-1 py-2.5 px-4 bg-transparent border border-brand rounded-full text-brand font-semibold cursor-pointer text-sm'
              >
                {t('cookie_submit')}
              </button>
            </div>

            {/* Legal note */}
            <p className='mt-3.5 text-[11px] text-text-dim leading-relaxed'>
              <a href='https://gdpr-info.eu/art-6-gdpr/' target='_blank' rel='noopener noreferrer' className='text-text-dim hover:text-brand no-underline'>Art. 6(1)(b) GDPR ↗</a>
              {' '}— We never access your data without a written request.{' '}
              <Link href='/privacy' className='text-brand no-underline hover:underline'>{t('cookie_privacy_link')}</Link>
            </p>
            <p className='mt-1.5 text-[11px] text-text-dim leading-relaxed'>
              {t('cookie_edu_disclaimer')}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
