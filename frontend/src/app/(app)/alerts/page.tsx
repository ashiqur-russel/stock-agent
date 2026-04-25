'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApp } from '@/contexts/AppContext'
import FormInput from '@/components/ui/FormInput'
import { alerts as alertsApi } from '@/lib/api'

interface Alert {
  id: number
  ticker: string
  condition: 'above' | 'below'
  target_price: number
  is_active: boolean
  triggered_at: string | null
  is_read: boolean
}

interface NotifSettings {
  email_enabled: boolean
}

function AlertsContent() {
  const { t, currencySymbol } = useApp()
  const [alertList, setAlertList] = useState<Alert[]>([])
  const [settings, setSettings] = useState<NotifSettings>({ email_enabled: false })
  const [loading, setLoading] = useState(true)
  const [ticker, setTicker] = useState('')
  const [condition, setCondition] = useState<'above' | 'below'>('above')
  const [targetPrice, setTargetPrice] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [a, s] = await Promise.all([
        alertsApi.list() as Promise<Alert[]>,
        alertsApi.getNotifSettings() as Promise<NotifSettings>,
      ])
      setAlertList(a)
      setSettings(s)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!ticker.trim() || !targetPrice) return
    try {
      await alertsApi.create({ ticker: ticker.trim().toUpperCase(), condition, target_price: parseFloat(targetPrice) })
      setTicker('')
      setTargetPrice('')
      await load()
    } catch {
      // ignore
    }
  }

  const handleDelete = async (id: number) => {
    await alertsApi.delete(id)
    await load()
  }

  const handleMarkAllRead = async () => {
    await alertsApi.markAllRead()
    await load()
  }

  const handleMarkRead = async (id: number) => {
    await alertsApi.markRead(id)
    setAlertList((prev) => prev.map((a) => a.id === id ? { ...a, is_read: true } : a))
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      await alertsApi.saveNotifSettings(settings)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{t('alert_title')}</h1>
        {alertList.some((a) => !a.is_read) && (
          <button onClick={handleMarkAllRead} style={{ padding: '6px 14px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>
            {t('alert_mark_read')}
          </button>
        )}
      </div>

      {/* Add alert form */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24, marginBottom: 28 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#94a3b8' }}>{t('alert_add')}</h2>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <FormInput label={t('alert_ticker')} value={ticker} onChange={(e) => setTicker(e.target.value.toUpperCase())} placeholder='AAPL' style={{ maxWidth: 120 }} />
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 4 }}>{t('alert_condition')}</label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
              style={{ padding: '10px 12px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9', fontSize: 14 }}
            >
              <option value='above'>{t('alert_above')}</option>
              <option value='below'>{t('alert_below')}</option>
            </select>
          </div>
          <FormInput label={`${t('alert_price')} (${currencySymbol})`} type='number' min='0' step='any' value={targetPrice} onChange={(e) => setTargetPrice(e.target.value)} placeholder='200.00' style={{ maxWidth: 160 }} />
          <button onClick={handleAdd} style={{ padding: '10px 20px', background: '#22c55e', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            {t('alert_add')}
          </button>
        </div>
      </div>

      {/* Alert list */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24, marginBottom: 28 }}>
        {loading && <p style={{ color: '#64748b' }}>{t('common_loading')}</p>}
        {!loading && alertList.length === 0 && <p style={{ color: '#64748b', fontSize: 14 }}>{t('alert_none')}</p>}
        {!loading && alertList.map((alert) => (
          <div
            key={alert.id}
            onClick={() => !alert.is_read && handleMarkRead(alert.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
              borderBottom: '1px solid #1e293b', cursor: alert.is_read ? 'default' : 'pointer',
              opacity: alert.is_read ? 0.7 : 1,
            }}
          >
            {!alert.is_read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0, display: 'inline-block' }} />}
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, color: '#f1f5f9', marginRight: 8 }}>{alert.ticker}</span>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>
                {alert.condition === 'above' ? t('alert_above') : t('alert_below')} {currencySymbol}{alert.target_price.toFixed(2)}
              </span>
            </div>
            <span style={{
              fontSize: 12, padding: '2px 8px', borderRadius: 6, fontWeight: 600,
              background: alert.triggered_at ? '#1c1a00' : '#052e16',
              color: alert.triggered_at ? '#eab308' : '#22c55e',
            }}>
              {alert.triggered_at ? t('alert_triggered') : t('alert_active')}
            </span>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(alert.id) }} style={{ background: 'none', border: '1px solid #334155', borderRadius: 6, color: '#ef4444', cursor: 'pointer', fontSize: 12, padding: '3px 10px' }}>
              {t('common_delete')}
            </button>
          </div>
        ))}
      </div>

      {/* Notification settings */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600, color: '#94a3b8' }}>{t('alert_notif')}</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 14, color: '#f1f5f9' }}>
          <input type='checkbox' checked={settings.email_enabled} onChange={(e) => setSettings({ ...settings, email_enabled: e.target.checked })} style={{ width: 16, height: 16, accentColor: '#22c55e' }} />
          {t('alert_email')}
        </label>
        <button onClick={handleSaveSettings} disabled={saving} style={{ marginTop: 14, padding: '8px 20px', background: '#22c55e', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
          {saving ? '…' : t('alert_save')}
        </button>
      </div>
    </div>
  )
}

export default function AlertsPage() {
  return <AlertsContent />
}
