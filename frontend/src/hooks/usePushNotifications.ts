'use client'

import { useCallback, useEffect, useState } from 'react'
import { getToken } from '@/hooks/useAuth'
import { AUTH_SESSION_EVENT } from '@/lib/authEvents'
import { push as pushApi } from '@/lib/api'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  const array = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) {
    array[i] = raw.charCodeAt(i)
  }
  return array
}

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

export interface UsePushNotifications {
  supported: boolean
  serverEnabled: boolean
  permission: PushPermission
  subscribed: boolean
  loading: boolean
  subscribe: () => Promise<void>
  unsubscribe: () => Promise<void>
}

export function usePushNotifications(): UsePushNotifications {
  const [supported, setSupported] = useState(false)
  const [serverEnabled, setServerEnabled] = useState(false)
  const [permission, setPermission] = useState<PushPermission>('unsupported')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [vapidKey, setVapidKey] = useState<string | null>(null)

  useEffect(() => {
    const ok =
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window

    setSupported(ok)

    if (!ok) {
      setLoading(false)
      return
    }

    setPermission(Notification.permission as PushPermission)

    /**
     * Subscribed = this logged-in user has a row in push_subscriptions (server),
     * not merely whether the browser has a PushSubscription (same profile can
     * reuse a subscription after switching accounts).
     */
    const refresh = async () => {
      let sub: PushSubscription | null = null
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        sub = await reg.pushManager.getSubscription()
      } catch {
        // SW registration failed (e.g. HTTP in production, file not found)
      }

      let vkey: string | null = null
      try {
        const { public_key } = await pushApi.getVapidKey()
        vkey = public_key
        setVapidKey(public_key)
        setServerEnabled(true)
      } catch {
        setVapidKey(null)
        setServerEnabled(false)
      }

      const token = getToken()
      if (!token) {
        setSubscribed(!!sub)
        return
      }

      try {
        const st = await pushApi.getStatus()
        setServerEnabled(st.server_enabled)

        if (st.subscribed) {
          setSubscribed(true)
          return
        }

        // Browser already has a push subscription but DB has none for this user — attach it.
        if (sub && vkey) {
          try {
            const json = sub.toJSON()
            const ep = json.endpoint
            const keys = json.keys as { p256dh?: string; auth?: string } | undefined
            if (ep && keys?.p256dh && keys?.auth) {
              await pushApi.subscribe({
                endpoint: ep,
                keys: { p256dh: keys.p256dh, auth: keys.auth },
              })
              setSubscribed(true)
              return
            }
          } catch (e) {
            console.error('[push] sync subscription to account failed:', e)
          }
        }

        setSubscribed(false)
      } catch {
        setSubscribed(false)
      }
    }

    void refresh().finally(() => setLoading(false))

    const onAuth = () => {
      setLoading(true)
      void refresh().finally(() => setLoading(false))
    }
    window.addEventListener(AUTH_SESSION_EVENT, onAuth)
    return () => window.removeEventListener(AUTH_SESSION_EVENT, onAuth)
  }, [])

  const subscribe = useCallback(async () => {
    if (!supported || !vapidKey) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const perm = await Notification.requestPermission()
      setPermission(perm as PushPermission)
      if (perm !== 'granted') return

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })

      const json = sub.toJSON()
      await pushApi.subscribe({
        endpoint: json.endpoint!,
        keys: json.keys as { p256dh: string; auth: string },
      })
      setSubscribed(true)
    } catch (e) {
      console.error('[push] subscribe failed:', e)
    } finally {
      setLoading(false)
    }
  }, [supported, vapidKey])

  const unsubscribe = useCallback(async () => {
    if (!supported) return
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        await pushApi.unsubscribe({ endpoint: sub.endpoint })
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (e) {
      console.error('[push] unsubscribe failed:', e)
    } finally {
      setLoading(false)
    }
  }, [supported])

  return { supported, serverEnabled, permission, subscribed, loading, subscribe, unsubscribe }
}
