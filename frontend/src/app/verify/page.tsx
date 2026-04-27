'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useApp } from '@/contexts/AppContext'
import { auth as authApi } from '@/lib/api'
import { dispatchAuthSessionChanged } from '@/lib/authEvents'
import { consumeWhatsNewIntentPath } from '@/lib/whatsNewFunnel'

function VerifyContent() {
  const { t } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  // React StrictMode (dev) runs effects twice. The 2nd call hits a now-used
  // token and returns 400, flipping us to 'error' even though verification
  // actually succeeded. Guard with a ref so we only fire the request once.
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) return
    startedRef.current = true

    if (!token) {
      setStatus('error')
      return
    }

    authApi.verify(token)
      .then((res) => {
        const r = res as { access_token?: string; user_id?: number; name?: string; email?: string }
        if (r.access_token) {
          localStorage.setItem('stock_agent_token', r.access_token)
          localStorage.setItem('stock_agent_user', JSON.stringify({ user_id: r.user_id, name: r.name, email: r.email }))
          dispatchAuthSessionChanged()
        }
        setStatus('success')
        setTimeout(() => router.push(consumeWhatsNewIntentPath()), 1500)
      })
      .catch(() => setStatus('error'))
  }, [token, router])

  return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ textAlign: 'center', maxWidth: 400, width: '100%' }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>⏳</div>
            <p style={{ color: '#94a3b8' }}>{t('auth_verifying')}</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
            <p style={{ color: '#22c55e', fontWeight: 600 }}>{t('auth_verify_success')}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 16 }}>❌</div>
            <p style={{ color: '#ef4444', marginBottom: 20 }}>{t('auth_verify_fail')}</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link href='/register' style={{ padding: '10px 18px', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#94a3b8', textDecoration: 'none', fontSize: 14 }}>
                {t('auth_try_again')}
              </Link>
              <Link href='/login' style={{ padding: '10px 18px', background: '#22c55e', borderRadius: 8, color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
                {t('auth_go_login')}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#94a3b8' }}>Loading…</p>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}
