'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/contexts/AppContext'
import FormInput from '@/components/ui/FormInput'
import { auth as authApi } from '@/lib/api'

export default function ForgotPasswordPage() {
  const { t } = useApp()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (submitting || !email.trim()) return
    setSubmitting(true)
    setError(null)
    try {
      await authApi.forgotPassword(email.trim())
      setDone(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('common_error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <h2 style={{ color: '#f1f5f9', marginBottom: 10 }}>{t('auth_forgot_sent_title')}</h2>
          <p style={{ color: '#94a3b8', marginBottom: 24, lineHeight: 1.6 }}>{t('auth_forgot_sent_body')}</p>
          <Link href='/login' style={{ color: '#22c55e', fontWeight: 600, textDecoration: 'none' }}>{t('auth_back_login')}</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href='/' style={{ fontSize: 22, fontWeight: 700, color: '#22c55e', textDecoration: 'none' }}>📈 StockAgent</Link>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '16px 0 6px', color: '#f1f5f9' }}>{t('auth_forgot_title')}</h1>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormInput
            label={t('auth_email')}
            type='email'
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null) }}
            placeholder='you@example.com'
            autoComplete='email'
          />

          {error && (
            <div style={{ color: '#ef4444', fontSize: 13, background: '#2d0a0a', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 12px' }}>
              {error}
            </div>
          )}

          <button
            type='button'
            onClick={handleSubmit}
            disabled={submitting || !email.trim()}
            style={{ padding: '12px', background: '#22c55e', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer', opacity: submitting || !email.trim() ? 0.6 : 1 }}
          >
            {submitting ? t('common_loading') : t('auth_forgot_submit')}
          </button>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b', margin: 0 }}>
            <Link href='/login' style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}>{t('auth_back_login')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
