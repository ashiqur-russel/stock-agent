'use client'

import { useEffect, useState } from 'react'
import { useApp } from '@/contexts/AppContext'

const CONSENT_KEY = 'cookie_consent_v1'

const storageRows = [
  { key: 'stock_agent_token', purpose: 'JWT authentication token', duration: '30 days' },
  { key: 'stock_agent_user', purpose: 'User name/email for UI display', duration: '30 days' },
  { key: 'cookie_consent_v1', purpose: 'Records your cookie consent', duration: '1 year' },
  { key: 'app_lang', purpose: 'Language preference (EN/DE)', duration: 'Persistent' },
  { key: 'app_currency', purpose: 'Currency preference (EUR/USD)', duration: 'Persistent' },
  { key: 'app_market_region', purpose: 'Reference market for open/close (DE/US); synced to your account when logged in', duration: 'Persistent' },
]

export default function CookieBanner() {
  const { t } = useApp()
  const [show, setShow] = useState(false)
  const [modal, setModal] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(CONSENT_KEY)) setShow(true)
  }, [])

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, '1')
    setShow(false)
    setModal(false)
  }

  if (!show) return null

  return (
    <>
      {modal && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setModal(false) }}
        >
          <div style={{
            background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12,
            padding: 28, maxWidth: 600, width: '100%', maxHeight: '80vh', overflowY: 'auto',
            color: '#f1f5f9',
          }}>
            <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700 }}>{t('cookie_modal_title')}</h2>

            <h3 style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600, margin: '16px 0 8px' }}>{t('cookie_legal')}</h3>
            <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6 }}>{t('cookie_legal_text')}</p>

            <h3 style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600, margin: '16px 0 8px' }}>{t('cookie_rights')}</h3>
            <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6 }}>{t('cookie_rights_text')}</p>

            <h3 style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600, margin: '16px 0 8px' }}>{t('cookie_what_stored')}</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: '#94a3b8' }}>{t('cookie_storage_key')}</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: '#94a3b8' }}>{t('cookie_storage_purpose')}</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: '#94a3b8' }}>{t('cookie_storage_duration')}</th>
                </tr>
              </thead>
              <tbody>
                {storageRows.map((row) => (
                  <tr key={row.key} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '6px 8px', color: '#e2e8f0', fontFamily: 'monospace', fontSize: 12 }}>{row.key}</td>
                    <td style={{ padding: '6px 8px', color: '#cbd5e1' }}>{row.purpose}</td>
                    <td style={{ padding: '6px 8px', color: '#94a3b8' }}>{row.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModal(false)}
                style={{ padding: '8px 16px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}
              >
                {t('cookie_close')}
              </button>
              <button
                onClick={accept}
                style={{ padding: '8px 20px', background: '#22c55e', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
              >
                {t('cookie_accept')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 999,
        background: '#0f172a', borderTop: '1px solid #1e293b',
        padding: '14px 20px', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', flexWrap: 'wrap', gap: 10,
      }}>
        <div>
          <strong style={{ color: '#f1f5f9', fontSize: 14 }}>{t('cookie_title')}</strong>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94a3b8' }}>{t('cookie_text')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setModal(true)}
            style={{ padding: '7px 14px', background: 'transparent', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}
          >
            {t('cookie_settings')}
          </button>
          <button
            onClick={accept}
            style={{ padding: '7px 18px', background: '#22c55e', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
          >
            {t('cookie_accept')}
          </button>
        </div>
      </div>
    </>
  )
}
