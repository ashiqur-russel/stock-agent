'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import FormInput from '@/components/ui/FormInput'
import { auth as authApi } from '@/lib/api'

function ResetContent() {
  const { t } = useApp()
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    if (submitting || !token || password.length < 8) return
    setSubmitting(true)
    setError(null)
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('common_error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <p style={{ color: '#ef4444', marginBottom: 16 }}>{t('auth_reset_no_token')}</p>
        <Link href='/forgot-password' style={{ color: '#22c55e' }}>{t('auth_forgot_title')}</Link>
      </div>
    )
  }

  if (done) {
    return (
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✅</div>
        <p style={{ color: '#22c55e', fontWeight: 600 }}>{t('auth_reset_success')}</p>
        <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 8 }}>{t('auth_reset_redirect')}</p>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', maxWidth: 400 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Link href='/' style={{ fontSize: 22, fontWeight: 700, color: '#22c55e', textDecoration: 'none' }}>📈 StockAgent</Link>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '16px 0 6px', color: '#f1f5f9' }}>{t('auth_reset_title')}</h1>
      </div>

      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormInput
          label={t('auth_reset_new_password')}
          type='password'
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(null) }}
          placeholder='••••••••'
          autoComplete='new-password'
        />
        <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>{t('auth_reset_min_len')}</p>

        {error && (
          <div style={{ color: '#ef4444', fontSize: 13, background: '#2d0a0a', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 12px' }}>
            {error}
          </div>
        )}

        <button
          type='button'
          onClick={handleSubmit}
          disabled={submitting || password.length < 8}
          style={{ padding: '12px', background: '#22c55e', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer', opacity: submitting || password.length < 8 ? 0.6 : 1 }}
        >
          {submitting ? t('common_loading') : t('auth_reset_submit')}
        </button>

        <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b', margin: 0 }}>
          <Link href='/login' style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}>{t('auth_back_login')}</Link>
        </p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <Suspense fallback={<p style={{ color: '#94a3b8' }}>Loading…</p>}>
        <ResetContent />
      </Suspense>
    </div>
  )
}
