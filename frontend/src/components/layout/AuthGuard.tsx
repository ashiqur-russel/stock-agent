'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getToken } from '@/lib/api'
import Sidebar from '@/components/layout/Sidebar'
import LiveAlertToast from '@/components/layout/LiveAlertToast'
import WhatsNewModal from '@/components/release/WhatsNewModal'
import { useAlertWS, type LiveAlert } from '@/hooks/useAlertWS'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checked, setChecked] = useState(false)
  const [toasts, setToasts] = useState<LiveAlert[]>([])
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace('/login')
    } else {
      setChecked(true)
    }
  }, [router])

  const onAlert = useCallback((alert: LiveAlert) => {
    setToasts((prev) => [...prev.slice(-4), alert])
  }, [])

  useAlertWS(onAlert)

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  if (!checked) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Mobile-only top bar with the drawer trigger (hidden ≥768px via CSS) */}
      <header className="sa-mobile-topbar">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open navigation"
          className="sa-focusable"
          style={{
            background: 'transparent',
            border: '1px solid var(--color-border-strong)',
            borderRadius: 8,
            color: 'var(--color-text)',
            fontSize: 18,
            lineHeight: 1,
            padding: '6px 10px',
            cursor: 'pointer',
          }}
        >
          ☰
        </button>
        <img src='/logo.svg' alt='StockAgent' style={{ height: 24 }} />
      </header>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="sa-main">{children}</main>
      <LiveAlertToast toasts={toasts} onDismiss={dismissToast} />
      <WhatsNewModal />
    </div>
  )
}
