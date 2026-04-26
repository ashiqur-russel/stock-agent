'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/contexts/AppContext'
import {
  alerts as alertsApi,
  settings as settingsApi,
  chat as chatApi,
  type GroqQuotaSnapshot,
} from '@/lib/api'
import { getStoredUser } from '@/hooks/useAuth'
import FormInput from '@/components/ui/FormInput'
import Switch from '@/components/ui/Switch'

interface NotifSettings {
  notify_email: string | null
  email_alerts: boolean
}

function formatEta(sec: number): string {
  if (sec < 60) return `${sec}s`
  const m = Math.floor(sec / 60)
  const s = sec % 60
  if (m < 60) return `${m}m ${s.toString().padStart(2, '0')}s`
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${h}h ${mm}m`
}

export default function SettingsPage() {
  const { t } = useApp()
  const [recipient, setRecipient] = useState('')
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [aiChatEnabled, setAiChatEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [quota, setQuota] = useState<GroqQuotaSnapshot | null>(null)
  const [quotaFetchedAt, setQuotaFetchedAt] = useState<number | null>(null)
  const [quotaLoadFailed, setQuotaLoadFailed] = useState(false)
  const [, setTick] = useState(0)

  const loadQuota = useCallback(async () => {
    try {
      const q = await chatApi.getQuota()
      setQuota(q)
      setQuotaFetchedAt(Date.now())
      setQuotaLoadFailed(false)
    } catch {
      setQuotaLoadFailed(true)
    }
  }, [])

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

  useEffect(() => {
    loadQuota()
    const id = window.setInterval(loadQuota, 60_000)
    return () => window.clearInterval(id)
  }, [loadQuota])

  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 1000)
    return () => window.clearInterval(id)
  }, [])

  const liveEtaSec =
    quota?.seconds_until_capacity != null && quotaFetchedAt != null
      ? Math.max(
          0,
          quota.seconds_until_capacity - Math.floor((Date.now() - quotaFetchedAt) / 1000),
        )
      : null

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
    loadQuota()
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
                  paddingBottom: 4,
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
            <div
              style={{
                marginTop: 8,
                paddingTop: 22,
                borderTop: '1px solid #1e293b',
                display: 'flex',
                flexWrap: 'wrap',
                gap: 12,
                alignItems: 'center',
                justifyContent: 'flex-end',
              }}
            >
              {savedAt && Date.now() - savedAt < 4000 && (
                <span style={{ color: '#22c55e', fontSize: 13, marginRight: 'auto' }}>✓</span>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  padding: '10px 22px',
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
            </div>
          </>
        )}
      </div>

      {!loading && (
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: 12,
            padding: 24,
            marginBottom: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
              flexWrap: 'wrap',
              marginBottom: 14,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                color: '#94a3b8',
              }}
            >
              {t('settings_quota_heading')}
            </h2>
            <button
              type="button"
              onClick={() => loadQuota()}
              style={{
                padding: '6px 12px',
                background: '#1e293b',
                border: '1px solid #334155',
                borderRadius: 8,
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              {t('settings_quota_refresh')}
            </button>
          </div>

          {quotaLoadFailed && (
            <p style={{ color: '#f87171', fontSize: 13 }}>{t('settings_quota_load_failed')}</p>
          )}

          {!quotaLoadFailed && quota && !quota.quota_enabled && (
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>{t('settings_quota_off')}</p>
          )}

          {!quotaLoadFailed && quota && quota.quota_enabled && !quota.ai_chat_enabled && (
            <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>{t('settings_quota_ai_off')}</p>
          )}

          {!quotaLoadFailed && quota && quota.quota_enabled && quota.ai_chat_enabled && quota.shares && quota.used && (
            <>
              <p
                style={{
                  margin: '0 0 8px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: quota.can_use ? '#22c55e' : '#fbbf24',
                }}
              >
                {quota.can_use ? t('settings_quota_status_ok') : t('settings_quota_status_wait')}
              </p>
              {quota.block_reason && (
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#fcd34d', lineHeight: 1.5 }}>
                  {quota.block_reason}
                </p>
              )}
              {quota.next_capacity_utc && liveEtaSec !== null && liveEtaSec > 0 && (
                <p style={{ margin: '0 0 12px', fontSize: 12, color: '#94a3b8' }}>
                  {t('settings_quota_try_after')}: ~{formatEta(liveEtaSec)} ({t('settings_quota_refresh')}{' '}
                  for exact time)
                </p>
              )}
              {quota.utc_day_resets_at && (
                <p style={{ margin: '0 0 14px', fontSize: 12, color: '#64748b' }}>
                  {t('settings_quota_utc_midnight')}:{' '}
                  <time dateTime={quota.utc_day_resets_at}>
                    {new Date(quota.utc_day_resets_at).toUTCString()}
                  </time>
                </p>
              )}
              <p style={{ margin: '0 0 10px', fontSize: 12, color: '#64748b' }}>
                {t('settings_quota_pool')}: <strong style={{ color: '#94a3b8' }}>{quota.users_sharing_pool}</strong>{' '}
                · {t('settings_quota_bucket')}: <code style={{ color: '#67e8f9' }}>{quota.bucket}</code>
              </p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #334155', color: '#64748b', textAlign: 'left' }}>
                      <th style={{ padding: '8px 6px' }}>{''}</th>
                      <th style={{ padding: '8px 6px' }}>{t('settings_quota_calls')}</th>
                      <th style={{ padding: '8px 6px' }}>{t('settings_quota_tokens')}</th>
                    </tr>
                  </thead>
                  <tbody style={{ color: '#e2e8f0' }}>
                    <tr style={{ borderBottom: '1px solid #1e293b' }}>
                      <td style={{ padding: '8px 6px', color: '#94a3b8' }}>{t('settings_quota_minute')}</td>
                      <td style={{ padding: '8px 6px' }}>
                        {quota.used.minute.groq_calls} / {quota.shares.rpm}
                      </td>
                      <td style={{ padding: '8px 6px' }}>
                        {quota.used.minute.tokens.toLocaleString()} / {quota.shares.tpm.toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ padding: '8px 6px', color: '#94a3b8' }}>
                        {t('settings_quota_period')} ({quota.period_label})
                      </td>
                      <td style={{ padding: '8px 6px' }}>
                        {quota.used.period.groq_calls} / {quota.shares.period_calls_cap}
                      </td>
                      <td style={{ padding: '8px 6px' }}>
                        {quota.used.period.tokens.toLocaleString()} /{' '}
                        {quota.shares.period_tokens_cap.toLocaleString()}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p style={{ margin: '14px 0 0', fontSize: 11, color: '#64748b', lineHeight: 1.55 }}>
                {quota.info}
              </p>
            </>
          )}
        </div>
      )}

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
