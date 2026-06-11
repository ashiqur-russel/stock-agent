/* StockAgent service worker — handles Web Push notifications */

self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data?.json() ?? {} } catch { /* ignore */ }

  const title = data.title ?? 'StockAgent Alert'
  const options = {
    body: data.body ?? '',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [200, 100, 200],
    // Same tag replaces, different tags stack. The backend sends a per-ticker
    // tag so an AAPL alert never overwrites a GOOGL alert; the timestamp
    // fallback keeps untagged pushes from replacing each other.
    tag: data.tag ?? `stockagent-${Date.now()}`,
    renotify: true,
    data: { url: data.url ?? '/user/alerts' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/user/alerts'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus an existing tab if the app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        // Otherwise open a new tab
        if (clients.openWindow) return clients.openWindow(url)
      })
  )
})
