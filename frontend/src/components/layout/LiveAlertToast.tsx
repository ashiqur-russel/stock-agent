'use client'

import { useEffect } from 'react'
import type { LiveAlert } from '@/hooks/useAlertWS'

interface Props {
  toasts: LiveAlert[]
  onDismiss: (id: string) => void
}

const SEVERITY_COLORS: Record<LiveAlert['severity'], string> = {
  high: '#f59e0b',      // amber
  critical: '#ef4444',  // red
}

export default function LiveAlertToast({ toasts, onDismiss }: Props) {
  useEffect(() => {
    if (toasts.length === 0) return
    const latest = toasts[toasts.length - 1]
    const timer = setTimeout(() => onDismiss(latest.id), 12_000)
    return () => clearTimeout(timer)
  }, [toasts, onDismiss])

  if (toasts.length === 0) return null

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 900, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 360 }}>
      {toasts.map((toast) => {
        const accent = SEVERITY_COLORS[toast.severity] ?? '#f59e0b'
        const heading = toast.title || `${toast.ticker} Alert`
        return (
          <div
            key={toast.id}
            style={{
              background: '#0f172a',
              border: '1px solid #334155',
              borderLeft: `4px solid ${accent}`,
              borderRadius: 8,
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            <span style={{ fontSize: 18 }}>{toast.severity === 'critical' ? '🚨' : '🔔'}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14 }}>{heading}</div>
              {toast.message && (
                <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2, lineHeight: 1.4 }}>
                  {toast.message}
                </div>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              aria-label='Dismiss alert'
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
