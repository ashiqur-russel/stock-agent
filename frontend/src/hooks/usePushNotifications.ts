'use client'

import { useCallback, useEffect, useState } from 'react'
import { push as pushApi } from '@/lib/api'

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
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

    // Register service worker + check existing subscription
    const init = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')
        const sub = await reg.pushManager.getSubscription()
        setSubscribed(!!sub)
      } catch {
        // SW registration failed (e.g. HTTP in production, file not found)
      }

      try {
        const { public_key } = await pushApi.getVapidKey()
        setVapidKey(public_key)
        setServerEnabled(true)
      } catch {
        setServerEnabled(false)
      }

      setLoading(false)
    }

    init()
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
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
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
