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
    <div style={{ display: 'flex', minHeight: '100vh', background: '#020617' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: 220, padding: '32px', minHeight: '100vh', color: '#f1f5f9' }}>
        {children}
      </main>
      <LiveAlertToast toasts={toasts} onDismiss={dismissToast} />
      <WhatsNewModal />
    </div>
  )
}
