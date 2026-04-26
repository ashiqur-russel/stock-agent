'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApp } from '@/contexts/AppContext'
import { useAuth } from '@/hooks/useAuth'
import FormInput from '@/components/ui/FormInput'
import { auth as authApi } from '@/lib/api'

export default function RegisterPage() {
  const { t } = useApp()
  const router = useRouter()
  const { register, loading, error, setError } = useAuth()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)
  const [resent, setResent] = useState(false)
  const [resendBusy, setResendBusy] = useState(false)

  const handleSubmit = async () => {
    if (loading) return
    const result = await register(email, name, password)
    if (result.pending) {
      setPending(true)
    } else if (result.token) {
      router.push('/dashboard')
    }
  }

  const handleResend = async () => {
    if (resent || resendBusy || !email.trim()) return
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

  if (pending) {
    return (
      <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
          <h2 style={{ color: '#f1f5f9', marginBottom: 10 }}>{t('auth_check_email')}</h2>
          <p style={{ color: '#94a3b8', marginBottom: 24, lineHeight: 1.6 }}>{t('auth_verify_note')}</p>
          <button
            type='button'
            onClick={handleResend}
            disabled={resent || resendBusy}
            style={{ background: 'none', border: '1px solid #334155', borderRadius: 8, color: resent ? '#22c55e' : '#94a3b8', padding: '10px 20px', cursor: resent || resendBusy ? 'default' : 'pointer', fontSize: 14, opacity: resent || resendBusy ? 0.85 : 1 }}
          >
            {resent ? t('auth_sent_again') : resendBusy ? t('common_loading') : t('auth_resend_link')}
          </button>
          <div style={{ marginTop: 20 }}>
            <Link href='/login' style={{ color: '#64748b', fontSize: 13, textDecoration: 'none' }}>{t('auth_go_login')}</Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#020617', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href='/' style={{ fontSize: 22, fontWeight: 700, color: '#22c55e', textDecoration: 'none' }}>📈 StockAgent</Link>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: '16px 0 6px', color: '#f1f5f9' }}>{t('auth_register')}</h1>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <FormInput
            label={t('auth_name')}
            type='text'
            value={name}
            onChange={(e) => { setName(e.target.value); setError(null) }}
            placeholder='Jane Doe'
            autoComplete='name'
          />
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
            autoComplete='new-password'
          />

          {error && (
            <div style={{ color: '#ef4444', fontSize: 13, background: '#2d0a0a', border: '1px solid #7f1d1d', borderRadius: 8, padding: '10px 12px' }}>
              {error}
            </div>
          )}

          <button
            type='button'
            onClick={handleSubmit}
            disabled={loading}
            style={{ padding: '12px', background: '#22c55e', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 15, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? '…' : t('auth_register_btn')}
          </button>

          <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b', margin: 0 }}>
            {t('auth_have_account')}{' '}
            <Link href='/login' style={{ color: '#22c55e', textDecoration: 'none', fontWeight: 600 }}>{t('auth_login')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
