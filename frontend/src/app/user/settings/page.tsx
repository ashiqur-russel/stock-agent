'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/contexts/AppContext'
import { alerts as alertsApi, settings as settingsApi } from '@/lib/api'
import { getStoredUser } from '@/hooks/useAuth'
import FormInput from '@/components/ui/FormInput'
import Switch from '@/components/ui/Switch'

interface NotifSettings {
  notify_email: string | null
  email_alerts: boolean
}

export default function SettingsPage() {
  const { t } = useApp()
  const [recipient, setRecipient] = useState('')
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [aiChatEnabled, setAiChatEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, pref] = await Promise.all([
        alertsApi.getNotifSettings() as Promise<NotifSettings>,
        settingsApi.getPreferences(),
      ])
      setRecipient(s.notify_email ?? getStoredUser()?.email ?? '')
      setEmailEnabled(s.email_alerts)
      setAiChatEnabled(pref.ai_chat_enabled !== false)
    } catch {
      /* auth layout handles 401 */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    setSaving(true)
    setSavedAt(null)
    try {
      await Promise.all([
        alertsApi.saveNotifSettings({
          notify_email: recipient.trim() || null,
          email_alerts: emailEnabled,
        }),
        settingsApi.putPreferences({ ai_chat_enabled: aiChatEnabled }),
      ])
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 700 }}>{t('settings_title')}</h1>
      <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 13 }}>{t('settings_subtitle')}</p>

      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 12,
          padding: 24,
          marginBottom: 20,
        }}
      >
        <h2
          style={{
            margin: '0 0 16px',
            fontSize: 15,
            fontWeight: 600,
            color: '#94a3b8',
          }}
        >
          {t('alert_notif')}
        </h2>
        {loading ? (
          <p style={{ color: '#64748b' }}>{t('common_loading')}</p>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <FormInput
                label={t('alert_recipient')}
                type="email"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder={getStoredUser()?.email ?? 'you@example.com'}
              />
              <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 12 }}>
                {t('alert_recipient_help')}
              </p>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                flexWrap: 'wrap',
                padding: '14px 0',
                borderTop: '1px solid #1e293b',
                borderBottom: '1px solid #1e293b',
              }}
            >
              <span style={{ fontSize: 14, color: '#f1f5f9', flex: '1 1 200px' }}>
                {t('alert_email_toggle')}
              </span>
              <Switch
                checked={emailEnabled}
                onChange={setEmailEnabled}
                aria-label={t('alert_email_toggle')}
              />
            </div>
            <div style={{ marginTop: 24 }}>
              <h3
                style={{
                  margin: '0 0 8px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#94a3b8',
                }}
              >
                {t('alert_ai_section')}
              </h3>
              <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: 12, maxWidth: 560 }}>
                {t('alert_ai_help')}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                <span style={{ fontSize: 14, color: '#f1f5f9', flex: '1 1 200px' }}>
                  {t('alert_ai_enable')}
                </span>
                <Switch
                  checked={aiChatEnabled}
                  onChange={setAiChatEnabled}
                  aria-label={t('alert_ai_enable')}
                />
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', marginTop: 24 }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  background: '#22c55e',
                  border: 'none',
                  borderRadius: 8,
                  color: '#fff',
                  fontWeight: 600,
                  cursor: saving ? 'wait' : 'pointer',
                  fontSize: 14,
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? '…' : t('alert_save')}
              </button>
              {savedAt && Date.now() - savedAt < 4000 && (
                <span style={{ color: '#22c55e', fontSize: 12 }}>✓</span>
              )}
            </div>
          </>
        )}
      </div>

      <p style={{ margin: 0, fontSize: 13, color: '#64748b', lineHeight: 1.55 }}>
        <Link href='/user/alerts' className='text-brand no-underline hover:underline font-medium'>
          {t('nav_alerts')}
        </Link>
        {' — '}
        {t('settings_alerts_footer')}
      </p>
    </div>
  )
}
