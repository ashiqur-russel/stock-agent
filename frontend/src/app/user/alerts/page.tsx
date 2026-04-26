'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/contexts/AppContext'
import { alerts as alertsApi } from '@/lib/api'
import SignalBadge from '@/components/ui/SignalBadge'
import type { SwingSignal } from '@/hooks/usePortfolio'
import { usePushNotifications } from '@/hooks/usePushNotifications'

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

const VALID_SIGNALS: ReadonlySet<SwingSignal> = new Set<SwingSignal>([
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
  const push = usePushNotifications()

  const [alertList, setAlertList] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const a = (await alertsApi.list()) as Alert[]
      setAlertList(a)
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

      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 12,
          padding: '14px 18px',
          marginBottom: 24,
          fontSize: 13,
          color: '#94a3b8',
          lineHeight: 1.5,
        }}
      >
        {t('alerts_prefs_banner')}{' '}
        <Link href='/user/settings' className='text-brand no-underline hover:underline font-semibold'>
          {t('nav_settings')}
        </Link>
        .
      </div>

      {/* Browser push notifications */}
      <div
        style={{
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 12,
          padding: 24,
          marginBottom: 28,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#94a3b8' }}>
              🔔 Push Notifications
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#475569' }}>
              Get instant browser alerts when RSI/MACD signals change on your holdings
            </p>
          </div>
          {push.subscribed && (
            <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: '#052e16', color: '#22c55e', border: '1px solid #166534', fontWeight: 600 }}>
              ACTIVE
            </span>
          )}
        </div>

        {!push.supported && (
          <p style={{ fontSize: 13, color: '#64748b' }}>
            Push notifications are not supported in this browser.
          </p>
        )}

        {push.supported && !push.serverEnabled && (
          <div style={{ fontSize: 13, color: '#f59e0b', background: '#1c1100', border: '1px solid #78350f', borderRadius: 8, padding: '10px 14px' }}>
            Push not configured on the server. Run <code style={{ fontSize: 12 }}>python tools/generate_vapid_keys.py</code> and add VAPID keys to <code style={{ fontSize: 12 }}>.env</code>.
          </div>
        )}

        {push.supported && push.serverEnabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
            {push.permission === 'denied' ? (
              <p style={{ fontSize: 13, color: '#ef4444', margin: 0 }}>
                Notifications are blocked in your browser settings. Allow them for this site and reload.
              </p>
            ) : (
              <>
                <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, flex: 1 }}>
                  {push.subscribed
                    ? 'Your browser will receive a push notification whenever a swing signal changes — even if the app is closed.'
                    : 'Enable push to get instant signal alerts (strong buy, strong sell) delivered directly to your browser.'}
                </p>
                <button
                  onClick={push.subscribed ? push.unsubscribe : push.subscribe}
                  disabled={push.loading}
                  style={{
                    padding: '9px 20px',
                    background: push.subscribed ? '#1e293b' : '#22c55e',
                    border: push.subscribed ? '1px solid #334155' : 'none',
                    borderRadius: 8,
                    color: push.subscribed ? '#94a3b8' : '#fff',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: push.loading ? 'wait' : 'pointer',
                    opacity: push.loading ? 0.6 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {push.loading ? '…' : push.subscribed ? 'Disable push' : 'Enable push'}
                </button>
              </>
            )}
          </div>
        )}
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
