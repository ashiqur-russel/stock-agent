'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getToken } from '@/hooks/useAuth'
import { AUTH_SESSION_EVENT } from '@/lib/authEvents'

const AUTH_ONLY_PATHS = ['/login', '/register']

function isAuthOnlyPath(pathname: string) {
  return AUTH_ONLY_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
}

export default function AuthDashboardBridge() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggedIn, setLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const read = () => setLoggedIn(!!getToken())
    read()
    window.addEventListener(AUTH_SESSION_EVENT, read)
    return () => window.removeEventListener(AUTH_SESSION_EVENT, read)
  }, [])

  useEffect(() => {
    if (mounted && loggedIn && isAuthOnlyPath(pathname)) {
      router.replace('/user/dashboard')
    }
  }, [loggedIn, pathname, mounted, router])

  return null
}
