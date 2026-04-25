'use client'

import { useEffect } from 'react'
import type { LiveAlert } from '@/hooks/useAlertWS'

interface Props {
  toasts: LiveAlert[]
  onDismiss: (id: string) => void
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
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 900, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 340 }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderLeft: '4px solid #f59e0b',
            borderRadius: 8,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        >
          <span style={{ fontSize: 18 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14 }}>
              {toast.ticker} Alert
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 2 }}>{toast.message}</div>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16, padding: 0, lineHeight: 1 }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
