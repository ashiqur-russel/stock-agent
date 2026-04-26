'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getToken, getStoredUser } from '@/hooks/useAuth'
import { AUTH_SESSION_EVENT } from '@/lib/authEvents'

const PUBLIC_PATHS = ['/', '/docs', '/login', '/register', '/verify', '/forgot-password', '/reset-password']
const AUTH_ONLY_PATHS = ['/login', '/register']

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

function isAuthOnlyPath(pathname: string) {
  return AUTH_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export default function AuthDashboardBridge() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  const refresh = () => {
    const token = getToken()
    if (token) {
      const stored = getStoredUser()
      setUser(stored ?? {})
    } else {
      setUser(null)
    }
  }

  useEffect(() => {
    setMounted(true)
    refresh()
    window.addEventListener(AUTH_SESSION_EVENT, refresh)
    return () => window.removeEventListener(AUTH_SESSION_EVENT, refresh)
  }, [])

  useEffect(() => {
    if (!mounted) return
    // Auto-redirect login/register → dashboard when already signed in
    if (user && isAuthOnlyPath(pathname)) {
      router.replace('/user/dashboard')
    }
  }, [user, pathname, mounted, router])

  if (!mounted || !user || !isPublicPath(pathname) || isAuthOnlyPath(pathname)) return null

  const label = user.name ?? user.email ?? 'Account'

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: '#0d1f17', borderBottom: '1px solid #166534',
      padding: '8px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      fontSize: 13,
    }}>
      <span style={{ color: '#4ade80' }}>
        Signed in as <strong style={{ color: '#22c55e' }}>{label}</strong>
      </span>
      <Link
        href='/user/dashboard'
        style={{
          padding: '5px 14px', background: '#22c55e', border: 'none',
          borderRadius: 6, color: '#000', fontWeight: 700,
          textDecoration: 'none', fontSize: 13,
        }}
      >
        Go to Dashboard →
      </Link>
    </div>
  )
}
