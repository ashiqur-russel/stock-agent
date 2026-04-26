'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/hooks/useAuth'
import FormInput from '@/components/ui/FormInput'
import { auth as authApi } from '@/lib/api'

export default function LoginPage() {
  const { t } = useApp()
  const { login, loading, error, setError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [resent, setResent] = useState(false)

  const needsVerification = error?.toLowerCase().includes('verify')

  const [resendBusy, setResendBusy] = useState(false)

  const handleResend = async () => {
    if (resendBusy || resent || !email.trim()) return
    setResendBusy(true)
    try {
      await authApi.resendVerification(email)
      setResent(true)
    } catch {
      // ignore
    } finally {
      setResendBusy(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href='/' style={{ fontSize: 22, fontWeight: 700, color: '#22c55e', textDecoration: 'none' }}>📈 StockAgent</Link>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '16px 0 6px', color: '#f1f5f9' }}>{t('auth_login')}</h1>
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
          <FormInput
            label={t('auth_password')}
            type='password'
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null) }}
            placeholder='••••••••'
            autoComplete='current-password'
          />

          {error && (
            <div style={{ color: '#ef4444', fontSize: 13, background: '#2d0a0a', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 12px' }}>
              {error}
              {needsVerification && (
                <div style={{ marginTop: 8 }}>
                  <button
                    type='button'
                    onClick={handleResend}
                    disabled={resent || resendBusy}
                    style={{ background: 'none', border: 'none', color: resent ? '#22c55e' : '#f59e0b', cursor: resent || resendBusy ? 'default' : 'pointer', fontSize: 13, padding: 0, textDecoration: 'underline', opacity: resent || resendBusy ? 0.85 : 1 }}
                  >
                    {resent ? t('auth_resent') : resendBusy ? t('common_loading') : t('auth_resend_link')}
                  </button>
                </div>
              )}
            </div>
          )}

          <button
            type='button'
            onClick={() => login(email, password)}
            disabled={loading}
            style={{ padding: '12px', background: '#22c55e', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 15, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '…' : t('auth_login_btn')}
          </button>

          <p style={{ textAlign: 'center', fontSize: 14, margin: 0 }}>
            <Link href='/forgot-password' style={{ color: '#94a3b8', textDecoration: 'none' }}>{t('auth_forgot_password')}</Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b', margin: 0 }}>
            {t('auth_no_account')}{' '}
            <Link href='/register' style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}>{t('auth_register')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
