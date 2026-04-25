'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { auth } from '@/lib/api'

interface StoredUser {
  user_id: number
  name: string
  email: string
}

export function getStoredUser(): StoredUser | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('stock_agent_user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredUser
  } catch {
    return null
  }
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('stock_agent_token')
}

export function useAuth() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveSession = (token: string, user: StoredUser) => {
    localStorage.setItem('stock_agent_token', token)
    localStorage.setItem('stock_agent_user', JSON.stringify(user))
  }

  const login = async (email: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await auth.login(email, password)
      saveSession(res.access_token, { user_id: res.user_id, name: res.name, email: res.email })
      router.push('/dashboard')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const register = async (
    email: string,
    name: string,
    password: string
  ): Promise<{ pending?: boolean; token?: string; user?: StoredUser }> => {
    setLoading(true)
    setError(null)
    try {
      const res = await auth.register(email, name, password) as Record<string, unknown>
      if (res.access_token) {
        const user: StoredUser = {
          user_id: res.user_id as number,
          name: res.name as string,
          email: res.email as string,
        }
        saveSession(res.access_token as string, user)
        return { token: res.access_token as string, user }
      }
      return { pending: true }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Registration failed')
      return {}
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('stock_agent_token')
    localStorage.removeItem('stock_agent_user')
    router.push('/login')
  }

  return { login, register, logout, loading, error, setError }
}
