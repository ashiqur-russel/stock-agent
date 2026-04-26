'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/contexts/AppContext'

const CONSENT_KEY = 'cookie_consent_v1'

type Consent = { essential: true; preferences: boolean }

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

export default function CookieBanner() {
  const { t } = useApp()
  const [consent, setConsent] = useState<Consent | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [prefEnabled, setPrefEnabled] = useState(true)
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
      {/* Floating cookie button — visible once consent is recorded */}
      {consent && !showModal && (
        <button
          onClick={() => setShowModal(true)}
          title={t('cookie_open_settings')}
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 998,
            width: 44, height: 44, borderRadius: '50%',
            background: '#0f172a', border: '1px solid #1e293b',
            fontSize: 20, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.borderColor = '#22c55e')}
          onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e293b')}
        >
          🍪
        </button>
      )}

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 1000, display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget && consent) setShowModal(false) }}
        >
          <div style={{
            background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: 16, padding: '28px 28px 22px',
            maxWidth: 520, width: '100%', maxHeight: '88vh',
            overflowY: 'auto', color: '#f1f5f9',
          }}>

            {/* Header */}
            <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700 }}>
              {t('cookie_about_privacy')}
            </h2>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#94a3b8', lineHeight: 1.65 }}>
              {t('cookie_privacy_desc')}
            </p>

            {/* Allow all */}
            <button
              onClick={allowAll}
              style={{
                padding: '10px 24px', background: '#22c55e',
                border: 'none', borderRadius: 20,
                color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 14,
                marginBottom: 24,
              }}
            >
              {t('cookie_allow_all')}
            </button>

            {/* Category section */}
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: 20, marginBottom: 4 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>
                {t('cookie_manage_prefs')}
              </h3>

              {/* Strictly Necessary row */}
              <div style={{
                display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', gap: 16,
                padding: '14px 0', borderBottom: '1px solid #1e293b',
              }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ color: '#475569', fontSize: 16, lineHeight: 1.4 }}>+</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{t('cookie_necessary_title')}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>
                      {t('cookie_necessary_desc')}
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: 12, color: '#22c55e', fontWeight: 600,
                  whiteSpace: 'nowrap', paddingTop: 2,
                }}>
                  {t('cookie_always_active')}
                </span>
              </div>

              {/* Preferences row */}
              <div style={{
                display: 'flex', alignItems: 'flex-start',
                justifyContent: 'space-between', gap: 16,
                padding: '14px 0', borderBottom: '1px solid #1e293b',
              }}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <span style={{ color: '#475569', fontSize: 16, lineHeight: 1.4 }}>+</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{t('cookie_prefs_title')}</div>
                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>
                      {t('cookie_prefs_desc')}
                    </div>
                  </div>
                </div>
                {/* Toggle */}
                <button
                  role="switch"
                  aria-checked={prefEnabled}
                  onClick={() => setPrefEnabled(v => !v)}
                  style={{
                    flexShrink: 0, width: 46, height: 26, borderRadius: 13,
                    background: prefEnabled ? '#22c55e' : '#334155',
                    border: 'none', cursor: 'pointer',
                    position: 'relative', transition: 'background 0.2s',
                    marginTop: 2,
                  }}
                >
                  <span style={{
                    position: 'absolute', top: 3,
                    left: prefEnabled ? 23 : 3,
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#fff', transition: 'left 0.2s',
                    display: 'block',
                  }} />
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
              <button
                onClick={rejectAll}
                style={{
                  flex: 1, padding: '10px 16px',
                  background: '#1e293b', border: '1px solid #334155',
                  borderRadius: 20, color: '#f1f5f9',
                  fontWeight: 600, cursor: 'pointer', fontSize: 14,
                }}
              >
                {t('cookie_reject_all')}
              </button>
              <button
                onClick={submitChoices}
                style={{
                  flex: 1, padding: '10px 16px',
                  background: 'transparent', border: '1px solid #22c55e',
                  borderRadius: 20, color: '#22c55e',
                  fontWeight: 600, cursor: 'pointer', fontSize: 14,
                }}
              >
                {t('cookie_submit')}
              </button>
            </div>

            {/* Legal note */}
            <p style={{ marginTop: 16, fontSize: 11, color: '#475569', lineHeight: 1.6 }}>
              {t('cookie_legal_note')}
            </p>
          </div>
        </div>
      )}
    </>
  )
}
