'use client'

import { useEffect, useState } from 'react'
import { getToken, getStoredUser } from '@/hooks/useAuth'
import { AUTH_SESSION_EVENT, dispatchAuthSessionChanged } from '@/lib/authEvents'

export function usePublicAuth() {
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const read = () => {
      setUser(getToken() ? (getStoredUser() ?? {}) : null)
    }
    read()
    window.addEventListener(AUTH_SESSION_EVENT, read)
    return () => window.removeEventListener(AUTH_SESSION_EVENT, read)
  }, [])

  const logout = () => {
    localStorage.removeItem('stock_agent_token')
    localStorage.removeItem('stock_agent_user')
    dispatchAuthSessionChanged()
    window.location.href = '/'
  }

  return { user, logout, mounted }
}
