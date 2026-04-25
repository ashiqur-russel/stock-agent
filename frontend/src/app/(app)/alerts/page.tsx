'use client'

import { useCallback, useEffect, useState } from 'react'
import { useApp } from '@/contexts/AppContext'
import { alerts as alertsApi } from '@/lib/api'
import { getStoredUser } from '@/hooks/useAuth'
import SignalBadge from '@/components/ui/SignalBadge'
import FormInput from '@/components/ui/FormInput'
import type { SwingSignal } from '@/hooks/usePortfolio'

interface Alert {
  id: number
  ticker: string
  old_signal: string | null
  new_signal: string
  message: string
  price_eur: number | null
  is_read: 0 | 1
  created_at: string
}

interface NotifSettings {
  notify_email: string | null
  email_alerts: boolean
}

const VALID_SIGNALS: ReadonlySet<SwingSignal> = new Set([
  'strong_buy',
  'potential_buy',
  'hold',
  'potential_sell',
  'strong_sell',
])

function asSignal(s: string | null): SwingSignal | null {
  if (!s) return null
  const v = s.toLowerCase()
  return VALID_SIGNALS.has(v as SwingSignal) ? (v as SwingSignal) : null
}

function relativeTime(iso: string): string {
  const then = new Date(iso.endsWith('Z') ? iso : iso + 'Z').getTime()
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000))
  if (diffSec < 60) return `${diffSec}s ago`
  const m = Math.floor(diffSec / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export default function AlertsPage() {
  const { t, formatPrice } = useApp()

  const [alertList, setAlertList] = useState<Alert[]>([])
  const [settings, setSettings] = useState<NotifSettings>({
    notify_email: null,
    email_alerts: true,
  })
  const [recipient, setRecipient] = useState('')
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [a, s] = await Promise.all([
        alertsApi.list() as Promise<Alert[]>,
        alertsApi.getNotifSettings() as Promise<NotifSettings>,
      ])
      setAlertList(a)
      setSettings(s)
      setRecipient(s.notify_email ?? getStoredUser()?.email ?? '')
      setEmailEnabled(s.email_alerts)
    } catch {
      // ignore — auth wrapper will bounce on 401
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleMarkAllRead = async () => {
    try {
      await alertsApi.markAllRead()
      setAlertList((prev) => prev.map((a) => ({ ...a, is_read: 1 })))
    } catch {
      /* noop */
    }
  }

  const handleMarkRead = async (id: number) => {
    try {
      await alertsApi.markRead(id)
      setAlertList((prev) => prev.map((a) => (a.id === id ? { ...a, is_read: 1 } : a)))
    } catch {
      /* noop */
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    setSavedAt(null)
    try {
      const body = {
        notify_email: recipient.trim() || null,
        email_alerts: emailEnabled,
      }
      await alertsApi.saveNotifSettings(body)
      setSettings(body)
      setSavedAt(Date.now())
    } finally {
      setSaving(false)
    }
  }

  const hasUnread = alertList.some((a) => !a.is_read)

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8,
          gap: 12,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t('alert_title')}</h1>
        {hasUnread && (
          <button
            onClick={handleMarkAllRead}
            style={{
              padding: '6px 14px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 8,
              color: '#94a3b8',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {t('alert_mark_read')}
          </button>
        )}
      </div>
      <p style={{ margin: '0 0 24px', color: '#64748b', fontSize: 13 }}>{t('alert_subtitle')}</p>

      {/* Notification settings */}
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 12,
          padding: 24,
          marginBottom: 28,
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 280px', minWidth: 240 }}>
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
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              fontSize: 14,
              color: '#f1f5f9',
              padding: '10px 0',
            }}
          >
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              style={{ width: 16, height: 16, accentColor: '#22c55e' }}
            />
            {t('alert_email_toggle')}
          </label>
          <button
            onClick={handleSaveSettings}
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
      </div>

      {/* Alert history */}
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 12,
          padding: 24,
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
          {t('alert_history')}
        </h2>

        {loading && <p style={{ color: '#64748b' }}>{t('common_loading')}</p>}

        {!loading && alertList.length === 0 && (
          <p style={{ color: '#64748b', fontSize: 14 }}>{t('alert_none')}</p>
        )}

        {!loading &&
          alertList.map((alert) => {
            const oldSig = asSignal(alert.old_signal)
            const newSig = asSignal(alert.new_signal)
            const unread = !alert.is_read
            return (
              <div
                key={alert.id}
                onClick={() => unread && handleMarkRead(alert.id)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '14px 0',
                  borderBottom: '1px solid #1e293b',
                  cursor: unread ? 'pointer' : 'default',
                  opacity: unread ? 1 : 0.7,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    marginTop: 8,
                    borderRadius: '50%',
                    background: unread ? '#f59e0b' : 'transparent',
                    flexShrink: 0,
                    display: 'inline-block',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      flexWrap: 'wrap',
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>
                      {alert.ticker}
                    </span>
                    {oldSig && <SignalBadge signal={oldSig} />}
                    {oldSig && newSig && (
                      <span style={{ color: '#475569', fontSize: 13 }}>→</span>
                    )}
                    {newSig && <SignalBadge signal={newSig} />}
                    {alert.price_eur != null && (
                      <span style={{ color: '#94a3b8', fontSize: 13 }}>
                        @ {formatPrice(alert.price_eur)}
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.5 }}>
                    {alert.message}
                  </div>
                </div>
                <span
                  style={{
                    color: '#64748b',
                    fontSize: 12,
                    whiteSpace: 'nowrap',
                    marginLeft: 8,
                  }}
                >
                  {relativeTime(alert.created_at)}
                </span>
              </div>
            )
          })}
      </div>
    </div>
  )
}
